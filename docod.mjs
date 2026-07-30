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

  // CONFIG GAP — the product language was never chosen. install.sh writes it
  // `unset` on purpose (rules.yaml: no invented value; an unanswered field is a
  // declared GAP). Any agent about to PRODUCE must resolve it FIRST — ask the
  // user, record it in docod.yaml — whatever door they entered. Surfaced here
  // because status is the state every door derives from: one trigger, door-blind.
  {
    const lang = String(inst?.language ?? "").trim().toLowerCase();
    if (!lang || lang === "unset" || lang === "ask") {
      console.log("\n⚠ CONFIG GAP: docod.yaml `language:` is UNSET — the product language was never chosen.");
      console.log("  Before producing ANY artifact, inquiry or report, ask the user which language");
      console.log("  (the method reasons in English; the product speaks theirs: en, pt-BR, es, de…)");
      console.log("  and record it in docod.yaml. No door skips this; there is no silent default.");
    }
  }

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

  // EXTERNAL QUESTIONS — the single queue (artifacts.yaml: external-questions).
  // Nobody inside the project can close these; scattered across per-agent
  // logs they are the easiest thing to lose. The status chases them.
  {
    const eqF = path.join(root, docsRoot(inst), "decisions", "external-questions.yaml");
    if (fs.existsSync(eqF)) {
      let eq = [];
      try { eq = yload(fs.readFileSync(eqF, "utf-8")) || []; } catch { /* verify reports parse errors */ }
      const open = (Array.isArray(eq) ? eq : []).filter(q => (q?.state ?? "open") === "open");
      if (open.length) {
        console.log(`\nEXTERNAL QUESTIONS — ${open.length} open (only an outside owner can close these; chase the owner):`);
        for (const q of open.slice(0, 8))
          console.log(`  ? [${q.id ?? "?"}] → ${q.owner ?? "?"}: ${String(q.question ?? "").split("\n")[0].slice(0, 90)}`);
        if (open.length > 8) console.log(`  … and ${open.length - 8} more`);
      }
    }
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

function cmdWs(root, sub, key = null, reason = null, name = null) {
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
  if (sub === "add") {
    // The LIGHT door — the recorded exception, not a second default. The prd
    // remains the entry of a front (the what and the why); this exists for the
    // front whose work ALREADY EXISTS with file, approach and criteria (field
    // case: seven fix tasks that would have cost two artifacts to restate what
    // a report had already stated). A method better served by being bypassed
    // in a legitimate case is information about the method — this is the
    // method absorbing it. --reason is MANDATORY and travels in the registry:
    // a front born outside the prd without a recorded why is a front nobody
    // can audit.
    if (!key) die('usage: docod.mjs ws add <key> --reason "..." [--name "..."]');
    if (key in wss) die(`✗ workstream '${key}' is already registered`);
    if (!reason || !reason.trim())
      die('✗ ws add requires --reason: the prd is the default door; entering without it needs a recorded why (e.g. "tasks pre-exist from the field report of <date>")');
    wss[key] = {
      name: name || key, state: "active",
      created: new Date().toISOString().slice(0, 10),
      registered_by: "ws add", registered_reason: reason.trim(),
    };
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, ydump(wss, { sortKeys: false }));
    console.log(`✓ ${key} → active (light registration, reason recorded)`);
    console.log("  The prd remains the default door — a front with a what-and-why still deserves one.");
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
  // WHAT IT CHECKS: parseability, status validity, approval hash, input
  // provenance/hashes, COMPLETENESS (section count vs the contract's declared
  // minimum, kept frontmatter promises, presence of status) and prose
  // references (undeclared ADR links, prose-cited hashes, file:line anchors).
  // Completeness entered after the field case that named this command a liar:
  // a truncated FRD — 11 requirements and 4 sections short, its promised
  // frd.yaml missing — passed with VERIFY OK and a hundred ✓.
  // Deliberately NOT checked: section NAMES (docs are written in the instance
  // language; matching English names would false-fail, and a false positive
  // trains the user to ignore the alert — hence COUNT, which is language-
  // neutral), and judgment/evidence postconditions (not computable — they
  // remain gated by reviewers).
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
  // COMPLETENESS — the truncation detector. The contract (artifacts.yaml)
  // declares the MINIMUM sections; a run that died mid-write leaves fewer
  // `##` heads than the contract. COUNT, not names: instance docs are written
  // in the instance language, and name-matching would false-fail. A declared
  // "Title" section rides in the H1, not in an H2 — discounted.
  if (selfKey && selfArt.sections && p.endsWith(".md")) {
    const min = selfArt.sections.length -
      (String(selfArt.sections[0]).toLowerCase() === "title" ? 1 : 0);
    const got = (body0.match(/^##\s+/gm) || []).length;
    if (got < min) fails.push(`document has ${got} section(s) ('##' headings); the '${selfKey}' contract declares ${min} minimum — truncated or incomplete run`);
    else oks.push(`sections: ${got} ≥ ${min} declared minimum`);
  }
  // The incomplete-run marker: the producer stamps `status` LAST (see
  // agent.yaml `write_order`). A registered artifact with a body and no
  // status is an interrupted run by definition. Rules are exempt (kind: rule
  // documents are discipline, not runs).
  if (selfKey && p.endsWith(".md") && selfArt.kind !== "rule" && !fm.status)
    fails.push(`registered artifact with no 'status' in the frontmatter — an interrupted run (the producer stamps status LAST; its absence IS the incomplete-run marker)`);
  // KEPT PROMISES — a frontmatter that names a companion file promises it
  // exists; an interrupted run leaves promises unkept and nothing noticed
  // (field case: the truncated FRD's promised frd.yaml). inputs[] is excluded
  // (artifact references, resolved by hash below); approval is metadata.
  {
    const promised = [];
    const walk = (v, trail) => {
      if (trail[0] === "inputs" || trail[0] === "approval") return;
      if (trail[trail.length - 1] === "template") return; // bundle mold reference (rules), not an instance promise
      if (typeof v === "string") {
        if (/^[\w][\w./-]*\.(md|ya?ml)$/.test(v) && !v.includes("*")) promised.push([trail.join("."), v]);
      } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, [...trail, i]));
      else if (v && typeof v === "object") for (const [k2, x] of Object.entries(v)) walk(x, [...trail, k2]);
    };
    for (const [k2, v] of Object.entries(fm)) walk(v, [k2]);
    for (const [field, rel] of promised) {
      if ([path.join(path.dirname(p), rel), path.join(root, rel)].some(c => fs.existsSync(c)))
        oks.push(`frontmatter promise kept: ${field} → ${rel}`);
      else fails.push(`frontmatter promises '${rel}' (${field}) and it does not exist — an interrupted run leaves its promises unkept`);
    }
  }
  // Cited-but-undeclared guard: a body that cites ADR-nnnn the frontmatter does
  // not declare is a link the machine cannot check (declared-inputs-coverage).
  // SKIPPED for append-only logs (counsel): citing ADRs is their function —
  // the log is the ADR's prehistory, and warning on every entry is noise by
  // construction. And a document never cites ITSELF into staleness: the ADR's
  // own number (its `## structure` requires the ID in the title) is excluded —
  // an alert that fires on every ADR ever written trains the reader to skip
  // the line where a real problem will one day be.
  if (!selfArt?.append_only) {
    // Extract the ADR NUMBER from the key whatever its shape (slug "0004-sync"
    // or full path ".../adr/0004-sync...md") — slice(0,4) matched "docs" on
    // path keys and false-warned on EVERY declared ADR. When everything warns,
    // nothing warns.
    const declared = new Set();
    for (const i of (fm.inputs || [])) if (i.artifact === "adr") {
      const m = String(i.key ?? "").match(/(\d{3,4})/);
      if (m) declared.add(m[1].padStart(4, "0"));
    }
    let own = null;
    if (selfKey === "adr" || p.split(path.sep).includes("adr")) {
      const m = path.basename(p).match(/^(\d{3,4})-/);
      if (m) own = m[1].padStart(4, "0");
    }
    const cited = new Set([...body0.matchAll(/ADR-(\d{3,4})/g)].map(m => m[1].padStart(4, "0")));
    for (const n of cited) if (n !== own && ![...declared].some(k => k.startsWith(n)))
      warns.push(`body cites ADR-${n} but inputs[] does not declare it — undeclared link, invisible to staleness`);
  }
  // PROSE REFERENCES — the two rot vectors caught in the field, four times,
  // four owners. (a) A hash quoted in the BODY is a claim staleness does not
  // watch: one survived three rounds and an approval while wrong. Check it
  // against every current instance and the declared inputs; matching nothing
  // means it drifted or was born wrong. (b) A NAKED file:line anchor rots on
  // any edit of the cited file and nothing tells the citer — warned on LIVE
  // lineage only (a snapshot is a record of a moment; its anchors observe,
  // they do not rot). NAKED is the operative word: the reverse's evidence
  // discipline REQUIRES file:line citations of code, and a guard that fires
  // on the method's own prescribed output is defect #3 reborn. The line is
  // drawn by content, and CHECKED not trusted: an anchor carrying the observed
  // fragment in backticks on the same line (`path:line` + `what was seen`) is
  // re-read against the cited file — fragment at the line = evidence proven,
  // fragment elsewhere = the drift caught and named, fragment gone = evidence
  // rotted. Presence of backticks is not a free pass (that is gameable); the
  // machine checks the fragment, the same "what a machine can check, a machine
  // checks" the correction gate will use.
  {
    const citedHashes = [...body0.matchAll(/sha256:([0-9a-f]{8,64})/g)].map(m => m[1]);
    if (citedHashes.length) {
      const current = new Set();
      for (const a of Object.values(arts))
        for (const f of findInstances(a, root, inst, "*"))
          if ((f.endsWith(".md") || f.endsWith(".yaml")) && fs.existsSync(f) && fs.statSync(f).isFile())
            current.add(sha256Body(f).slice("sha256:".length));
      for (const i of (fm.inputs || [])) {
        const m = String(i.hash ?? "").match(/^sha256:([0-9a-f]+)$/);
        if (m) current.add(m[1].slice(0, 16));
      }
      for (const h of new Set(citedHashes)) {
        const pre = h.slice(0, 16);
        if (![...current].some(c => c.startsWith(pre) || pre.startsWith(c)))
          warns.push(`body cites hash sha256:${h.slice(0, 12)}… that matches NO current artifact and NO declared input — a prose hash nothing watches; declare it in inputs[] or drop it from the text`);
      }
    }
    if (selfArt && selfArt.lineage !== "snapshot" && p.endsWith(".md")) {
      const TLD = /^(com|org|net|io|ai|dev|co|br)$/;
      const ANCHOR = /([\w./-]+\.([a-z]{1,4})):(\d{1,5})\b/g;
      const norm = (s) => s.replace(/\s+/g, " ").trim();
      const fileCache = new Map();
      const readLines = (fp) => { if (!fileCache.has(fp)) fileCache.set(fp, fs.readFileSync(fp, "utf-8").split("\n")); return fileCache.get(fp); };
      const resolveFile = (rel) => {
        for (const c of [path.join(path.dirname(p), rel), path.join(root, rel)])
          if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
        return null;
      };
      const W = 2; // window around the cited line: tolerate small edits, catch real drift
      let naked = 0, proven = 0, drifted = 0, rotted = 0, unresolvable = 0;
      for (const line of body0.split("\n")) {
        const anchors = [...line.matchAll(ANCHOR)].filter(m => !TLD.test(m[2]));
        if (!anchors.length) continue;
        // backtick spans that are NOT themselves anchors = the observed fragments
        const frags = [...line.matchAll(/`([^`]+)`/g)].map(m => m[1])
          .filter(s => ![...s.matchAll(ANCHOR)].some(m => !TLD.test(m[2])));
        for (const a of anchors) {
          if (!frags.length) { naked++; continue; }        // presence is required, but not enough
          const file = resolveFile(a[1]);
          if (!file) { unresolvable++; continue; }          // carries a fragment, cannot verify
          const srcLines = readLines(file), ln = +a[3];
          const win = norm(srcLines.slice(Math.max(0, ln - 1 - W), ln + W).join(" "));
          const whole = norm(srcLines.join(" "));
          let hit = false, near = false;
          for (const fr of frags) { const nf = norm(fr); if (!nf) continue; if (win.includes(nf)) { hit = true; break; } if (whole.includes(nf)) near = true; }
          if (hit) proven++; else if (near) drifted++; else rotted++;
        }
      }
      if (proven) oks.push(`prose evidence: ${proven} file:line anchor(s) verified — the observed fragment is present at the cited line`);
      if (naked)
        warns.push(`body anchors ${naked} reference(s) by NAKED file:line (no observed fragment alongside) — a bare line anchor rots on any edit of the cited file and nothing tells the citer; cite the anchor WITH the observed fragment in backticks on the same line, or reference by section name and declare the source in inputs[]`);
      if (drifted)
        warns.push(`${drifted} file:line anchor(s) DRIFTED — the observed fragment is no longer at the cited line but still exists elsewhere in the cited file; the line moved, update the anchor`);
      if (rotted)
        warns.push(`${rotted} file:line anchor(s) carry an observed fragment that is GONE from the cited file — evidence rotted or was mis-transcribed; re-verify against the current code`);
      if (unresolvable)
        warns.push(`${unresolvable} file:line anchor(s) carry a fragment but the cited path could not be resolved to verify it — check the path is project-relative`);
    }
  }
  // ABSOLUTE-ABSENCE guard — a produced narrative that claims no rationale/decision
  // exists at all ("not one why", "no decision on file", "never recorded") over-reads
  // a metric: a zero in ONE census class is not absence of the concept. The field
  // flatten was "0 user-supplied / 0 decided → not one why was ever recorded" — false,
  // because legacy rationale lives in `external`, recorded not ratified (see agent.yaml
  // reverse_conventions.census). Flag it so the author confirms against the sibling
  // classes or qualifies it. Snapshot narratives only; what a machine can check, it checks.
  if (p.endsWith(".md") && selfArt?.lineage === "snapshot") {
    const ABS = [
      /\bnot one\b[^.]{0,40}\b(?:why|rationale|reason|decision|recorded)/i,
      /\bno\b[^.,;]{0,30}\b(?:why|rationale|reason|decision)\b[^.,;]{0,30}\b(?:recorded|documented|exists?|on file|ever)/i,
      /\b(?:never|not once)\b[^.,;]{0,25}\b(?:recorded|decided|ratified|documented)\b/i,
      /\bnenhum[ao]?\b[^.,;]{0,45}\b(?:porqu|raz[aã]o|decis|registrad|documentad)/i,
    ];
    const hits = [];
    for (const line of body0.split("\n"))
      for (const rx of ABS) { const m = line.match(rx); if (m) { hits.push(m[0].replace(/\s+/g, " ").trim().slice(0, 56)); break; } }
    if (hits.length)
      warns.push(`${hits.length} absolute-absence claim(s) about rationale/decisions (e.g. "${hits[0]}…") — a zero in one census class is NOT absence of the concept; legacy rationale lives in 'external' (recorded, not ratified). Confirm each against the sibling classes, or qualify it ("recorded but never re-ratified")`);
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
  const plan = [], unresolved = [];
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
          // Fourth key shape found in the field: "project (docs/product/prd.md)"
          // — scope-prefixed with parentheses, written by agents. A trailing
          // parenthesized group that looks like a path IS the key; unwrap it
          // before normalizing (extension-strip and basename both choke on the
          // closing paren otherwise).
          let kraw = String(inp.key);
          const par = kraw.match(/\(([^()]+)\)\s*$/);
          if (par) kraw = par[1].trim();
          const strip = (q) => String(q).replace(/\.(md|yaml)$/, "").replace(/^\.\//, "");
          const kk = strip(kraw);
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
        // "I don't know how to resolve this" is an ANSWER, never a silence.
        // Dropping the input here and later printing "nothing to rebless" let
        // a stale input walk out looking whole — a silent failure in the worst
        // direction a tool can fail. Record it; report it; exit non-zero.
        else unresolved.push({
          f, artifact: inp.artifact, key: inp.key ?? null,
          why: cand.length === 0 ? `no current instance of '${inp.artifact}' exists`
             : inp.key ? `key does not single out one of ${cand.length} candidate(s)`
             : `${cand.length} candidates and no key to tell them apart`,
        });
      }
      if (invalid || stale.length) plan.push({ f, fm, key, invalid, stale });
    }
  }
  const printUnresolved = () => {
    if (!unresolved.length) return;
    console.log(`\nCANNOT RESOLVE — ${unresolved.length} stale input(s) this tool will not guess at:`);
    for (const u of unresolved)
      console.log(`  ? ${path.relative(root, u.f)}: input '${u.artifact}'${u.key ? ` key '${u.key}'` : ""} — ${u.why}`);
    console.log("  Fix the input's key (or the missing source), or re-pin by hand — but know it is pending.");
  };
  if (!plan.length) {
    if (unresolved.length) {
      printUnresolved();
      console.log(`0 rebless-able; ${unresolved.length} unresolved. This is "I don't know how", NOT "nothing to do".`);
      return 1;
    }
    console.log("nothing to rebless — no invalid approvals, no re-pinnable inputs");
    return 0;
  }
  console.log(`REBLESS PLAN — reason: "${reason}"`);
  for (const p of plan) {
    const rel = path.relative(root, p.f);
    console.log(`  ${p.invalid ? "re-approve" : "          "}  ${rel}` + (p.stale.length ? `  (+${p.stale.length} input re-pin)` : ""));
    if (p.invalid) console.log(`     diff: git log -p --since="${p.fm.approval.at ?? ""}" -- ${rel}`);
  }
  printUnresolved();
  if (!yes) {
    console.log(`${plan.filter(p => p.invalid).length} re-approval(s), ${plan.reduce((n, p) => n + p.stale.length, 0)} input re-pin(s)` +
      (unresolved.length ? `, ${unresolved.length} UNRESOLVED (manual)` : "") + ".");
    console.log("This was the PLAN. Read the diffs, then run again with --yes to execute.");
    return unresolved.length ? 1 : 0;
  }
  for (const p of plan) {
    for (const [inp, srcFile] of p.stale) inp.hash = sha256Body(srcFile);
    if (p.invalid) p.fm.approval = { by, at: new Date().toISOString().slice(0, 10), content_hash: null, rebless_reason: reason };
    writeFrontmatter(p.f, p.fm);
    if (p.invalid) { const [fm2] = readFrontmatter(p.f); fm2.approval.content_hash = sha256Body(p.f); writeFrontmatter(p.f, fm2); }
    console.log(`  ok ${path.relative(root, p.f)}`);
  }
  console.log(`rebless done by ${by} — the reason travels inside every approval it touched.` +
    (unresolved.length ? ` ${unresolved.length} input(s) remain UNRESOLVED (listed above).` : ""));
  return unresolved.length ? 1 : 0;
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

function cmdDiagnosticReport(root) {
  // The SELLABLE surface of diagnostic mode. Same discipline as `report`: static,
  // self-contained, zero opinion of its own — it renders the `report:` data block
  // the tech-lead's consolidate_diagnostic already emitted (artifacts.yaml §
  // diagnostic, REPORT DATA CONTRACT). The template is dumb; the data is the work.
  const { inst } = loadModel(root);
  const dir = path.join(root, docsRoot(inst), "quality", "diagnostic");
  const files = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter(f => f.endsWith(".md") && !f.endsWith("-report.md")).map(f => path.join(dir, f))
    : [];
  if (!files.length)
    die(`✗ no diagnostic artifact in ${path.relative(root, dir)} — run /docod:diagnose first`);
  files.sort((a, b) => (a < b ? 1 : -1)); // latest by dated {date}-{slug} name
  const dxFile = files[0];
  const [fm] = readFrontmatter(dxFile);
  const report = fm.report;
  if (!report || typeof report !== "object")
    die(`✗ ${path.relative(root, dxFile)} has no \`report:\` block — consolidate_diagnostic must emit the data contract (artifacts.yaml § diagnostic)`);
  const here = path.dirname(fileURLToPath(import.meta.url));
  const tpl = fs.readFileSync(path.join(here, "diagnostic-template.html"), "utf-8");
  // < prevents a `</script>` inside any observed fragment from closing the block;
  // function replacement so $&, $`, $' in a fragment are not read as patterns.
  const payload = JSON.stringify(report).replace(/</g, "\\u003c");
  const out = dxFile.replace(/\.md$/, "-report.html");
  fs.writeFileSync(out, tpl.replace("__DIAGNOSTIC_JSON__", () => payload));
  console.log(`✓ diagnostic report → ${path.relative(root, out)}`);
  console.log(`  open it in the browser: open ${path.relative(root, out)}`);
  console.log("  (static, self-contained, dated snapshot — pre-read, not pre-approved)");
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
    case "report":   return argv.includes("--diagnostic") ? cmdDiagnosticReport(root) : cmdReport(root);
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
      if (!["list", "add", "done", "abandon"].includes(sub)) die("usage: docod.mjs ws list|add|done|abandon <key> [--reason ...] [--name ...]");
      return cmdWs(root, sub, pos[1] ?? null, opt("--reason"), opt("--name"));
    }
    default:
      die("commands: status [--ws X] · continue <ws> · start · report · verify <file> · rebless · approve <file> --by <who> · ws list|done|abandon");
  }
}

process.exit(main());
