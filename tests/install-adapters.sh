#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d /tmp/docod-install-test.XXXXXX)"
trap 'rm -rf "$TMP"' EXIT

fail() { echo "✗ $*" >&2; exit 1; }
assert_file() { [ -f "$1" ] || fail "missing file: $1"; }
assert_dir() { [ -d "$1" ] || fail "missing directory: $1"; }
assert_absent() { [ ! -e "$1" ] || fail "unexpected path: $1"; }
assert_count() {
  actual="$1"; expected="$2"; label="$3"
  [ "$actual" = "$expected" ] || fail "$label: expected $expected, got $actual"
}

# Backward-compatible default remains Claude Code.
CLAUDE="$TMP/claude"
mkdir -p "$CLAUDE"
bash "$ROOT/install.sh" "$CLAUDE" >/dev/null
grep -q '^adapter: claude-code$' "$CLAUDE/docod.yaml" || fail "default adapter is not claude-code"
assert_dir "$CLAUDE/.claude/commands/docod"
assert_count "$(find "$CLAUDE/.claude/agents" -maxdepth 1 -name 'docod-*.md' | wc -l | tr -d ' ')" "28" "Claude agents"
assert_absent "$CLAUDE/.codex/agents"

# Codex materialization: 28 TOML agents, 13 craft skills + one command router,
# no Claude-specific agent/command surface, and every TOML parses.
CODEX="$TMP/codex"
mkdir -p "$CODEX/.codex/agents"
printf '%s\n' '# user-owned' 'name = "docod_frd"' 'description = "mine"' 'developer_instructions = "mine"' > "$CODEX/.codex/agents/docod-frd.toml"
# Force the byte-oriented locale that exposed the original shipping bug:
# `${desc:0:137}` split the infrastructure-design em dash after its E2 byte.
LC_ALL=C bash "$ROOT/install.sh" "$CODEX" --adapter codex >/dev/null
grep -q '^adapter: codex$' "$CODEX/docod.yaml" || fail "Codex adapter not recorded"
grep -q '^# user-owned$' "$CODEX/.codex/agents/docod-frd.toml" || fail "user-owned Codex agent was overwritten"
assert_count "$(find "$CODEX/.codex/agents" -maxdepth 1 -name 'docod-*.toml' | wc -l | tr -d ' ')" "28" "Codex agents including preserved collision"
assert_count "$(find "$CODEX/.agents/skills" -mindepth 1 -maxdepth 1 -type l | wc -l | tr -d ' ')" "14" "Codex skill links"
assert_file "$CODEX/.agents/skills/docod-commands/SKILL.md"
assert_absent "$CODEX/.claude/commands"
assert_absent "$CODEX/.claude/agents"
python3 - "$CODEX" <<'PY'
import pathlib, sys, tomllib
root = pathlib.Path(sys.argv[1])
source = root / ".docod/agents/infrastructure-design.md"
description = next(
    line.removeprefix("description: ").strip('"')
    for line in source.read_text().splitlines()
    if line.startswith("description: ")
)
legacy_bytes = description.encode("utf-8")[:137] + "…".encode("utf-8")
try:
    legacy_bytes.decode("utf-8")
except UnicodeDecodeError:
    pass
else:
    raise AssertionError("UTF-8 truncation regression fixture no longer reaches a split codepoint")
for path in root.glob(".codex/agents/docod-*.toml"):
    if path.name == "docod-frd.toml":
        continue
    with path.open("rb") as fh:
        data = tomllib.load(fh)
    assert data["name"].startswith("docod_")
    assert data["description"]
    assert data["developer_instructions"]
PY

# Reinstall is idempotent and an explicit flag cannot silently rewrite a
# preserved instance owned by the user.
bash "$ROOT/install.sh" "$CODEX" --adapter codex >/dev/null
assert_count "$(find "$CODEX/.codex/agents" -maxdepth 1 -name 'docod-*.toml' | wc -l | tr -d ' ')" "28" "Codex agents after reinstall"
if bash "$ROOT/install.sh" "$CODEX" --adapter claude-code >/dev/null 2>&1; then
  fail "adapter mismatch should refuse"
