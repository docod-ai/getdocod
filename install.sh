#!/usr/bin/env bash
# =============================================================================
# install.sh — installs the DOCOD bundle into a project.   100% bash: ZERO deps.
#
#   ./install.sh /path/to/project
#
# What it does, and the policy of each step:
#
#   <project>/.docod/                  ← the bundle. OURS entirely (recreated).
#   <project>/docod.yaml               ← the instance. THE USER'S: created once,
#                                        NEVER overwritten.
#   <project>/.agents/docod/skills/    ← the skills, in the neutral canonical
#                                        spot. OUR subdirectory; the rest of
#                                        .agents/ is the user's and is NOT TOUCHED.
#   <project>/.claude/skills/docod-*   ← symlinks pointing into .agents/.
#                                        If something exists with the name that
#                                        is NOT our symlink: WARN AND SKIP.
#   <project>/.claude/agents/docod-*   ← the agents as NATIVE SUBAGENTS,
#                                        generated here in bash. Ownership via
#                                        the `generated-by: docod` marker; a
#                                        namesake WITHOUT the marker: WARN AND SKIP.
#   <project>/.claude/commands/docod/  ← the 10 orchestration commands
#                                        (status/start/continue/approve/ws/run/
#                                        report/lead/loop/diagnose). Our
#                                        namespace; recreated on every sync.
#
# THE MERGE RULE, one line: everything of ours lives namespaced (docod), and
# what is not ours we never touch — not even to "help".
#
# ZERO python, ZERO pip, ZERO npm install: installation is pure bash and the
# command runtime (.docod/docod.mjs: status/approve/ws) is node with the YAML
# parser VENDORED (vendor/js-yaml.mjs). The installer checks for node and
# WARNS — it does not fail.
# =============================================================================
set -euo pipefail

BUNDLE="$(cd "$(dirname "$0")" && pwd)"
TARGET="${1:?usage: install.sh /path/to/project}"
[ -d "$TARGET" ] || { echo "✗ target does not exist: $TARGET"; exit 1; }
TARGET="$(cd "$TARGET" && pwd)"
[ "$TARGET" = "$(dirname "$BUNDLE")" ] && { echo "✗ the target is the bundle repo itself"; exit 1; }

echo "── DOCOD install"
echo "   bundle : $BUNDLE"
echo "   project: $TARGET"

# ── 1. the bundle → .docod/ (ours entirely)
mkdir -p "$TARGET/.docod"
# validate-layers.py is the bundle's DEV tool (validates the layers in the
# source repo) — it is not part of what the user uses; installing it would
# bring python along. And .git/.gitignore are the bundle's OWN repo management:
# copied into .docod/ they nest a git repo inside the user's project and
# collide with theirs — the installer must never ship them.
EXCL="--exclude __pycache__ --exclude .DS_Store --exclude .git --exclude .gitignore --exclude validate-layers.py --exclude install.sh --exclude report.html --exclude migration.yaml --exclude .claude-plugin --exclude plugin-commands"
if command -v rsync >/dev/null 2>&1; then
  # shellcheck disable=SC2086
  rsync -a --delete $EXCL "$BUNDLE/" "$TARGET/.docod/"
else
  rm -rf "$TARGET/.docod"; mkdir -p "$TARGET/.docod"
  # shellcheck disable=SC2086
  (cd "$BUNDLE" && tar cf - $EXCL .) | (cd "$TARGET/.docod" && tar xf -)
fi
echo "   ✓ bundle → .docod/"

# ── 2. the instance (the user's; never overwrite)
if [ ! -f "$TARGET/docod.yaml" ]; then
  cat > "$TARGET/docod.yaml" <<YAML
specVersion: "1.7.0"

# DOCOD INSTANCE — layer 4. This file is YOURS: the installer never overwrites
# it. Adjust topology and targets to the shape of your repo.

project:
  name: "$(basename "$TARGET")"
  spec: ./.docod/spec/

adapter: claude-code

# The language of everything the method PRODUCES in this repo: artifacts,
# inquiry questions, reports. The method itself speaks English; the product
# speaks this. (e.g.: en, pt-BR, es, de)
# Left unset ON PURPOSE: an invented default is what rules.yaml forbids
# (no invented value; an unanswered field is a declared GAP). The first agent
# to produce — at ANY door — asks you and records the choice here; the status
# command shows it as a gap until then.
language: unset

