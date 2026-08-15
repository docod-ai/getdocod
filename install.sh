#!/usr/bin/env bash
# =============================================================================
# install.sh — installs the DOCOD bundle into a project.   100% bash: ZERO deps.
#
#   ./install.sh /path/to/project [--adapter claude-code|codex|agents-1]
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
#   <project>/.codex/agents/docod-*    ← Codex project-scoped custom agents.
#   <project>/.agents/skills/docod-*   ← Codex/AGENTS skill discovery links,
#                                        including the /docod:* router.
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
TARGET="${1:?usage: install.sh /path/to/project [--adapter claude-code|codex|agents-1]}"
shift
REQUESTED_ADAPTER=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --adapter)
      [ "$#" -ge 2 ] || { echo "✗ --adapter requires a value"; exit 1; }
      REQUESTED_ADAPTER="$2"; shift 2 ;;
    *)
      echo "✗ unknown option: $1"
      echo "  usage: install.sh /path/to/project [--adapter claude-code|codex|agents-1]"
      exit 1 ;;
  esac
done
case "${REQUESTED_ADAPTER:-claude-code}" in
  claude-code|codex|agents-1) ;;
  *) echo "✗ unknown adapter: $REQUESTED_ADAPTER (expected claude-code, codex, or agents-1)"; exit 1 ;;
esac

# Shorten a UTF-8 description without ever slicing its byte stream. Length is
# still capped in bytes (stable under every locale), but only complete words
# are appended. Under LC_ALL=C, Bash substring slicing is byte-oriented and
# can leave an orphaned lead byte; this construction cannot.
docod_shorten_description() {
  local raw="$1" limit="${2:-140}" raw_bytes suffix="…" suffix_bytes max_bytes
  local shortened="" word candidate candidate_bytes
  local words=()
  raw_bytes="$(LC_ALL=C printf '%s' "$raw" | wc -c | tr -d '[:space:]')"
  if [ "$raw_bytes" -le "$limit" ]; then
    printf '%s' "$raw"
    return
  fi
  suffix_bytes="$(LC_ALL=C printf '%s' "$suffix" | wc -c | tr -d '[:space:]')"
  max_bytes=$((limit - suffix_bytes))
  read -r -a words <<< "$raw"
  for word in "${words[@]}"; do
    candidate="${shortened:+$shortened }$word"
    candidate_bytes="$(LC_ALL=C printf '%s' "$candidate" | wc -c | tr -d '[:space:]')"
    [ "$candidate_bytes" -le "$max_bytes" ] || break
    shortened="$candidate"
  done
  [ -n "$shortened" ] || shortened="DOCOD agent"
  printf '%s%s' "$shortened" "$suffix"
}

# Validate generated text before publishing it. This strict UTF-8 byte state
# machine consumes POSIX od output, so validation does not depend on the
# caller's locale or on Python/Node being installed.
docod_validate_utf8() {
  local path="$1" byte need=0 next_min=128 next_max=191 offset=0
  for byte in $(od -An -v -tu1 "$path"); do
    if [ "$need" -gt 0 ]; then
      if [ "$byte" -lt "$next_min" ] || [ "$byte" -gt "$next_max" ]; then
        echo "✗ generated invalid UTF-8: $path (byte $offset)" >&2
        return 1
      fi
      need=$((need - 1)); next_min=128; next_max=191
    elif [ "$byte" -le 127 ]; then
      :
    elif [ "$byte" -ge 194 ] && [ "$byte" -le 223 ]; then
      need=1
    elif [ "$byte" -eq 224 ]; then
      need=2; next_min=160
    elif { [ "$byte" -ge 225 ] && [ "$byte" -le 236 ]; } || { [ "$byte" -ge 238 ] && [ "$byte" -le 239 ]; }; then
      need=2
    elif [ "$byte" -eq 237 ]; then
      need=2; next_max=159
    elif [ "$byte" -eq 240 ]; then
      need=3; next_min=144
    elif [ "$byte" -ge 241 ] && [ "$byte" -le 243 ]; then
      need=3
    elif [ "$byte" -eq 244 ]; then
      need=3; next_max=143
    else
      echo "✗ generated invalid UTF-8: $path (byte $offset)" >&2
      return 1
    fi
    offset=$((offset + 1))
  done
  if [ "$need" -ne 0 ]; then
    echo "✗ generated truncated UTF-8: $path (EOF after byte $offset)" >&2
    return 1
  fi
}

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
EXCL="--exclude __pycache__ --exclude .DS_Store --exclude .git --exclude .gitignore --exclude validate-layers.py --exclude validate-readme.py --exclude install.sh --exclude report.html --exclude migration.yaml --exclude .claude-plugin --exclude .codex-plugin --exclude plugin-commands --exclude plugins --exclude tests"
if [ "${DOCOD_INSTALL_FORCE_TAR:-0}" != "1" ] && command -v rsync >/dev/null 2>&1; then
  # shellcheck disable=SC2086
  rsync -a --delete $EXCL --exclude /skills "$BUNDLE/" "$TARGET/.docod/"
