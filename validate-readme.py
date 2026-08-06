#!/usr/bin/env python3
"""Mechanical audit of the README against the live contracts.

Derives every registry from source (agents/*.md, docod.mjs, install.sh,
plugin-commands/, spec/artifacts.yaml) — never a hardcoded mirror — then
confronts every command, action and path the README asserts. A reference the
project cannot verify contradicts the project. Dev-only, like validate-layers.py:
not installed into user projects.

Usage: validate-readme.py [readme.md] [repo_root]     (defaults: README.md .)
Exit 0 = all references resolve; 1 = at least one does not.
"""
import os, re, sys, glob

root = sys.argv[2] if len(sys.argv) > 2 else "."
readme = sys.argv[1] if len(sys.argv) > 1 else "README.md"
text = open(os.path.join(root, readme) if not os.path.isabs(readme) else readme).read()

# ---- ground truth, derived from source --------------------------------------

# agents + their actions, from each agent frontmatter
agent_actions = {}
for f in sorted(glob.glob(os.path.join(root, "agents", "*.md"))):
    key, acts, in_actions = None, [], False
    for line in open(f):
        m = re.match(r"^key:\s*(\S+)", line)
        if m: key = m.group(1)
        if re.match(r"^  actions:\s*$", line): in_actions = True; continue
        if in_actions:
            if re.match(r"^  \S", line): in_actions = False          # dedent out of actions
            else:
                a = re.match(r"^    ([a-z_]+):\s*$", line)
                if a: acts.append(a.group(1))
    if key: agent_actions[key] = set(acts)

# runtime subcommands, from docod.mjs case labels
runtime = set(re.findall(r'case "([a-z-]+)":', open(os.path.join(root, "docod.mjs")).read()))

# ws subcommands, from the runtime
ws_subs = set(re.findall(r'sub === "([a-z]+)"', open(os.path.join(root, "docod.mjs")).read()))

# slash surface: runtime-backed user commands + generated command files + plugin
install = open(os.path.join(root, "install.sh")).read()
cmd_files = set(re.findall(r'\$CMD/([a-z-]+)\.md', install))
plugin = {os.path.basename(p)[:-3] for p in glob.glob(os.path.join(root, "plugin-commands", "*.md"))}
# verify/rebless are documented as node-level, not slash
slash = (runtime - {"verify", "rebless"}) | cmd_files | plugin

# artifact path templates (docsRoot-relative) from the registry
arts = open(os.path.join(root, "spec", "artifacts.yaml")).read()
art_paths = set(re.findall(r'\{docsRoot\}([A-Za-z0-9/_{}.-]+)', arts))

ok, bad = [], []
def check(cond, label):
    (ok if cond else bad).append(label)

# ---- 1. /docod:run <agent> <action> -----------------------------------------
for ag, act in re.findall(r'/docod:run\s+([a-z][\w-]*)\s+([a-z][\w-]*)', text):
    if ag not in agent_actions:
        bad.append(f"run: agent '{ag}' is not a registered agent")
    elif act not in agent_actions[ag]:
        bad.append(f"run: '{ag}' has no action '{act}' (real: {', '.join(sorted(agent_actions[ag]))})")
    else:
        ok.append(f"run {ag} {act}")

# ---- 2. slash commands /docod:<cmd> -----------------------------------------
for cmd in sorted(set(re.findall(r'/docod:([a-z][\w-]*)', text))):
    check(cmd in slash, f"slash: /docod:{cmd}" + ("" if cmd in slash else f"  ← not in {sorted(slash)}"))

# ---- 3. ws subcommands -------------------------------------------------------
for grp in re.findall(r'/docod:ws\s+([a-z|]+)', text):
    for sub in grp.split("|"):
        check(sub in ws_subs, f"ws: {sub}" + ("" if sub in ws_subs else f"  ← real: {sorted(ws_subs)}"))

# ---- 4. node runtime path + subcommand --------------------------------------
# the README shows the INSTALLED path (.docod/docod.mjs, from install.sh's copy),
# which does not exist in this source repo — so verify the canonical string, and
# that the runtime file it names really exists at the source (docod.mjs).
INSTALLED = ".docod/docod.mjs"
runtime_ok = os.path.exists(os.path.join(root, "docod.mjs"))
for path, sub in re.findall(r'node\s+(\S*docod\.mjs)\s+([a-z-]+)', text):
    check(path == INSTALLED and runtime_ok,
          f"runtime path: {path}" + ("" if path == INSTALLED else f"  ← should be {INSTALLED}"))
    check(sub in runtime, f"runtime cmd: {sub}" + ("" if sub in runtime else f"  ← real: {sorted(runtime)}"))

# ---- 5. concrete artifact file paths asserted in prose ----------------------
for p in sorted(set(re.findall(r'docs/[A-Za-z0-9/_.-]+\.(?:md|ya?ml)', text))):
    rel = p[len("docs/"):]
    hit = any(rel == a or a.startswith(rel.rstrip("/")) or rel.startswith(a.rstrip("/")) for a in art_paths)
    check(hit, f"path: {p}" + ("" if hit else "  ← no matching artifact path template"))
# ops/slos must be a file (slos.md), never a directory
check("ops/slos/" not in text, "path: ops/slos is a file (ops/slos.md), not a directory")

# ---- report -----------------------------------------------------------------
print(f"registries: {len(agent_actions)} agents, {sum(len(v) for v in agent_actions.values())} actions, "
      f"{len(slash)} slash commands, ws[{','.join(sorted(ws_subs))}]")
print(f"checked: {len(ok)+len(bad)} references  ·  {len(ok)} ok  ·  {len(bad)} FAIL\n")
if bad:
    for b in bad: print("  ✗ " + b)
    sys.exit(1)
print("  ✓ every command, action and path in the README resolves against the live contracts")
