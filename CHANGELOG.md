# Changelog

All notable changes to the DOCOD bundle. Versions follow semver and match the
`specVersion` in the spec files: patch = fixes, minor = new agents/commands/
migrations (backward-safe), major = contract changes that move user state —
and those only ship together with their migration (install.sh step 2b).

## [1.1.0] — 2026-07-23

Added: `/docod:loop`, delegated run under a human mandate — chains
build → external verify → QA → fix rounds → diff review per task, stopping
only at hand-backs, repeated failing verdicts, blocked requires, or anything
needing approval (it never approves). Supervised delegation, not autopilot.

Changed: `task-executor` now reads `cicd-guidelines`, checks the project's
isolation rule before its first edit (no rule = a flagged gap, never a license
to edit the mainline), and ticks each subtask the moment it verifies — the
checkboxes are the only progress signal the method reads. `project-management`
now counts capacity AI-natively: governance bandwidth (approvals, reviews,
inquiry answers), not typing hands; velocity is measured through the gates.

Docs: README and ARCHITECTURE updated accordingly.

## [1.0.0] — 2026-07-23

First public release. 28 agents (27 producers + tech-lead counsel), 37
registered artifacts, 12 skills, 4 rule templates, 2 adapters, and the
governance runtime (`docod.mjs`): status · start · continue · approve · ws ·
report · verify · rebless. Pure-bash installer, node ≥18 runtime with vendored
YAML, zero installation. Battle-tested on three real projects before this tag;
the model's pending/resolved history lives in `migration.yaml`.