else
  rm -rf "$TARGET/.docod"; mkdir -p "$TARGET/.docod"
  # shellcheck disable=SC2086
  (cd "$BUNDLE" && tar cf - $EXCL .) | (cd "$TARGET/.docod" && tar xf -)
fi
# Root skills/ is the Codex plugin surface, not part of the installed method
# bundle. rsync can anchor that exclusion; portable tar matching cannot do so
# without also swallowing spec/skills, so the fallback removes this owned copy.
rm -rf "$TARGET/.docod/skills"
echo "   ✓ bundle → .docod/"

# ── 2. the instance (the user's; never overwrite)
if [ ! -f "$TARGET/docod.yaml" ]; then
  cat > "$TARGET/docod.yaml" <<YAML
specVersion: "1.14.0"

# DOCOD INSTANCE — layer 4. This file is YOURS: the installer never overwrites
# it. Adjust topology and targets to the shape of your repo.

project:
  name: "$(basename "$TARGET")"
  spec: ./.docod/spec/

adapter: ${REQUESTED_ADAPTER:-claude-code}

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

# The instance is the authority after creation. An explicit adapter may select
# the initial materialization, but it never silently rewrites a preserved
# instance — that file belongs to the user.
ADAPTER="$(sed -n 's/^adapter: *//p' "$TARGET/docod.yaml" | head -1 | tr -d '"' | tr -d "'")"
ADAPTER="${ADAPTER:-agents-1}"
case "$ADAPTER" in
  claude-code|codex|agents-1) ;;
  *) echo "✗ docod.yaml selects unknown adapter: $ADAPTER"; exit 1 ;;
esac
if [ -n "$REQUESTED_ADAPTER" ] && [ "$REQUESTED_ADAPTER" != "$ADAPTER" ]; then
  echo "✗ --adapter $REQUESTED_ADAPTER conflicts with preserved docod.yaml (adapter: $ADAPTER)"
  echo "  edit docod.yaml explicitly, then rerun the installer"
  exit 1
fi
echo "   • adapter: $ADAPTER"

