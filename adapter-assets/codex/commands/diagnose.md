# `/docod:diagnose [target] [--with-docs <dir>]`

Run diagnostic mode from `.docod/spec/agent.yaml`: reverse engineering without
governance adoption. Nothing produced becomes approved; every output is a
dated snapshot.

1. Read `docod.yaml`, scope the requested targets, and include legacy docs as
   external provenance when supplied. No docs is not a blocker.
2. Spawn applicable reverse actions using the project agents: `docod_prd`,
   `docod_system_design`, `docod_data_design`, `docod_api_contract`,
   `docod_security_design`, and `docod_rules_factory` when standards matter.
   They must emit evidence, DIV-nn claim-vs-reality findings, RISK-nn one-way
   risks, owners, and external-owner questions through the runtime queue.
3. Relay every hand-back exactly. Never invent answers or let parallel agents
   hand-edit the shared queue.
4. Spawn restricted `docod_tech_lead` with `consolidate_diagnostic`, verify the
   dated diagnostic, then run
   `node .docod/docod.mjs report --diagnostic`.
5. Present counts first: DIVs, RISKs, open external questions, provenance
   census, then gravest findings with evidence. State the line accurately:
   the system is pre-read, not pre-approved.