fi

# An explicit instance edit may switch adapters. Generated Codex surfaces are
# then retired, while the user-owned collision remains.
sed -i.bak 's/^adapter: codex$/adapter: agents-1/' "$CODEX/docod.yaml"
rm -f "$CODEX/docod.yaml.bak"
bash "$ROOT/install.sh" "$CODEX" --adapter agents-1 >/dev/null
assert_count "$(find "$CODEX/.codex/agents" -maxdepth 1 -name 'docod-*.toml' | wc -l | tr -d ' ')" "1" "user-owned Codex agent after adapter switch"
grep -q '^# user-owned$' "$CODEX/.codex/agents/docod-frd.toml" || fail "adapter switch removed a user-owned Codex agent"
assert_absent "$CODEX/.agents/skills/docod-commands"
assert_count "$(find "$CODEX/.agents/skills" -mindepth 1 -maxdepth 1 -type l | wc -l | tr -d ' ')" "13" "skill links after adapter switch"

# The installer itself must reject malformed generated UTF-8, clean the
# temporary output, and exit non-zero instead of relying on tomllib later.
BROKEN_BUNDLE="$TMP/invalid-utf8-bundle"
BROKEN_TARGET="$TMP/invalid-utf8-target"
BROKEN_LOG="$TMP/invalid-utf8.log"
mkdir -p "$BROKEN_BUNDLE" "$BROKEN_TARGET"
(cd "$ROOT" && tar -cf - --exclude .git .) | (cd "$BROKEN_BUNDLE" && tar -xf -)
python3 - "$BROKEN_BUNDLE/agents/api-contract.md" <<'PY'
import pathlib, sys
path = pathlib.Path(sys.argv[1])
data = path.read_bytes()
start = data.index(b"description:")
end = data.index(b"\n", start)
path.write_bytes(data[:start] + b'description: "invalid \xe2"' + data[end:])
PY
if LC_ALL=C bash "$BROKEN_BUNDLE/install.sh" "$BROKEN_TARGET" --adapter codex >"$BROKEN_LOG" 2>&1; then
  fail "installer published a Codex surface generated from invalid UTF-8"
fi
grep -q 'refusing to publish invalid Codex agent' "$BROKEN_LOG" || fail "installer did not explain its UTF-8 refusal"
assert_absent "$BROKEN_TARGET/.codex/agents/docod-api-contract.toml"
assert_absent "$BROKEN_TARGET/.docod/.codex-agent-api-contract.toml.tmp"

# Neutral materialization stays free of vendor-specific agent directories.
NEUTRAL="$TMP/agents-1"
mkdir -p "$NEUTRAL"
DOCOD_INSTALL_FORCE_TAR=1 bash "$ROOT/install.sh" "$NEUTRAL" --adapter agents-1 >/dev/null
grep -q '^adapter: agents-1$' "$NEUTRAL/docod.yaml" || fail "agents-1 adapter not recorded"
assert_absent "$NEUTRAL/.claude/agents"
assert_absent "$NEUTRAL/.codex/agents"
assert_count "$(find "$NEUTRAL/.agents/skills" -mindepth 1 -maxdepth 1 -type l | wc -l | tr -d ' ')" "13" "neutral skill links"
assert_file "$NEUTRAL/.docod/spec/skills/architecture-boundaries/SKILL.md"
assert_absent "$NEUTRAL/.docod/skills"

# The namespaced Codex plugin has one setup skill plus the ten public commands.
python3 - "$ROOT" <<'PY'
import json, pathlib, sys
root = pathlib.Path(sys.argv[1])
manifest = json.loads((root / ".codex-plugin" / "plugin.json").read_text())
assert manifest["name"] == "docod"
assert manifest["skills"] == "./skills/"
skills = {p.parent.name for p in (root / "skills").glob("*/SKILL.md")}
assert skills == {"setup-docod", "start", "status", "continue", "approve", "ws", "run", "report", "lead", "loop", "diagnose"}
assert (root / "skills" / "setup-docod").parents[1] == root
PY

echo "✓ adapter install tests passed"