# Retire generated surfaces from a previously selected adapter. Changing the
# instance adapter is an explicit user act; leaving the old harness live would
# make two execution models appear authoritative. Remove only DOCOD-owned
# files/links. User-owned namesakes remain untouched.
if [ "$ADAPTER" != "claude-code" ]; then
  if [ -d "$TARGET/.claude/agents" ]; then
    for old in "$TARGET/.claude/agents"/docod-*.md; do
      [ -f "$old" ] || continue
      grep -q 'generated-by: docod' "$old" && rm "$old"
    done
  fi
  [ -d "$TARGET/.claude/commands/docod" ] && rm -rf "$TARGET/.claude/commands/docod"
  if [ -d "$TARGET/.claude/skills" ]; then
    for old in "$TARGET/.claude/skills"/docod-*; do
      [ -L "$old" ] || continue
      case "$(readlink "$old")" in
        ../../.agents/docod/skills/*) rm "$old" ;;
      esac
    done
  fi
fi
if [ "$ADAPTER" != "codex" ]; then
  if [ -d "$TARGET/.codex/agents" ]; then
    for old in "$TARGET/.codex/agents"/docod-*.toml; do
      [ -f "$old" ] || continue
      grep -q 'generated-by: docod' "$old" && rm "$old"
    done
  fi
  old="$TARGET/.agents/skills/docod-commands"
  if [ -L "$old" ] && [ "$(readlink "$old")" = "../../.docod/adapter-assets/codex/router" ]; then
    rm "$old"
  fi
fi
if [ "$ADAPTER" = "claude-code" ] && [ -d "$TARGET/.agents/skills" ]; then
  for old in "$TARGET/.agents/skills"/docod-*; do
    [ -L "$old" ] || continue
    case "$(readlink "$old")" in
      ../docod/skills/*|../../.docod/adapter-assets/codex/router) rm "$old" ;;
    esac
  done
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

# ── 3. skills → .agents/docod/skills/ (canonical) + harness discovery links
mkdir -p "$TARGET/.agents/docod"
rm -rf "$TARGET/.agents/docod/skills"
cp -R "$TARGET/.docod/spec/skills" "$TARGET/.agents/docod/skills"
LINKED=0; SKIPPED=""
if [ "$ADAPTER" = "claude-code" ]; then
  mkdir -p "$TARGET/.claude/skills"
  for d in "$TARGET/.agents/docod/skills"/*/; do
    k="$(basename "$d")"; link="$TARGET/.claude/skills/docod-$k"
    if [ -L "$link" ]; then rm "$link"
    elif [ -e "$link" ]; then SKIPPED="$SKIPPED docod-$k"; continue; fi
    ln -s "../../.agents/docod/skills/$k" "$link"; LINKED=$((LINKED+1))
  done
  echo "   ✓ skills → .agents/docod/skills/ · $LINKED Claude discovery links"
