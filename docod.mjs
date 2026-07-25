#!/usr/bin/env node
/* ============================================================================
 * docod — the reference implementation of the commands (spec/commands.yaml).
 *
 * The human orchestrates. This gives them the state and the transition — it
 * never decides for them.
 *
 *   docod.mjs status              where we are: exists, counts, blocked, possible
 *   docod.mjs continue <ws>       one workstream's status + next steps
 *   docod.mjs start               where to enter, given what already exists
 *   docod.mjs approve <file> --by <who>
 *                                 the human gate: verdict with a hash in the frontmatter
 *   docod.mjs report              generates the HTML dashboard (documents,
 *                                 kanban, flow, workstreams) — static, offline
 *   docod.mjs ws list             the workstreams and their states
 *   docod.mjs ws done <key>       closes a front
 *   docod.mjs ws abandon <key> --reason "..."
 *                                 abandons — reason MANDATORY
 *
 * Contract with the user: NEVER lie. An approval of content that changed shows
 * up as invalid; a gap shows up as a gap. All state is DERIVED from the files —
 * a hand-maintained index would be the tenth occurrence of this project's
 * recurring failure.
 *
 * ZERO installation dependencies: runs on plain node (>=18); the YAML parser
 * is vendored in vendor/js-yaml.mjs (MIT — vendor/js-yaml.LICENSE). No python,
 * pip, npm install — nothing. Runs at the root of the user's project (where
 * the instance's docod.yaml lives).
 * ==========================================================================*/
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { load as _yload, dump as _ydump, CORE_SCHEMA } from "./vendor/js-yaml.mjs";

// YAML 1.2 core: dates stay STRINGS ("2026-07-17"), as the file says.
// The default schema (1.1) would convert them into Date — and reserialization
// would mutate the user's file. The runtime neither lies nor "improves" what it read.
const yload = (s) => _yload(s, { schema: CORE_SCHEMA });
const ydump = (o, opts = {}) => _ydump(o, { schema: CORE_SCHEMA, ...opts });

const die = (msg) => { console.error(msg); process.exit(1); };

/* ────────────────────────────────────────────────────────────── basic infra */

function sha256Body(p) {
  // Hash of the content EXCLUDING the frontmatter — same rule as staleness:
  // touching status/approval must not invalidate the approval itself.
  const raw = fs.readFileSync(p, "utf-8");
  let body = raw;
  if (raw.startsWith("---")) {
    const i2 = raw.indexOf("---", 3);
    if (i2 >= 0) body = raw.slice(i2 + 3);
  }
  return "sha256:" + crypto.createHash("sha256").update(body, "utf-8").digest("hex").slice(0, 16);
}

function readFrontmatter(p) {
  const raw = fs.readFileSync(p, "utf-8");
  if (!raw.startsWith("---")) return [{}, raw];
  const i2 = raw.indexOf("---", 3);
  if (i2 < 0) return [{}, raw];
  try {
    return [yload(raw.slice(3, i2)) || {}, raw.slice(i2 + 3)];
  } catch {
    return [{}, raw];
  }
}

function writeFrontmatter(p, fm) {
  const raw = fs.readFileSync(p, "utf-8");
  let body = raw;
  if (raw.startsWith("---")) {
    const i2 = raw.indexOf("---", 3);
    if (i2 >= 0) body = raw.slice(i2 + 3);
  }
  fs.writeFileSync(p, "---\n" + ydump(fm, { sortKeys: false }) + "---" + body);
}

/* minimal home-grown glob: `*` within a segment and `**` for depth.
 * fs.globSync only exists from node 22 on — and node>=18 is the honest floor. */
