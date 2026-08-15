# Which skills are these?

DOCOD has three skill surfaces with different ownership:

- `skills/` contains Codex plugin command skills such as `start` and `status`.
  They are layer-3 adapter materialization and preserve `/docod:*`.
- `spec/skills/` contains the 13 vendor-neutral crafts used by method agents,
  such as requirements elicitation and schema migration. They are layer 2.
- `.agents/docod/skills/` exists only in an installed project. It is the
  generated canonical copy of `spec/skills/`; `.agents/skills/docod-*` and
  `.claude/skills/docod-*` are harness discovery links to those copies.

Do not move a craft into this directory to make Codex discover it. Register it
in `spec/method.yaml`, place its contract in `spec/skills/`, and let the
installer materialize the selected adapter.