else
  mkdir -p "$TARGET/.agents/skills"
  for d in "$TARGET/.agents/docod/skills"/*/; do
    k="$(basename "$d")"; link="$TARGET/.agents/skills/docod-$k"
    if [ -L "$link" ]; then rm "$link"
    elif [ -e "$link" ]; then SKIPPED="$SKIPPED docod-$k"; continue; fi
    ln -s "../docod/skills/$k" "$link"; LINKED=$((LINKED+1))
  done
  if [ "$ADAPTER" = "codex" ]; then
    link="$TARGET/.agents/skills/docod-commands"
    if [ -L "$link" ]; then rm "$link"
    elif [ -e "$link" ]; then SKIPPED="$SKIPPED docod-commands"; link=""; fi
    if [ -n "$link" ]; then
      ln -s "../../.docod/adapter-assets/codex/router" "$link"
      LINKED=$((LINKED+1))
    fi
  fi
  echo "   ✓ skills → .agents/docod/skills/ · $LINKED AGENTS/Codex discovery links"
fi
[ -n "$SKIPPED" ] && echo "   ⚠ already existed and are NOT ours — skipped:$SKIPPED"

# ── 4. agents → .claude/agents/docod-<key>.md (native SUBAGENTS)
#      Ownership via the `generated-by: docod` marker in the body. A namesake
#      without the marker is not ours: WARN AND SKIP — same rule as the symlinks.
if [ "$ADAPTER" = "claude-code" ]; then
AG="$TARGET/.claude/agents"
mkdir -p "$AG"
N=0; ASKIP=""
for f in "$TARGET/.docod/agents"/*.md; do
  key="$(basename "$f" .md)"
  # tech-lead is the one exception in the GENERIC loop: sparring is
  # conversation, and conversation cannot bounce through a subagent's
  # hand-back protocol — that half materializes as /docod:lead. But its
  # PRODUCER action (consolidate_diagnostic) writes an owned artifact, and a
  # producer with no subagent left /docod:diagnose delegating to a wrapper
  # that did not exist (the 1.13.0 field finding: 27 of 28, and the 28th was
  # the one the diagnose flow dispatches). It gets a RESTRICTED envelope
  # below, outside this loop.
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
   And declare the NATURE of each edge: a LIVE dependency (it changes ⇒ your
   document may be WRONG) gets nothing extra; an input you read for CONTEXT —
   typically one that DERIVES from your artifact downstream (a change there
   asks for another look, not invalidation) — gets \`lineage: snapshot\` on
   its entry. The relation stays recorded, staleness stays quiet, and
   impact-analysis revisits it. NEVER drop an input you actually read just to
   silence staleness — that erases machine-readable provenance.
4. Record product answers in the \`decisions\` artifact — the path is the one in
   artifacts.yaml ({docsRoot}decisions/log/$key.yaml at project scope; inside
   workstreams/{ws}/decisions/ on a front). Append, never overwrite.
   A TECHNICAL decision with alternatives is NOT a product answer: stop and
   point out that it needs an ADR — the \`adr\` agent records ADRs, never you.
   An EXTERNAL-OWNER question (only someone outside the room can answer) goes
   to the single queue VIA THE COMMAND:
   \`node .docod/docod.mjs question add --question "..." --owner <who> --asked-by $key\`
   — NEVER by editing the file: hand-edits race, and a race of three parallel
   writers has already corrupted the queue and lost eight entries in the field.
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

# tech-lead's RESTRICTED envelope: one action, and the envelope says which.
# Sparring/counsel/guide stay in /docod:lead (main session); the subagent
# exists so the diagnose flow's CONSOLIDATE step has a real target.
out="$AG/docod-tech-lead.md"
if [ -e "$out" ] && ! grep -q 'generated-by: docod' "$out"; then
  ASKIP="$ASKIP docod-tech-lead"
else
  cat > "$out" <<'AGENT'
---
name: docod-tech-lead
description: "Consolidates a diagnostic run into the dated diagnostic artifact — DOCOD: invoke ONLY for consolidate_diagnostic (the /docod:diagnose CONSOLIDATE step, or /docod:run tech-lead consolidate_diagnostic). NEVER on your own initiative. Sparring, counsel and guidance live in /docod:lead, not here."
---
<!-- generated-by: docod · recreated on every install; the source is .docod/agents/tech-lead.md -->
You are the `tech-lead` agent of the DOCOD method, running as a subagent for
EXACTLY ONE action: `consolidate_diagnostic`. The rest of this role —
sparring, counsel, the `guide` action — is conversation, and a subagent
cannot hold one: that half materializes as `/docod:lead` in the main session.
Invoked for anything other than consolidate_diagnostic: STOP and say exactly
that, pointing at /docod:lead.

## The role — the source, in full
Your FIRST action, before anything else: read `.docod/agents/tech-lead.md`
IN FULL, then apply ONLY what concerns consolidate_diagnostic (its contract,
postconditions, the diagnostic's `## structure`). This file is the envelope.

## Harness rules — non-negotiable
1. Before starting: `node .docod/docod.mjs status` and check the `requires`.
2. The `diagnostic` artifact is a DATED SNAPSHOT by definition: every input
   edge is observed-at; you NEVER write `status: approved` — the system
   leaves PRE-READ, never PRE-APPROVED.
3. Frontmatter: `status` + `inputs:` with computed hashes (sha256:<hex>,
   never a placeholder) + the machine-readable `report:` block per the
   REPORT DATA CONTRACT (artifacts.yaml § diagnostic). Severity values in
   the report block are CANONICAL method vocabulary (critical|high|medium|low,
   never translated — the template maps them to colours; display labels
   localize, keys do not).
4. Write the document BODY in the `language` set in docod.yaml — the method
   speaks English, the product speaks the instance's language.
5. EXTERNAL-OWNER questions go to the single queue VIA THE COMMAND:
   `node .docod/docod.mjs question add --question "..." --owner <who> --asked-by tech-lead`
   — never by editing the file (hand-edits race, and a race has lost entries).
6. When done, run `node .docod/docod.mjs verify <the file>` and paste its
   output — the diagnostic submits to the same external verification it performs.
7. A missing answer is a hand-back: STOP and return the pending list prefixed
   with `QUESTIONS FOR THE USER:` — never invent.
AGENT
N=$((N+1))
fi
echo "   ✓ $N subagents → .claude/agents/docod-*  (tech-lead: restricted to consolidate_diagnostic; the rest of the role is /docod:lead)"
[ -n "$ASKIP" ] && echo "   ⚠ already existed and are NOT ours — skipped:$ASKIP"
fi

# ── 4b. Codex project-scoped custom agents → .codex/agents/*.toml
# Codex loads one TOML per custom agent. The file is a thin envelope: the
# source contract remains .docod/agents/<key>.md, so updating a role never
# schedules a copied prompt to drift.
if [ "$ADAPTER" = "codex" ]; then
  CAG="$TARGET/.codex/agents"
  mkdir -p "$CAG"
  CN=0; CSKIP=""
  for f in "$TARGET/.docod/agents"/*.md; do
    key="$(basename "$f" .md)"
    agent_name="docod_$(printf '%s' "$key" | tr '-' '_')"
    out="$CAG/docod-$key.toml"
    if [ -e "$out" ] && ! grep -q 'generated-by: docod' "$out"; then
      CSKIP="$CSKIP docod-$key"; continue
    fi
    fm="$(awk '/^---$/{c++; next} c==1{print} c>=2{exit}' "$f")"
    desc="$(printf '%s\n' "$fm" | sed -n 's/^description: *//p' | head -1 | sed 's/^"//; s/"$//')"
    desc="$(docod_shorten_description "$desc" 140)"
    desc="$(printf '%s' "$desc — DOCOD: use only after an explicit /docod:run, /docod:loop, or /docod:diagnose request; never self-invoke." | sed 's/\\/\\\\/g; s/"/\\"/g')"
    inter="$(printf '%s\n' "$fm" | grep -c '^interactive: true' || true)"
    actions="$(printf '%s\n' "$fm" | awk '/^  actions:$/{a=1; next} a && /^    [a-z_]+:$/{gsub(/[: ]/,""); print} a && /^  [a-z]/{exit}' | paste -sd'|' -)"
    if [ "$key" = "tech-lead" ]; then
      actions="consolidate_diagnostic"
      role_limit="This custom agent is RESTRICTED to consolidate_diagnostic. For sparring, counsel, or guide, stop and point the caller to /docod:lead."
    else
      role_limit="Perform only the requested action from this role: ${actions:-—}."
    fi
    if [ "$inter" -ge 1 ]; then
      interaction="If an inquiry answer is missing, stop and return the exact pending list prefixed QUESTIONS FOR THE USER:. The parent session asks and reinvokes you; never invent an answer."
    else
      interaction="This role is not interactive. Record missing input as a gap; never turn it into an assumption."
    fi
    tmp_out="$TARGET/.docod/.codex-agent-$key.toml.tmp"
    cat > "$tmp_out" <<AGENT
