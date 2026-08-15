---
name: setup-docod
description: Install or update DOCOD in the current repository using the Codex adapter. Invoke only when the user explicitly requests /docod:setup-docod.
---

# Set up DOCOD for Codex

Resolve the bundle repository root from this skill's loaded path: this file is
`skills/setup-docod/SKILL.md`, so the bundle root is two parent directories
above the skill directory.

1. Run `bash <bundle-root>/install.sh "$PWD" --adapter codex` and show its
   output verbatim.
2. If a preserved `docod.yaml` selects another adapter, do not edit it. Explain
   the mismatch and ask the user to change that owned instance explicitly.
3. Surface warnings about missing instance fields and point to
   `.docod/docod.yaml` as the reference.
4. Point at `/docod:start`, `/docod:status`, and `.docod/README.md`.
5. Suggest setting `language:` when it is still `unset`.

Re-running this command is the update flow. The bundle refreshes; the instance
and all non-DOCOD-owned files remain untouched.
