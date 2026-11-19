#!/usr/bin/env bash
set -euo pipefail

# The definition grammar, planted in BOTH directions: what must stop matching
# and what must keep matching. Nine instances of one parse class are behind
# this file (migration.yaml: positional-definitions); the last three were
# written by the fix of the sixth, because its battery only covered the bug
# being fixed. Every case here is a shape that was read wrong once — the
# later ones (1.27.0) copied from two real field FRDs the 1.26.0 runtime was
# run against for the first time a release after it shipped.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d /tmp/docod-grammar-test.XXXXXX)"
trap 'rm -rf "$TMP"' EXIT

fail() { echo "✗ $*" >&2; exit 1; }
has() { printf '%s' "$2" | grep -q -- "$3" || fail "$1 — expected: $3"; }
hasnt() { if printf '%s' "$2" | grep -q -- "$3"; then fail "$1 — unexpected: $3"; fi; }

bash "$ROOT/install.sh" "$TMP" >/dev/null
cd "$TMP"
mkdir -p docs/product docs/design tasks/prd-w

# A summary table above the definitions, a prefixed heading, a label line that
# mentions another requirement, a decision that cites a file:line, and a
# references section after the last requirement.
cat > docs/product/frd.md <<'EOF'
---
status: review
---
# FRD

## Summary of RF-001..RF-004
| RF-001 | A |
| RF-002 | B |
| RF-003 | C |
| RF-004 | D |

## Functional Requirements

> **RF-001 — A**
> **Dependencies:** RF-004
> **Acceptance criteria:**
> - given a
> **Important — RF-002 runs first**
> **Provenance:** evidence `a.py:1` `x`
> **Traces:** OBJ-1

> **RF-002 — B**
> **Acceptance criteria:**
> - given b
> **Provenance:** inferred

### 4.2 RF-003 — C (depends on RF-001)
**Acceptance criteria:**
- given c
**Provenance:** decision ADR-0003, docs/adr.md:12

> **RF-004 — D**
> **Description:** no scenario here.
> **Provenance:** user-supplied (owner, 2026-01-01)

## References
Background in DIV-07.
EOF
out="$(node .docod/docod.mjs verify docs/product/frd.md 2>&1 || true)"
has   "census classes"            "$out" "4 requirement(s) — 1 evidence · 1 decision · 1 user-supplied · 1 inferred · 0 without origin"
has   "scenario floor, one id"    "$out" "scenario floor: 1 requirement(s).*— RF-004\."
hasnt "summary table defines"     "$out" "NO \`Provenance:\` line"
hasnt "references owned by an RF" "$out" "DIV-07"
hasnt "a mention is not a duplicate" "$out" "DEFINED more than once"

# COVERAGE: a label mention and a plain table cell define nothing.
cat > docs/design/system-design.md <<'EOF'
---
status: review
---
# SD
## Components
**COMP-01 — Api** serves RF-001.
- **Talks to:** COMP-02 (the queue)
## Interfaces/APIs
| SHA-256 | digest | used for hashes |
EOF
printf -- '---\nstatus: review\n---\n# tasks\n| 1 | RF-001 RF-002 RF-003 RF-004 COMP-01 | x |\n' > tasks/prd-w/tasks.md
out="$(node .docod/docod.mjs verify tasks/prd-w/tasks.md 2>&1 || true)"
has   "coverage inventory"        "$out" "all 5 upstream-defined ID(s)"
hasnt "label mention defines"     "$out" "OBJ-1"
hasnt "plain cell defines"        "$out" "SHA-256"
hasnt "Talks-to defines"          "$out" "COMP-02"

# An frd the grammar cannot read says so — never a silent zero.
cat > docs/product/frd.md <<'EOF'
---
status: review
---
# FRD
## Functional Requirements
| RF-001 | a | must |
| RF-002 | b | should |
EOF
out="$(node .docod/docod.mjs verify docs/product/frd.md 2>&1 || true)"
has   "never a silent zero"       "$out" "2 RF id(s) appear in this document and NONE is defined"

