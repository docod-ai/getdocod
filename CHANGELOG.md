# Changelog

All notable changes to the DOCOD bundle. Versions follow semver and match the
`specVersion` in the spec files: patch = fixes, minor = new agents/commands/
migrations (backward-safe), major = contract changes that move user state —
and those only ship together with their migration (install.sh step 2b).

## [1.0.0] — 2026-07-23

First public release. 28 agents (27 producers + tech-lead counsel), 37
registered artifacts, 12 skills, 4 rule templates, 2 adapters, and the
governance runtime (`docod.mjs`): status · start · continue · approve · ws ·
report · verify · rebless. Pure-bash installer, node ≥18 runtime with vendored
YAML, zero installation. Battle-tested on three real projects before this tag;
the model's pending/resolved history lives in `migration.yaml`.
