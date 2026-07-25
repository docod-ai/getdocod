---
description: "Install the DOCOD bundle into this repo (merge-safe, idempotent — also the update flow)"
---
Install DOCOD into the current project using the bundled installer:

1. Run: `bash "${CLAUDE_PLUGIN_ROOT}/install.sh" "$PWD"` and show its output
   verbatim (it reports what it created, preserved, migrated and skipped — the
   installer never touches what is not DOCOD's).
2. If the installer warned about missing fields in an existing `docod.yaml`,
   show the user the reference at `.docod/docod.yaml` and offer to add them.
3. Point at the doors: `/docod:start` (entry given what exists),
   `/docod:status` (state that never lies), `.docod/README.md` (full docs).
4. Suggest setting `language:` in `docod.yaml` if the team does not work in
   English — everything the method produces comes out in that language.

Re-running this command later is the update flow: the bundle refreshes, the
instance and everything that is not DOCOD's stay untouched.