# The root for the method's artifacts in this repo. The stage (define/observe/…)
# NEVER becomes a folder — stage is metadata; grouping inside is by nature:
# product/ design/ decisions/ quality/ ops/ releases/ standards/ workstreams/
docsRoot: docs/

# single | monorepo | multi-repo
topology: single

targets:
  app:
    path: .
    stack: []          # the stack is yours; the bundle does not know it
    tasksRoot: tasks/
YAML
  echo "   ✓ instance → docod.yaml (new)"
else
  echo "   • docod.yaml exists — preserved (it is yours)"
  # never touched, but the template evolves: WARN about missing top-level keys
  MISS=""
  for k in adapter language docsRoot topology targets; do
    grep -q "^$k:" "$TARGET/docod.yaml" || MISS="$MISS $k"
  done
  [ -n "$MISS" ] && echo "   ⚠ your docod.yaml is missing newer field(s):$MISS — see the template in .docod/docod.yaml and add what you want"
fi

# ── 2b. migrations — detection-based, idempotent, NEVER destructive
#      The bundle evolves; the user's state must not be left fragmented (the
#      ADR-ledger episode). Policy: detect old layouts; MOVE only when the
#      destination does not exist; anything ambiguous prints the exact manual
#      recipe and continues. No state file: detection IS the state.
DR="$(sed -n 's/^docsRoot: *//p' "$TARGET/docod.yaml" | head -1)"; DR="${DR:-docs/}"
MIGRATED=""; MANUAL=""
mig_mv() { # $1 old  $2 new
  if [ -e "$TARGET/$1" ] && [ ! -e "$TARGET/$2" ]; then
    mkdir -p "$(dirname "$TARGET/$2")" && mv "$TARGET/$1" "$TARGET/$2" && MIGRATED="$MIGRATED\n     $1 → $2"
  elif [ -e "$TARGET/$1" ] && [ -e "$TARGET/$2" ]; then
    MANUAL="$MANUAL\n     $1 AND $2 both exist — merge by hand, then remove $1"
  fi
}
# M1: pre-docsRoot stage folders → docs/ by nature
mig_mv "definir/produto/prd.md"  "${DR}product/prd.md"
mig_mv "definir/produto/frd.md"  "${DR}product/frd.md"
for f in "$TARGET"/definir/decisoes/adr/*.md; do [ -e "$f" ] && mig_mv "definir/decisoes/adr/$(basename "$f")" "${DR}decisions/adr/$(basename "$f")"; done
# M2: root workstreams registry → docsRoot
mig_mv "workstreams.yaml" "${DR}workstreams.yaml"
# M3: root decisions logs → docsRoot/decisions/log/
for f in "$TARGET"/decisions/*.yaml; do [ -e "$f" ] && mig_mv "decisions/$(basename "$f")" "${DR}decisions/log/$(basename "$f")"; done
# M4: rich ADR ledger — judgment call, refuse to guess (lossless recipe instead)
if [ -f "$TARGET/${DR}decisions/adr.yaml" ]; then
  MANUAL="$MANUAL\n     ${DR}decisions/adr.yaml is a rich ADR ledger (pre-1.0 shape). Do NOT convert to the\n     inquiry log: fold each entry's decision content into its ${DR}decisions/adr/NNNN-slug.md\n     (completing a record is not an immutability breach), then archive the ledger."
fi
[ -n "$MIGRATED" ] && printf "   ✓ migrated old layout:%b\n" "$MIGRATED"
[ -n "$MANUAL" ]   && printf "   ⚠ needs your hand (never guessed):%b\n" "$MANUAL"

# ── 3. skills → .agents/docod/skills/ (canonical) + symlinks in .claude/skills/
mkdir -p "$TARGET/.agents/docod"
rm -rf "$TARGET/.agents/docod/skills"
cp -R "$TARGET/.docod/spec/skills" "$TARGET/.agents/docod/skills"
mkdir -p "$TARGET/.claude/skills"
LINKED=0; SKIPPED=""
for d in "$TARGET/.agents/docod/skills"/*/; do
  k="$(basename "$d")"; link="$TARGET/.claude/skills/docod-$k"
  if [ -L "$link" ]; then rm "$link"
  elif [ -e "$link" ]; then SKIPPED="$SKIPPED docod-$k"; continue; fi
  ln -s "../../.agents/docod/skills/$k" "$link"; LINKED=$((LINKED+1))