# generated-by: docod · recreated on every install; source: .docod/agents/$key.md
name = "$agent_name"
description = "$desc"
developer_instructions = '''
You are the $key agent of the DOCOD method, running as a Codex subagent.

FIRST read .docod/agents/$key.md IN FULL. It is the source contract: actions,
requires, reads, writes, postconditions, structure, inquiry, and style. Then
read docod.yaml and .docod/spec/artifacts.yaml to resolve language and paths.

$role_limit

Non-negotiable harness rules:
1. Run node .docod/docod.mjs status before starting and stop on blocked requires.
2. Never write status: approved. Approval is the human's /docod:approve act.
3. Compute every hash; never write a placeholder that looks like data.
4. Product answers go to the append-only decisions artifact. Technical choices
   with alternatives require the adr owner. External-owner questions use
   node .docod/docod.mjs question add; never hand-edit the shared queue.
5. Write produced artifacts in docod.yaml's language. If it is unset, hand back.
6. Missing tools degrade honestly to NOT VERIFIED; never improvise proof.
7. Run node .docod/docod.mjs verify <artifact> and show command plus output.
8. $interaction
'''
AGENT
    if ! docod_validate_utf8 "$tmp_out"; then
      rm -f "$tmp_out"
      echo "✗ refusing to publish invalid Codex agent: $out" >&2
      exit 1
    fi
    mv "$tmp_out" "$out"
    CN=$((CN+1))
  done
  echo "   ✓ $CN Codex custom agents → .codex/agents/docod-*"
  [ -n "$CSKIP" ] && echo "   ⚠ already existed and are NOT ours — skipped:$CSKIP"
fi

