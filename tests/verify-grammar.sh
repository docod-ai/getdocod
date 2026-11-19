#!/usr/bin/env bash
set -euo pipefail

# The definition grammar, planted in BOTH directions: what must stop matching
# and what must keep matching. Nine instances of one parse class are behind
# this file (migration.yaml: positional-definitions); the last three were
# written by the fix of the sixth, because its battery only covered the bug
# being fixed. Every case here is a shape that was read wrong once.

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

## Summary
| RF-001 | A |
| RF-002 | B |
| RF-003 | C |
| RF-004 | D |

## Functional Requirements

> **RF-001 — A**
> **Dependencies:** RF-004
> **Acceptance criteria:**
> - given a
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

echo "✓ definition grammar tests passed"