done
echo "   ✓ skills → .agents/docod/skills/ · $LINKED symlinks in .claude/skills/"
[ -n "$SKIPPED" ] && echo "   ⚠ already existed and are NOT ours — skipped:$SKIPPED"

# ── 4. agents → .claude/agents/docod-<key>.md (native SUBAGENTS)
#      Ownership via the `generated-by: docod` marker in the body. A namesake
#      without the marker is not ours: WARN AND SKIP — same rule as the symlinks.
AG="$TARGET/.claude/agents"
mkdir -p "$AG"
N=0; ASKIP=""
for f in "$TARGET/.docod/agents"/*.md; do
  key="$(basename "$f" .md)"
  # tech-lead is the one exception: it materializes as a MAIN-SESSION command
  # (/docod:lead) — sparring is conversation, and conversation cannot bounce
  # through a subagent's hand-back protocol. See the adapter's materialization.
  [ "$key" = "tech-lead" ] && continue
  out="$AG/docod-$key.md"
  if [ -e "$out" ] && ! grep -q 'generated-by: docod' "$out"; then
    ASKIP="$ASKIP docod-$key"; continue
  fi
  # frontmatter = up to the second ---
  fm="$(awk '/^---$/{c++; next} c==1{print} c>=2{exit}' "$f")"
  desc="$(printf '%s\n' "$fm" | sed -n 's/^description: *//p' | head -1 | sed 's/^"//; s/"$//')"
  if [ "${#desc}" -gt 140 ]; then desc="${desc:0:140}"; desc="${desc% *}…"; fi
  inter="$(printf '%s\n' "$fm" | grep -c '^interactive: true' || true)"
  actions="$(printf '%s\n' "$fm" | awk '/^  actions:$/{a=1; next} a && /^    [a-z_]+:$/{gsub(/[: ]/,""); print} a && /^  [a-z]/{exit}' | paste -sd'|' -)"
  if [ "$inter" -ge 1 ]; then
    modo="This agent is INTERACTIVE, but a subagent CANNOT reach the user. If an
   \`## inquiry\` answer is missing: do NOT invent, do NOT assume. STOP and hand
   the exact list of pending questions back to the caller, prefixed with
   \`QUESTIONS FOR THE USER:\`. You will be reinvoked with the answers."
  else
    modo="This agent is NOT interactive: work with what the artifacts say.
   A gap in the inputs becomes a gap RECORDED in the document — never an assumption."
  fi
  cat > "$out" <<AGENT
---
name: docod-$key
description: "$desc — DOCOD: invoke ONLY when the user explicitly asks (via /docod:run $key or by name). NEVER on your own initiative."
---
<!-- generated-by: docod · recreated on every install; the source is .docod/agents/$key.md -->
You are the \`$key\` agent of the DOCOD method, running as a subagent.

## The role — the source, in full
Your FIRST action, before anything else: read \`.docod/agents/$key.md\` IN FULL.
It is your prompt: contract, postconditions (with the nature of each one),
\`## structure\`, \`## inquiry\`, \`## style\`. This file is only the envelope.

## The instance
- \`docod.yaml\` at the root states language, docsRoot, topology and targets; \`.docod/spec/artifacts.yaml\` states each artifact's path (relative to docsRoot).
- The requested action comes in the invocation prompt. This agent's actions: ${actions:-—}.

## Harness rules — non-negotiable
1. Before starting: \`node .docod/docod.mjs status\` and check the \`requires\`.
   Blocked → say what is missing and STOP (waivable → hand the question back to
   the caller, and record the waiver in the document's frontmatter). If node is
   missing on this machine, say so and check the requires MANUALLY against
   artifacts.yaml — never skip the gate.
2. You NEVER write \`status: approved\` — not even on your own artifact. Deliver
   in draft/review; approving is the human's act, via \`/docod:approve\`.
3. Frontmatter of what you produce: \`status\` + \`inputs:\` with {artifact, key, hash}.
   The hash is COMPUTED (sha256:<hex>), never a placeholder — if you cannot
   compute it (source still draft, file absent), say so in the entry instead
   of inventing a string that looks like data.
4. Record product answers in the \`decisions\` artifact — the path is the one in
   artifacts.yaml ({docsRoot}decisions/log/$key.yaml at project scope; inside
   workstreams/{ws}/decisions/ on a front). Append, never overwrite.
   A TECHNICAL decision with alternatives is NOT a product answer: stop and
   point out that it needs an ADR — the \`adr\` agent records ADRs, never you.
5. THE PRODUCT'S LANGUAGE: write everything you produce — artifacts, inquiry
   questions, reports — in the \`language\` set in docod.yaml. The method speaks
   English; the product speaks the instance's language. If \`language\` is
   \`unset\`, STOP before producing: ask the user which language and record it
   in docod.yaml first — no entry door skips this, and an invented default is
   forbidden.
6. A missing external tool (browser MCP, docs MCP) is NOT a license to
   improvise: degrade per the adapter and RECORD "not verified".
7. Hooks do NOT fire in subagents. For the COMPUTABLE class (frontmatter,
   status, approval hash, input hashes) run \`node .docod/docod.mjs verify
   <file>\` and paste its output — external verification beats self-attestation.
   For the rest, run the check and SHOW command + output in the final report.
8. $modo
AGENT
  N=$((N+1))
done
echo "   ✓ $N subagents → .claude/agents/docod-*"
[ -n "$ASKIP" ] && echo "   ⚠ already existed and are NOT ours — skipped:$ASKIP"

# ── 5. orchestration commands → .claude/commands/docod/ (our namespace)
CMD="$TARGET/.claude/commands/docod"
rm -rf "$CMD"; mkdir -p "$CMD"
gen_cli() { cat > "$CMD/$1.md" <<EOF
---
description: "$2"
---
$3
EOF
}
PY="node .docod/docod.mjs"
gen_cli status   "Where we are: what exists, what counts, what is blocked, what is possible" \
  "Run \`$PY status\` and present the output WITHOUT softening it. An invalid-approval warning appears as-is — the status does not lie."
gen_cli start    "Where to enter, given what already exists" \
  "Run \`$PY start\` and present the doors. The user chooses; you do NOT invoke an agent on your own."
gen_cli continue "Resume a workstream: focused status + next steps" \
  "Run \`$PY continue \$ARGUMENTS\`. More than one valid path → present ALL of them; the user decides."
gen_cli approve  "The human gate: verdict with a hash, moves the status" \
  "Run \`$PY approve \$ARGUMENTS --by <whoever the user says>\`. NEVER without an explicit request — approving is their act. Re-approving AMENDED content requires --impact <impact-file> or --no-impact \"<reason>\" (the runtime refuses otherwise): touched doc means mapped radius, mechanically. Then show the \`status\`."
gen_cli ws       "Workstreams: list, done, abandon (reason mandatory)" \
  "Run \`$PY ws \$ARGUMENTS\`. Abandoning requires --reason — without one the command refuses, and it is right to."
gen_cli report   "HTML dashboard: documents, task kanban, flow, workstreams" \
  "Run \`$PY report\` and offer to open the generated file (.docod/report.html) in the browser. It is static: it reflects the state of NOW; remind the user to regenerate after changes."
cat > "$CMD/run.md" <<'RUN'
---
description: "Invoke a DOCOD agent: /docod:run <agent> [action] [ws]"
argument-hint: "<agent> [action] [ws]"
---
The request: $ARGUMENTS — format `<agent> [action] [ws]`. The agents live in
`.docod/agents/*.md`; the installed subagents are named `docod-<agent>`.

1. Run `node .docod/docod.mjs status` first. Agent's requires blocked →
   say what is missing and STOP (waivable → ask the user).
2. Delegate to the `docod-<agent>` subagent, passing the action, the ws and
   what the user said. You do NOT do its work in the main session.
3. If the subagent hands back `QUESTIONS FOR THE USER:` (interactive agent),
   ask the user EXACTLY those questions and reinvoke the subagent with the
   answers. Repeat until it delivers. NEVER answer for the user.
4. A reply that contains NEITHER a written artifact NOR `QUESTIONS FOR THE
   USER:` is a FAILED run (junk, echo, empty) — say so explicitly and reinvoke.
   NEVER present it as a result.
5. At the end: run `node .docod/docod.mjs verify <artifact>` yourself — external
   verification of the computable class (frontmatter, status, approval hash,
   input hashes). Show its output. Then require the subagent's evidence for the
   remaining postconditions, and run `status` again.
6. You NEVER approve anything — approving is `/docod:approve`, and it is the user's act.
RUN
cat > "$CMD/lead.md" <<'LEAD'
---
description: "Your tech lead: technical sparring, in the main session. Recommends, never decides."
argument-hint: "[topic]"
---
You will act as the `tech-lead` agent of the DOCOD method, IN THE MAIN SESSION.
This is the one materialization exception: sparring is conversation, and
conversation cannot bounce through a subagent's hand-back protocol.

## The role, in full — it is your prompt
@.docod/agents/tech-lead.md

## Harness rules
1. Run `node .docod/docod.mjs status` first, and read what the topic touches
   before opining. Cite what you read.
2. You recommend; the user decides. You NEVER invoke agents, NEVER approve,
   NEVER edit artifacts you do not own.
3. Substantive counsel goes to the `counsel` log ({docsRoot}decisions/counsel.md),
   append-only, using the four-field entry from `## structure`, written in the
   instance's `language:`.
4. Topic: $ARGUMENTS — if empty, ask what is on the table.
LEAD
cat > "$CMD/loop.md" <<'LOOP'
---
description: "Dispatch ONE task through build→QA→fix→review without stopping at every station"
argument-hint: "<task> [--until qa|review]"
---
This is the DISPATCH of ONE task: it carries it through the non-human stretch
(build → verify → QA → fix rounds → diff review) so the user does not babysit
each station. It is NOT a batch runner — one task per mandate; parallel tasks
are parallel dispatches. It never replaces a gate.

1. Restate the mandate: which task, until which stage (default: through
   code-review). Confirm ONCE, then run without narrating every step.
2. Delegate docod-task-executor (its contract stamps
   execution.started before the first edit — a delivery without the stamp
   fails its deterministic postconditions; the report shows progress live
   because of it) → on delivery run
   `node .docod/docod.mjs verify` + require evidence → delegate
   docod-qa-executor → bugs found: fix_bugs → re-QA (max 2 rounds) →
   delegate docod-code-review.
3. STOP and hand back when: an agent hands back QUESTIONS FOR THE
   USER; QA or review root-causes a finding to an APPROVED upstream artifact
   rather than this task's code (patching forward would fork code from
   design — the upstream owner must amend and the human re-approve first); the same task gets changes_requested/blocked twice; a requires
   blocks; anything needs approval (you NEVER approve); or your judgment says
   a human would want to know now. Otherwise: collect, do not interrupt.
4. At the end or at a stop, ONE batch report: per task, ticks + verdicts +
   evidence pointers; then the exact queue awaiting the human (approvals,
   questions, decisions). Deploy and release remain human acts.
LOOP
cat > "$CMD/diagnose.md" <<'DIAG'
---
description: "Diagnostic mode: point DOCOD at the repo, get the evidenced map — DIVs, RISKs, provenance. No adoption required."
argument-hint: "[target] [--with-docs <dir>]"
---
DIAGNOSTIC MODE (.docod/spec/agent.yaml § diagnostic_mode): the reverse
unhooked from governance. No approvals, no pins, no gates — and everything
produced is a DATED SNAPSHOT. You never write `status: approved` anywhere;
this run more than any other: the system leaves PRE-READ, not PRE-APPROVED.

1. SCOPE. Read docod.yaml (targets, language, docsRoot) and $ARGUMENTS.
   Legacy docs found in the repo (or pointed via --with-docs) are a
   TRIANGULATION source — cited as external provenance, never imported.
   No docs at all is NOT a blocker: the risk engine fires on a mute repo.
2. RUN THE REVERSES: delegate the reverse_* actions that apply —
   docod-prd, docod-system-design, docod-data-design, docod-api-contract,
   docod-security-design (and docod-rules-factory extract_from_code when
   standards matter). Each honors reverse_conventions: provenance on every
   claim (evidence = file:line with the observed fragment | inferred |
   user-supplied), DIV-nn for claim-vs-reality divergences (the claim side
   may be a doc OR another code artifact's contract), RISK-nn for one-way
   risks (PII, destructive actions, exposure), EXTERNAL-OWNER questions
   appended to {docsRoot}decisions/external-questions.yaml, an owner per
   finding. Hand-back questions: relay them verbatim, reinvoke with answers.
3. CONSOLIDATE: delegate docod-tech-lead consolidate_diagnostic → the
   `diagnostic` artifact ({docsRoot}quality/diagnostic/{date}-{slug}.md,
   sections per artifacts.yaml) — WITH the machine-readable `report:` block in
   its frontmatter (the REPORT DATA CONTRACT, artifacts.yaml § diagnostic:
   census with the recorded/ratified axes, DIV/RISK rows, gravest, questions).
   Then run `node .docod/docod.mjs verify <the file>` and paste its output —
   the diagnostic submits to the same external verification it performs, and
   verify flags any absolute-absence claim ("no why recorded") for you to
   qualify before it ships.
4. REPORT: run `node .docod/docod.mjs report --diagnostic` — the sellable,
   self-contained dossier rendered from the `report:` block (this is THE
   deliverable). Present the summary NUMBERS first: N DIVs, N RISKs, N open
   external questions, and the census read as recorded-vs-ratified (a zero in
   one class is NOT absence — legacy rationale lives in external) — then the
   gravest, with their evidence.
5. THE LINE: nothing self-approves. If the user wants the diagnosis to STAY
   true — staleness watching the drift, gates on the amendments — that is
   the method, and adopting it means a human vouching these artifacts
   forward. Say exactly that when asked, and nothing more ambitious.
DIAG
echo "   ✓ 10 commands → .claude/commands/docod/  (status·start·continue·approve·ws·run·report·lead·loop·diagnose)"

# ── 6. root instructions → CLAUDE.md + AGENTS.md (EVERY harness finds DOCOD)
#      Slash commands only exist for Claude Code; Codex/Gemini/Cursor/Kimi read
#      AGENTS.md (or CLAUDE.md). We own ONLY our marked block: existing content
#      is never touched; the block is replaced on every sync (idempotent).
write_block() {
  f="$1"
  [ -f "$f" ] && sed -i.docodbak '/<!-- docod:begin -->/,/<!-- docod:end -->/d' "$f" && rm -f "$f.docodbak"
  cat >> "$f" <<'DOCODBLOCK'
<!-- docod:begin -->
## DOCOD — how to operate in this repo

This project runs the DOCOD method. Regardless of which coding agent you are:

- **State**: run `node .docod/docod.mjs status` before acting. It shows what
  exists, what is valid, what is blocked (and why), what is possible now.
- **Commands**: `status` · `start` · `continue <ws>` · `approve <file> --by <who>`
  · `ws list|done|abandon --reason` · `report` · `verify <file>` — all via
  `node .docod/docod.mjs <cmd>`. In Claude Code they also exist as `/docod:*`.
- **Acting as an agent**: the roles live in `.docod/agents/<key>.md`. Read the
  file IN FULL and follow it: contract, postconditions, `## structure`,
  `## inquiry`, `## style`. The instance (`docod.yaml`) sets language, docsRoot
  and targets; `.docod/spec/artifacts.yaml` sets every artifact's path.
- **Non-negotiable**: never write `status: approved` (approving is the human's
  act); deliver in draft/review. If an inquiry answer is missing, ask — never
  invent. Record computed hashes, never placeholders. Run
  `node .docod/docod.mjs verify <file>` on what you produce and show the output.
  A missing external tool degrades honestly: record "not verified", never pretend.
- Full docs: `.docod/README.md` · internals: `.docod/ARCHITECTURE.md`
<!-- docod:end -->
DOCODBLOCK
}
write_block "$TARGET/CLAUDE.md"
if [ ! -e "$TARGET/AGENTS.md" ]; then
  (cd "$TARGET" && ln -s CLAUDE.md AGENTS.md)
  echo "   ✓ CLAUDE.md (docod block) · AGENTS.md → symlink (Codex/Gemini/Cursor/Kimi)"
elif [ -L "$TARGET/AGENTS.md" ]; then
  echo "   ✓ CLAUDE.md (docod block) · AGENTS.md symlink preserved"
else
  write_block "$TARGET/AGENTS.md"
  echo "   ✓ docod block → CLAUDE.md and AGENTS.md (existing files, only our block touched)"
fi

# ── 6. runtime: check, warn, never fail
if command -v node >/dev/null 2>&1; then
  echo "   ✓ runtime ok (node $(node --version 2>/dev/null); yaml vendored — nothing to install)"
else
  echo "   ⚠ no node — the orchestration commands (status/approve/ws) stay manual until it is installed"
fi

echo ""
echo "── Done. Open Claude Code in $TARGET:"
echo "   /docod:start          → the entry doors"
echo "   /docod:status         → where you are"
echo "   /docod:run <agent>    → invoke an agent (subagent docod-<agent>)"
echo "   /docod:diagnose       → diagnostic mode: DIVs + RISKs + provenance, no adoption"
echo "   /docod:report         → HTML dashboard (documents · kanban · flow)"