# A word-prefixed heading still defines when nothing better exists, and an id
# defined twice in equal standing, each with its own body, is reported.
cat > docs/product/frd.md <<'EOF'
---
status: review
---
# FRD
## Functional Requirements

### Requisito RF-001 — A
**Acceptance criteria:**
- given a
**Provenance:** inferred

> **RF-002 — B**
> **Acceptance criteria:**
> - given b
> **Provenance:** inferred

> **RF-002 — B again**
> **Acceptance criteria:**
> - given b2
> **Provenance:** inferred
EOF
out="$(node .docod/docod.mjs verify docs/product/frd.md 2>&1 || true)"
has   "prefixed heading defines"  "$out" "2 requirement(s) — 0 evidence · 0 decision · 0 user-supplied · 2 inferred"
has   "duplicate id reported"     "$out" "1 requirement id(s) are DEFINED more than once in equal standing — RF-002"

# The field's shapes: origin under a homemade label, finding ids with a
# family, the row that defines a DIV in a draft diagnostic, dimension labels
# translated, glossed, missing and waived — and prose that only LOOKS like an
# inference mark.
mkdir -p docs/quality/diagnostic
cat > docs/quality/diagnostic/2026-01-01-legacy.md <<'EOF'
---
status: draft
---
# Diagnostic
## Divergences
| **DIV-SEC-04** | `high` | webhook asks for an app credential | api.py:10 `require_auth` |
EOF
cat > docs/product/frd.md <<'EOF'
---
status: review
---
# FRD
## Functional Requirements

> **RF-001 — Webhook reachable**
> **Description:** It stopped being an Assumption: the owner ratified it. Not inferida de log.
> **Acceptance criteria:**
> - Dado um ambiente, Quando chega, Então segue.
> - **Borda:** sem cabeçalho, 400.
> - **Erro:** credencial enviada por engano não altera.
> - **Estado (é o critério que impõe a ordem):** igual na primeira e nas seguintes.
> **Origem:** `RISK-API-01` · `DIV-SEC-04` (dois reversos)

> **RF-002 — Canonical**
> **Acceptance criteria:**
> - **normal:** given, when, then
> - **boundary:** zero items
> - **error:** n/a — a pure read, no failure path of its own
> - **state:** n/a
> **Provenance:** user-supplied (owner, 2026-01-01)

> **RF-003 — Half**
> **Acceptance criteria:**
> - **normal:** given, when, then
> - *Erro:* 500 becomes a retry
> **Provenance:** inferred

> **RNF-001 — Retention**
> **Description:** 90 days.
EOF
out="$(node .docod/docod.mjs verify docs/product/frd.md 2>&1 || true)"
has   "homemade origin read"      "$out" "3 requirement(s) — 1 evidence · 0 decision · 1 user-supplied · 1 inferred · 0 without origin"
has   "homemade origin named"     "$out" "under a homemade label (\`Origem:\`)"
hasnt "prose read as a mark"      "$out" "mark an inference in a homemade way"
has   "non-functional counted"    "$out" "1 non-functional requirement(s)"
has   "DIV family, draft home"    "$out" "1 requirement(s) build on a divergence NO HUMAN RATIFIED (1 citation(s)) — RF-001 → DIV-SEC-04 (docs/quality/diagnostic/2026-01-01-legacy.md, draft)"
has   "dimension totals"          "$out" "normal 3 · boundary 2 · error 2 · state 1 · 1 declared n/a with a reason"
has   "dimension missing named"   "$out" "2 of 3 requirement(s) do not declare the four dimensions — RF-002 (state); RF-003 (boundary, state)"
has   "bare n/a named"            "$out" "declared \`n/a\` with NO reason — RF-002 (state)"
has   "homemade dimensions named" "$out" "homemade or translated form (Borda, Erro, Estado)"

echo "✓ definition grammar tests passed"
