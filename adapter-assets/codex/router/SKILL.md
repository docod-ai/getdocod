---
name: docod-commands
description: Route the stable DOCOD command namespace. Use whenever the user invokes /docod:start, /docod:status, /docod:continue, /docod:approve, /docod:ws, /docod:run, /docod:report, /docod:lead, /docod:loop, or /docod:diagnose. Do not trigger for unrelated slash commands.
---

# DOCOD command router

The `/docod:*` namespace is an explicit user instruction, never ordinary prose.

1. Parse the command name immediately after `/docod:`. Preserve all remaining
   text as its arguments.
2. Accept only: `start`, `status`, `continue`, `approve`, `ws`, `run`, `report`,
   `lead`, `loop`, and `diagnose`.
3. Read `.docod/adapter-assets/codex/commands/<command>.md` in full and execute
   that contract with the preserved arguments.
4. Never substitute a similarly named Codex built-in. In particular,
   `/docod:status` is DOCOD project state, not Codex session status.
5. Unknown `/docod:*` names stop with the valid list. Never guess an alias.