# ── 5. orchestration commands → .claude/commands/docod/ (our namespace)
if [ "$ADAPTER" = "claude-code" ]; then
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
description: "Your tech lead: technical sparring AND the resident guide to the method. Recommends and orients, never decides."
argument-hint: "[topic | 'what now?']"
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
3. When the user is LOST or asks "what now?" / "how do I continue?", act as
   the `guide` action: derive the real state (status + the artifacts — never
   a memorized flow), then answer with exactly three things per step: the
   NEXT STEP, the WHY in the method's own terms, and the EXACT command to
   run (`node .docod/docod.mjs …` or `/docod:*`). Teach the mechanism while
   you point (why the gate, why reverse-before-forward) — autonomy, not
   dependence. You show the move; the USER runs it. Never run a gate, never
   approve, never execute the step for them.
4. Substantive counsel goes to the `counsel` log ({docsRoot}decisions/counsel.md),
   append-only, using the four-field entry from `## structure`, written in the
   instance's `language:`.
5. Topic: $ARGUMENTS — if empty, ask what is on the table.
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
   risks (PII, destructive actions, exposure), EXTERNAL-OWNER questions to
   the single queue via `node .docod/docod.mjs question add` — the runtime is
   the queue's only writer; parallel reverses hand-editing the file is
   exactly the race that lost eight entries in the field. An owner per
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
fi

# ── 6. root instructions → CLAUDE.md + AGENTS.md (EVERY harness finds DOCOD)
#      /docod:* is the stable public namespace. Claude materializes it as native
#      commands; the Codex plugin materializes the same namespace as skills;
#      AGENTS.md is the literal-command fallback. We own ONLY our marked block.
write_block() {
  f="$1"
  [ -f "$f" ] && sed -i.docodbak '/<!-- docod:begin -->/,/<!-- docod:end -->/d' "$f" && rm -f "$f.docodbak"
  cat >> "$f" <<'DOCODBLOCK'
<!-- docod:begin -->
## DOCOD — how to operate in this repo

This project runs the DOCOD method. Regardless of which coding agent you are:

- **State**: run `node .docod/docod.mjs status` before acting. It shows what
  exists, what is valid, what is blocked (and why), what is possible now.
- **Commands**: `/docod:start` · `/docod:status` · `/docod:continue <ws>` ·
  `/docod:approve <file>` · `/docod:ws ...` · `/docod:run ...` ·
  `/docod:report` · `/docod:lead` · `/docod:loop` · `/docod:diagnose`.
  This namespace is the stable public contract in every harness. When a
  message starts with `/docod:`, treat it as an explicit DOCOD invocation.
  On Codex, read `.docod/adapter-assets/codex/commands/<command>.md` and follow
  it exactly; the `docod` plugin exposes the same names natively. Mechanical
  operations remain available as `node .docod/docod.mjs <cmd>`.
- **Acting as an agent**: the roles live in `.docod/agents/<key>.md`. Read the
  file IN FULL and follow it: contract, postconditions, `## structure`,
  `## inquiry`, `## style`. The instance (`docod.yaml`) sets language, docsRoot
  and targets; `.docod/spec/artifacts.yaml` sets every artifact's path.
- **Conducting the session**: between and around commands YOU are the
  conductor, and the conductor has a contract too: `.docod/CONDUCTOR.md`.
  Read it IN FULL and hold it for the whole session — it is what governs the
  prose no command covers: route to owning agents, never produce or review
  inline, never improvise checks or steps (a script you wrote is an assertion,
  not proof — label it), and translate every hand-back (severity floor · act
  by default · label your own checks · two registers).
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
case "$ADAPTER" in
  claude-code) echo "── Done. Open Claude Code in $TARGET:" ;;
  codex)       echo "── Done. Open Codex in $TARGET (install the bundled docod plugin for native /docod:* discovery):" ;;
  agents-1)    echo "── Done. Open an AGENTS.md-compatible harness in $TARGET:" ;;
esac
echo "   /docod:start          → the entry doors"
echo "   /docod:status         → where you are"
echo "   /docod:run <agent>    → invoke an agent through the selected adapter"
echo "   /docod:diagnose       → diagnostic mode: DIVs + RISKs + provenance, no adoption"
echo "   /docod:report         → HTML dashboard (documents · kanban · flow)"