function globq(pattern) {
  const segs = pattern.split(path.sep).filter((s, i) => s !== "" || i === 0);
  const out = [];
  const segRx = (s) => new RegExp("^" + s.split("*").map(x => x.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join("[^/]*") + "$");
  const walk = (dir, i, depth) => {
    if (depth > 24) return;
    if (i === segs.length) { out.push(dir); return; }
    const seg = segs[i];
    if (seg === "" ) { walk(path.sep, i + 1, depth); return; }        // absolute root
    if (seg === "**") {
      walk(dir, i + 1, depth + 1);
      for (const e of readdirSafe(dir))
        if (e.isDirectory()) walk(path.join(dir, e.name), i, depth + 1);
      return;
    }
    if (seg.includes("*")) {
      const rx = segRx(seg);
      for (const e of readdirSafe(dir))
        if (rx.test(e.name)) walk(path.join(dir, e.name), i + 1, depth + 1);
      return;
    }
    const p = path.join(dir, seg);
    if (fs.existsSync(p)) walk(p, i + 1, depth + 1);
  };
  const readdirSafe = (d) => { try { return fs.readdirSync(d, { withFileTypes: true }); } catch { return []; } };
  if (pattern.startsWith(path.sep)) walk(path.sep, 1, 0);
  else walk(".", 0, 0);
  return out.sort();
}

function loadModel(root) {
  const instF = path.join(root, "docod.yaml");
  if (!fs.existsSync(instF)) die(`✗ docod.yaml not found in ${root} — run from the project root`);
  const inst = yload(fs.readFileSync(instF, "utf-8"));
  const specDir = path.normalize(path.join(root, inst?.project?.spec || "./spec/"));
  const arts = yload(fs.readFileSync(path.join(specDir, "artifacts.yaml"), "utf-8")).artifacts;
  const agents = {};
  for (const f of globq(path.join(path.dirname(specDir), "agents", "*.md"))) {
    const [d] = readFrontmatter(f);
    if (d.key) agents[d.key] = d;
  }
  return { inst, arts, agents };
}

function docsRoot(inst) {
  // The artifacts root is the INSTANCE's decision (layer 4). Default: docs/.
  let d = inst?.docsRoot ?? "docs/";
  if (d && !d.endsWith("/")) d += "/";
  return d;
}

function resolvePaths(tpl, root, inst, ws = null) {
  // Unresolvable placeholders ({seq},{slug},{date},{version}) become globs.
  // ONE pattern PER TARGET: a monorepo instance has tasks under every target's
  // tasksRoot, and showing only the first would make the status/report lie by
  // omission (found in the first real project: the report saw part of the tasks).
  let base = tpl.replaceAll("{docsRoot}", docsRoot(inst));
  if (ws) base = base.replaceAll("{ws}", ws);
  const entries = Object.entries(inst.targets || {});
  const perTarget = (entries.length ? entries : [["*", {}]]).map(([name, t]) =>
    base.replaceAll("{target.tasksRoot}", t.tasksRoot || "tasks/")
        .replaceAll("{target.path}", t.path || ".")
        .replaceAll("{target}", name));
  // {ws} with no ws defined ALSO becomes a glob: an unregistered front's artifact
  // must SHOW UP (as a finding), not vanish. The status never lies.
  return [...new Set(perTarget.map(p =>
    path.join(root, p.replace(/\{(seq|slug|date|version|key|ws)\}/g, "*"))))];
}

function findInstances(art, root, inst, ws = null) {
  const achados = new Set();
  for (const [scope, tpl] of Object.entries(art.path || {})) {
    if (scope === "ws" && !ws) continue;
    for (const pat of resolvePaths(tpl, root, inst, ws))
      for (const f of globq(pat)) achados.add(f);
  }
  return [...achados].sort();
}

/* ─────────────────────────────────────────────────────────── derived state */

function effectiveStatus(p) {
  // The status that does NOT lie: approved only counts if the approval hash matches.
  const [fm] = readFrontmatter(p);
  const st = fm.status || "draft";
  const ap = fm.approval;
  if (st === "approved") {
    if (!ap || !ap.content_hash)
      return ["approved?", "⚠ approved with no approval record — who approved it?"];
    if (ap.content_hash !== sha256Body(p))
      return ["review", `⚠ INVALID approval — content changed after the approve by ${ap.by ?? "?"} on ${ap.at ?? "?"}`];
  }
  return [st, null];
}

function wsRegistry(root, inst) {
  return path.join(root, docsRoot(inst), "workstreams.yaml");
}

function loadWorkstreams(root, inst) {
  const f = wsRegistry(root, inst);
  if (!fs.existsSync(f)) return {};
  return yload(fs.readFileSync(f, "utf-8")) || {};
}

function projectState(root, inst, arts, ws = null) {
  const estado = {};
  for (const [key, art] of Object.entries(arts)) {
    if (String(art.owner ?? "").startsWith("{")) continue;
    const itens = [];
    for (const a of findInstances(art, root, inst, ws)) {
      if (!(a.endsWith(".md") || a.endsWith(".yaml"))) continue;
      if (!fs.statSync(a).isFile()) continue;
      if (a.endsWith("workstreams.yaml")) continue;
      const [st, aviso] = a.endsWith(".md") ? effectiveStatus(a) : ["—", null];
      itens.push([path.relative(root, a), st, aviso]);
    }
    if (itens.length) estado[key] = itens;
  }
  return estado;
}

function possibleActions(estado, agents) {
  const okStatus = {};
  for (const [k, v] of Object.entries(estado)) okStatus[k] = new Set(v.map(([, st]) => st));
  const possiveis = [], travadas = [];
  for (const [ag, d] of Object.entries(agents)) {
    for (const [an, a] of Object.entries(d.contract?.actions || {})) {
      const faltas = [];
      for (const r of a?.requires || []) {
        const aceitos = new Set(r.status || []);
        const tem = okStatus[r.artifact] || new Set();
        if (![...tem].some(s => aceitos.has(s))) {
          const falta = `${r.artifact} in [${[...aceitos].sort().map(s => `'${s}'`).join(", ")}]` + (r.waivable ? " (waivable)" : "");
          faltas.push([falta, Boolean(r.waivable)]);
        }
      }
      if (!faltas.length) possiveis.push(`${ag}.${an}`);
      else if (faltas.every(([, w]) => w))
        possiveis.push(`${ag}.${an}  (waivable: missing ${faltas.map(([f]) => f).join("; ")})`);
      else
        travadas.push([`${ag}.${an}`, faltas.filter(([, w]) => !w).map(([f]) => f)]);
    }
  }
  return [possiveis, travadas];
}

/* ──────────────────────────────────────────────────────────────────  comandos */

function cmdStatus(root, ws = null) {
  const { inst, arts, agents } = loadModel(root);
  const wss = loadWorkstreams(root, inst);

  console.log("═".repeat(70));
  console.log(`DOCOD · ${inst?.project?.name ?? "?"} · ${path.basename(root)}`);
  console.log("═".repeat(70));

  if (Object.keys(wss).length) {
    console.log("\nWORKSTREAMS");
    for (const [k, w] of Object.entries(wss)) {
      const marca = { active: "●", done: "✓", abandoned: "✗" }[w.state] ?? "?";
      const extra = w.state === "abandoned" ? ` — ${w.abandoned_reason}` : "";
      console.log(`  ${marca} ${k.padEnd(20)} ${w.state ?? "?"}${extra}`);
    }
  } else {
    console.log("\nWORKSTREAMS: none registered (the prd creates one when run in ws scope)");
  }

  const alvoWs = ws || Object.keys(wss).find(k => wss[k].state === "active") || null;
  const estado = projectState(root, inst, arts, alvoWs);

  // a front on the filesystem NOT in the registry — a finding, not a front
  const registradas = new Set(Object.keys(wss));
  const noFs = new Set(globq(path.join(root, docsRoot(inst), "workstreams", "*"))
    .filter(d => fs.statSync(d).isDirectory()).map(d => path.basename(d)));
  const orfas = [...noFs].filter(k => !registradas.has(k)).sort();

  console.log(`\nARTIFACTS${alvoWs ? " · ws: " + alvoWs : ""}`);
  if (!Object.keys(estado).length) console.log("  (none yet)");
  const avisos = [];
  for (const key of Object.keys(estado).sort()) {
    for (const [rel, st, aviso] of estado[key]) {
      console.log(`  ${st.padEnd(10)} ${rel}`);
      if (aviso) avisos.push(`  ${rel}: ${aviso}`);
    }
  }
  if (orfas.length)
    avisos.push(`  workstreams/ has an unregistered folder: ${orfas.join(", ")} — a folder does not create a front; register or remove it`);
  if (avisos.length) {
    console.log("\nWARNINGS — the status does not lie:");
    for (const a of avisos) console.log(a);
  }

  const [possiveis, travadas] = possibleActions(estado, agents);
  console.log("\nPOSSIBLE NOW (requires satisfied):");
  for (const p of possiveis.sort().slice(0, 14)) console.log(`  → ${p}`);
  if (possiveis.length > 14) console.log(`  … and ${possiveis.length - 14} more`);
  if (travadas.length) {
    console.log("\nBLOCKED (and why):");
    const ts = travadas.sort((a, b) => a[0] < b[0] ? -1 : 1);
    for (const [nome, duras] of ts.slice(0, 10)) console.log(`  ✗ ${nome} — missing ${duras.join("; ")}`);
    if (travadas.length > 10) console.log(`  … and ${travadas.length - 10} more`);
  }
  console.log();
  return 0;
}

function cmdStart(root) {
  const { inst, arts } = loadModel(root);
  const estado = projectState(root, inst, arts);
  const wss = loadWorkstreams(root, inst);
  console.log("ENTRY DOORS — given what exists here:\n");
  if (Object.keys(estado).length || Object.keys(wss).length) {
    console.log("  Artifacts already exist — this is not start, it is a continuation.");
    console.log("  → run `docod.mjs status` and go from what is possible.\n");
    return 0;
  }
  const temCodigo = ["src", "app", "lib", "services", "contexts"].some(d =>
    fs.existsSync(path.join(root, d)) && globq(path.join(root, d, "**", "*.*")).length > 0);
  console.log("  1. From scratch, with a rationale → business-case.create  (why invest?)");
  console.log("  2. From the idea, straight to product → prd.create_prd    (the what and the why)");
  console.log("  3. I have a ready-made PRD (mine or someone else's)");
  console.log("     → prd.create_prd importing: fits it into the structure and flags gaps");
  console.log("       as questions — easy to enter, hard to advance; the gate comes later");
  if (temCodigo) {
    console.log("  4. Legacy code detected        → reverse_* actions: prd, design, contract,");
    console.log("        model — all with provenance (evidence | inferred | user-supplied)");
  }
  console.log("\n  The human invokes the agent; start only points at the door.\n");
  return 0;
}

function cmdApprove(root, arquivo, by, opt) {
  const caminho = path.isAbsolute(arquivo) ? arquivo : path.join(root, arquivo);
  if (!fs.existsSync(caminho)) die(`✗ does not exist: ${arquivo}`);
  const [fm] = readFrontmatter(caminho);
  if ((fm.status || "draft") === "draft")
    console.log("⚠ it is in draft — the flow is draft → review → approved. Approving anyway (recorded).");
  // agent gate before the human one, when it exists
  const { arts } = loadModel(root);
  const gates = ["system-design", "data-design", "api-contract", "infrastructure-design", "security-design", "slos"];
  const nomeBase = path.basename(caminho);
  for (const gk of gates)
    if (arts[gk] && nomeBase.startsWith(gk))
      console.log(`ℹ '${gk}' has an agent gate (design-review). The human approve confirms ON TOP of the verdict — confirm it exists and is newer than the last edit.`);
  // Re-approval of CHANGED content is the "touched a doc" moment — the ad-hoc
  // impact sweep happens exactly here when nothing demands the real one.
  // Mechanics, not posture: re-approving an amended artifact requires either
  // --impact <file> (the impact-analysis that mapped the radius) or
  // --no-impact "<reason>" (a recorded waiver). First approvals are untouched.
  const changed = fm.approval?.content_hash && fm.approval.content_hash !== sha256Body(caminho);
  if (changed) {
    const imp = opt("--impact"), noimp = opt("--no-impact");
    if (imp) {
      const ip = path.isAbsolute(imp) ? imp : path.join(root, imp);
      if (!fs.existsSync(ip)) die(`✗ --impact points at nothing: ${imp}`);
      fm.impact = path.relative(root, ip);
    } else if (noimp && noimp.trim()) {
      fm.impact_waived = noimp.trim();
    } else {
      console.log("✗ this artifact was AMENDED after approval. Re-approving without mapping the radius");
      console.log("  is the ad-hoc sweep that misses stale downstream (it did, on record). Either:");
      console.log(`    docod.mjs approve ${path.relative(root, caminho)} --by ${by} --impact <impact-file>`);
      console.log(`    docod.mjs approve ${path.relative(root, caminho)} --by ${by} --no-impact "<why no radius>"`);
      console.log("  (cosmetic bulk changes have their own door: rebless)");
      return 1;
    }
  }
  // Re-approval visibility: approving content that CHANGED since the last
  // approval deserves eyes on the diff, not a rubber stamp. No forced reading
  // (a checkbox is theater); just make the unread visible and cheap to read.
  if (fm.approval?.content_hash && fm.approval.content_hash !== sha256Body(caminho)) {
    console.log(`ℹ content changed since the approval by ${fm.approval.by ?? "?"} on ${fm.approval.at ?? "?"}.`);
    console.log(`  See what changed before approving, e.g.: git log -p --since="${fm.approval.at ?? ""}" -- ${path.relative(root, caminho)}`);
  }
  const h = sha256Body(caminho);
  fm.status = "approved";
  fm.approval = { by, at: new Date().toISOString().slice(0, 10), content_hash: h };
  writeFrontmatter(caminho, fm);
  console.log(`✓ approved by ${by} · ${h}`);
  console.log("  Validity is mechanical: edit the content and the approval invalidates itself.");
  return 0;
}

function cmdWs(root, sub, key = null, reason = null) {
  const { inst } = loadModel(root);
  const f = wsRegistry(root, inst);
  const wss = loadWorkstreams(root, inst);
  if (sub === "list") {
    if (!Object.keys(wss).length)
      console.log("no workstream registered (the prd creates one when run in ws scope)");
    for (const [k, w] of Object.entries(wss))
      console.log(`  ${k.padEnd(20)} ${String(w.state ?? "?").padEnd(10)} created ${w.created ?? "?"}`);
    return 0;
  }
  if (!(key in wss)) die(`✗ workstream '${key}' not registered in workstreams.yaml`);
  if (sub === "done") wss[key].state = "done";
  else if (sub === "abandon") {
    if (!reason) die("✗ abandoning requires --reason: a ws that vanishes in silence is lost work with no record");
    wss[key].state = "abandoned";
    wss[key].abandoned_reason = reason;
  }
  fs.writeFileSync(f, ydump(wss, { sortKeys: false }));
  console.log(`✓ ${key} → ${wss[key].state}`);
  return 0;
}

function cmdVerify(root, file) {
  // EXTERNAL verification of the computable class — run by the CALLER, never by
  // the producer. Born from the first real test: "deterministic" enforced in
  // band degenerated into self-attestation, and it diverged (wrong hash cited,
  // wrong counts). What a machine can check, a machine checks.
  // Deliberately NOT checked: section names (docs are written in the instance
  // language; matching English names would false-fail, and a false positive
  // trains the user to ignore the alert), and judgment/evidence postconditions
  // (not computable — they remain gated by reviewers).
  const { inst, arts } = loadModel(root);
  const p = path.isAbsolute(file) ? file : path.join(root, file);
  if (!fs.existsSync(p)) die(`✗ does not exist: ${file}`);
  const oks = [], fails = [], warns = [];
  const HASH_RX = /^sha256:[0-9a-f]{8,64}$/;
  const raw = fs.readFileSync(p, "utf-8");
  let fm = {};
  let body0 = "";
  if (raw.startsWith("---")) { const j = raw.indexOf("---", 3); if (j >= 0) body0 = raw.slice(j + 3); }
  if (p.endsWith(".yaml") || p.endsWith(".yml")) {
    try { yload(raw); oks.push("YAML parses"); } catch (e) { fails.push("YAML does not parse: " + String(e.message).split("\n")[0]); }
  } else if (raw.startsWith("---")) {
    const i2 = raw.indexOf("---", 3);
    try { fm = yload(raw.slice(3, i2)) || {}; oks.push("frontmatter parses"); }
    catch (e) { fails.push("frontmatter does not parse: " + String(e.message).split("\n")[0]); }
  } else fails.push("no frontmatter (--- block) at the top");
  if (fm.status) {
    if (["draft", "review", "approved"].includes(fm.status)) oks.push(`status '${fm.status}' valid`);
    else fails.push(`status '${fm.status}' not in draft|review|approved`);
  }
  if (fm.status === "approved") {
    if (!fm.approval?.content_hash) fails.push("approved without approval.content_hash");
    else if (fm.approval.content_hash !== sha256Body(p)) fails.push("approval hash MISMATCH — content changed after the approve");
    else oks.push("approval hash matches the current content");
  }
  let selfKey = null, selfArt = null;
  for (const [k, a] of Object.entries(arts))
    if (findInstances(a, root, inst, "*").includes(p)) { selfKey = k; selfArt = a; break; }
  if (selfKey) oks.push(`registered artifact: ${selfKey}` + (selfArt.lineage === "snapshot" ? " (snapshot — inputs are observed-at)" : ""));
  // Cited-but-undeclared guard: a body that cites ADR-nnnn the frontmatter does
  // not declare is a link the machine cannot check (declared-inputs-coverage).
  {
    // Extract the ADR NUMBER from the key whatever its shape (slug "0004-sync"
    // or full path ".../adr/0004-sync...md") — slice(0,4) matched "docs" on
    // path keys and false-warned on EVERY declared ADR. When everything warns,
    // nothing warns.
    const declared = new Set();
    for (const i of (fm.inputs || [])) if (i.artifact === "adr") {
      const m = String(i.key ?? "").match(/(\d{3,4})/);
      if (m) declared.add(m[1].padStart(4, "0"));
    }
    const cited = new Set([...body0.matchAll(/ADR-(\d{3,4})/g)].map(m => m[1].padStart(4, "0")));
    for (const n of cited) if (![...declared].some(k => k.startsWith(n)))
      warns.push(`body cites ADR-${n} but inputs[] does not declare it — undeclared link, invisible to staleness`);
  }
  for (const inp of fm.inputs || []) {
    if (inp.hash != null && !HASH_RX.test(String(inp.hash)))
      warns.push(`input ${inp.artifact}: hash field holds a NON-HASH value ('${String(inp.hash).slice(0, 40)}') — placeholder written instead of a computed hash`);
    if (inp.external) { oks.push(`input ${inp.artifact}: external provenance (recorded, not resolvable)`); continue; }
    const art = arts[inp.artifact];
    if (!art) { fails.push(`input '${inp.artifact}' is not a registered artifact (mark it external: true if it is outside the registry)`); continue; }
    if (selfArt?.lineage === "snapshot") {
      // a RECORD points at the versions it analyzed; "refreshing" them would lie
      oks.push(`input ${inp.artifact}: observed-at ${inp.hash} (snapshot lineage — not live-checked)`);
      continue;
    }
    if (art.append_only) {
      oks.push(`input ${inp.artifact}: observed state of an append-only source (grows by design — not live-checked)`);
      continue;
    }
    const cand = findInstances(art, root, inst, "*").filter(f => (f.endsWith(".md") || f.endsWith(".yaml")) && fs.statSync(f).isFile());
    const hit = cand.find(f => sha256Body(f) === inp.hash);
    if (hit) oks.push(`input ${inp.artifact}: hash matches ${path.relative(root, hit)}`);
    else fails.push(`input ${inp.artifact}: NO instance matches the declared hash — stale input or wrong hash`);
  }
  // Attribution mismatch — first-class opposition of two judgments with
  // opposite biases: qa says a bug is local, the diff review smells upstream.
  // Neither alone is the alarm; the DISAGREEMENT is. Warn, not fail: two
  // low-confidence judgments disagreeing deserve eyes, not a halted line.
  if (selfKey === "codereview" && Array.isArray(fm.upstream_smells) && fm.upstream_smells.length) {
    const qaP = path.join(path.dirname(p), "qa.md");
    if (!fs.existsSync(qaP)) warns.push("upstream_smells declared but no sibling qa.md to oppose them against");
    else {
      const [qfm] = readFrontmatter(qaP);
      const bugs = Object.fromEntries((qfm.bugs || []).map(x => [x.id, x.root_cause]));
      for (const id of fm.upstream_smells)
        if (bugs[id] === "local")
          warns.push(`attribution MISMATCH on ${id}: qa says local, review smells upstream — oppose them before merging`);
    }
  }
  for (const o of oks) console.log(`  ✓ ${o}`);
  for (const w of warns) console.log(`  ⚠ ${w}`);
  for (const f of fails) console.log(`  ✗ ${f}`);
  console.log(fails.length ? `VERIFY FAILED — ${fails.length} problem(s)` :
    warns.length ? `VERIFY OK — with ${warns.length} warning(s)` : "VERIFY OK");
  return fails.length ? 1 : 0;
}

function cmdRebless(root, by, reason, yes, repin) {
  // The cascade-cost answer: a batched re-approval that shows its plan and
  // records its reason — never a silent rubber stamp. Born from a real case:
  // a product rename touched 361 prose points and invalidated 32 approvals.
  // Guards: --reason is MANDATORY and stored inside every re-approval (audit
  // shows it was a batch, and why); without --yes it only prints the plan;
  // input re-pins only for live-lineage inputs resolving to exactly one
  // current instance; snapshot/append-only/external inputs are never touched
  // (re-pinning a record would lie about what it analyzed).
  if (!reason || !reason.trim()) die("rebless requires --reason: a batch re-approval without a recorded why IS the rubber stamp");
  const { inst, arts } = loadModel(root);
  const plan = [];
  for (const [key, art] of Object.entries(arts)) {
    if (String(art.owner ?? "").startsWith("{")) continue;
    for (const f of findInstances(art, root, inst, "*")) {
      if (!f.endsWith(".md") || !fs.existsSync(f) || !fs.statSync(f).isFile()) continue;
      const [fm] = readFrontmatter(f);
      const invalid = fm.status === "approved" && fm.approval?.content_hash && fm.approval.content_hash !== sha256Body(f);
      const stale = [];
      if (repin && art.lineage !== "snapshot") for (const inp of fm.inputs || []) {
        if (inp.external) continue;
        const src = arts[inp.artifact];
        if (!src || src.append_only) continue;
        const cand = findInstances(src, root, inst, "*").filter(x => (x.endsWith(".md") || x.endsWith(".yaml")) && fs.statSync(x).isFile());
        if (cand.some(x => sha256Body(x) === inp.hash)) continue;
        // Eligibility is cardinality of RESOLUTION, not of type (found on day
        // one: adr has 11 instances, but the input's key names exactly one —
        // refusing an identified source is not honesty, it is a coarse guard).
        let tgt = null;
        if (cand.length === 1) tgt = cand[0];
        else if (inp.key) {
          // Normalize BOTH sides: extension off, path relative — keys are
          // written by agents as slugs OR paths, with or without .md (third
          // sub-edge: slash-keys came without extension and endsWith failed).
          const strip = (q) => String(q).replace(/\.(md|yaml)$/, "").replace(/^\.\//, "");
          const kk = strip(inp.key);
          const kb = path.basename(kk);
          const relOf = (x) => strip(path.relative(root, x));
          for (const test of [
            (x) => relOf(x) === kk,
            (x) => relOf(x).endsWith("/" + kk),
            (x) => path.basename(relOf(x)) === kb,
            (x) => path.basename(relOf(x)).startsWith(kb),
            (x) => path.basename(relOf(x)).includes(kb),
          ]) { const m = cand.filter(test); if (m.length === 1) { tgt = m[0]; break; } if (m.length > 1) break; }
        }
        if (tgt) stale.push([inp, tgt]);
      }
      if (invalid || stale.length) plan.push({ f, fm, key, invalid, stale });
    }
  }
  if (!plan.length) { console.log("nothing to rebless — no invalid approvals, no re-pinnable inputs"); return 0; }
  console.log(`REBLESS PLAN — reason: "${reason}"`);
  for (const p of plan) {
    const rel = path.relative(root, p.f);
    console.log(`  ${p.invalid ? "re-approve" : "          "}  ${rel}` + (p.stale.length ? `  (+${p.stale.length} input re-pin)` : ""));
    if (p.invalid) console.log(`     diff: git log -p --since="${p.fm.approval.at ?? ""}" -- ${rel}`);
  }
  if (!yes) {
    console.log(`${plan.filter(p => p.invalid).length} re-approval(s), ${plan.reduce((n, p) => n + p.stale.length, 0)} input re-pin(s).`);
    console.log("This was the PLAN. Read the diffs, then run again with --yes to execute.");
    return 0;
  }
  for (const p of plan) {
    for (const [inp, srcFile] of p.stale) inp.hash = sha256Body(srcFile);
    if (p.invalid) p.fm.approval = { by, at: new Date().toISOString().slice(0, 10), content_hash: null, rebless_reason: reason };
    writeFrontmatter(p.f, p.fm);
    if (p.invalid) { const [fm2] = readFrontmatter(p.f); fm2.approval.content_hash = sha256Body(p.f); writeFrontmatter(p.f, fm2); }
    console.log(`  ok ${path.relative(root, p.f)}`);
  }
  console.log(`rebless done by ${by} — the reason travels inside every approval it touched.`);
  return 0;
}

function cmdReport(root) {
  // O dashboard é o `status` com rosto: MESMO derived state, zero opinião
  // of its own. Static and self-contained — no server, no CDN, works offline.
  const { inst, arts, agents } = loadModel(root);
  const wss = loadWorkstreams(root, inst);
  const dr = docsRoot(inst);

  const docsByGroup = {};
  const estado = {};   // for possible/blocked — same as status
  const tasks = [];
  for (const [key, art] of Object.entries(arts)) {
    if (String(art.owner ?? "").startsWith("{")) continue;
    // ws: "*" — the report shows ALL fronts, orphan folders included
    for (const a of findInstances(art, root, inst, "*")) {
      if (!(a.endsWith(".md") || a.endsWith(".yaml"))) continue;
      if (!fs.existsSync(a) || !fs.statSync(a).isFile()) continue;
      if (a.endsWith("workstreams.yaml")) continue;
      const rel = path.relative(root, a);
      const [fm, body] = readFrontmatter(a);
      const isMd = a.endsWith(".md");
      const [st, warning] = isMd ? effectiveStatus(a) : ["—", null];
      (estado[key] ??= []).push([rel, st, warning]);

      const title = (body.match(/^#\s+(.+)$/m) || [])[1] || path.basename(a);
      const item = {
        artifact: key, kind: art.kind || null, path: rel, title,
        status: st, warning, verdict: fm.verdict || null,
        approval: fm.approval ? { by: fm.approval.by, at: String(fm.approval.at ?? "") } : null,
        changed: Boolean(isMd && fm.approval?.content_hash && fm.approval.content_hash !== sha256Body(a)),
        body: isMd ? body.trim() : "```yaml\n" + body.trim() + "\n```",
      };
      if (key === "task") {
        const checked = (body.match(/-\s\[[xX]\]/g) || []).length;
        const unchecked = (body.match(/-\s\[\s\]/g) || []).length;
        const total = checked + unchecked;
        tasks.push({ ...item, checked, total, where: path.dirname(rel),
          lane: total ? (checked === total ? "done"
                         : checked > 0 ? "doing"
                         : fm.execution?.started ? "doing"   // stamped start: worked, nothing verified yet
                         : "todo")
                      : (st === "approved" ? "done" : fm.execution?.started ? "doing" : "todo") });
        continue; // tasks live in the kanban, not duplicated among documents
      }
      const group = rel.startsWith(dr)
        ? (rel.slice(dr.length).split("/").length > 1 ? rel.slice(dr.length).split("/")[0] : "root")
        : "target · next to the code";
      (docsByGroup[group] ??= []).push(item);
    }
  }

  const ORDER = ["product", "design", "decisions", "quality", "ops", "releases",
                 "standards", "workstreams", "root", "target · next to the code"];
  const docs = Object.keys(docsByGroup)
    .sort((a, b) => (ORDER.indexOf(a) + 99 * (ORDER.indexOf(a) < 0)) -
                    (ORDER.indexOf(b) + 99 * (ORDER.indexOf(b) < 0)))
    .map(g => ({ group: g, items: docsByGroup[g] }));

  const [possible, blocked] = possibleActions(estado, agents);

  const data = {
    project: inst?.project?.name ?? path.basename(root),
    language: inst?.language ?? "en",
    docsRoot: dr, generatedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    node: process.version, workstreams: wss, docs, tasks,
    possible: possible.sort(), blocked: blocked.sort((x, y) => x[0] < y[0] ? -1 : 1),
  };

  const here = path.dirname(fileURLToPath(import.meta.url));
  const tpl = fs.readFileSync(path.join(here, "report-template.html"), "utf-8");
  // < prevents a `</script>` inside a document from closing the JSON block
  const payload = JSON.stringify(data).replace(/</g, "\\u003c");
  const out = path.join(here, "report.html");
  // function replacement: a plain string here would interpret $&, $`, $' as
  // patterns — one shell snippet in a document body corrupted the JSON once.
  fs.writeFileSync(out, tpl.replace('"__DOCOD_DATA__"', () => payload));
  console.log(`✓ report → ${path.relative(root, out)}`);
  console.log(`  open it in the browser: open ${path.relative(root, out)}`);
  console.log("  (static: reflects the state of NOW — regenerate after changes)");
  return 0;
}

/* ─────────────────────────────────────────────────────────────────────── cli */

function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : null; };
  const pos = [];
  for (let i = 1; i < argv.length; i++) {
    if (argv[i].startsWith("--")) { i++; continue; }  // skip the flag and its value
    pos.push(argv[i]);
  }
  const root = process.cwd();
  switch (cmd) {
    case "status":   return cmdStatus(root, opt("--ws"));
    case "continue": {
      if (!pos[0]) die("usage: docod.mjs continue <ws>");
      return cmdStatus(root, pos[0]);
    }
    case "start":    return cmdStart(root);
    case "report":   return cmdReport(root);
    case "rebless": {
      const by = opt("--by"), reason = opt("--reason");
      if (!by) die('usage: docod.mjs rebless --by <who> --reason "..." [--repin-inputs] [--yes]');
      return cmdRebless(root, by, reason, argv.includes("--yes"), argv.includes("--repin-inputs"));
    }
    case "verify": {
      if (!pos[0]) die("usage: docod.mjs verify <file>");
      return cmdVerify(root, pos[0]);
    }
    case "approve": {
      const by = opt("--by");
      if (!pos[0] || !by) die("usage: docod.mjs approve <file> --by <who>");
      return cmdApprove(root, pos[0], by, opt);
    }
    case "ws": {
      const sub = pos[0];
      if (!["list", "done", "abandon"].includes(sub)) die("usage: docod.mjs ws list|done|abandon <key> [--reason ...]");
      return cmdWs(root, sub, pos[1] ?? null, opt("--reason"));
    }
    default:
      die("commands: status [--ws X] · continue <ws> · start · report · verify <file> · rebless · approve <file> --by <who> · ws list|done|abandon");
  }
}

process.exit(main());
