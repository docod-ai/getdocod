# `/docod:run <agent> [action] [ws]`

The arguments follow `<agent> [action] [ws]`. The source roles live in
`.docod/agents/*.md`; Codex project agents are named `docod_<agent>`, with
hyphens converted to underscores.

1. Run `node .docod/docod.mjs status`. If the requested action's requires are
   blocked, name the missing requirement and stop. Ask only for a declared
   waiver when the contract says it is waivable.
2. Spawn the corresponding project-scoped Codex custom agent. Pass the action,
   workstream, arguments, and the user's relevant context. Do not perform the
   producer's work in the main session.
3. If it returns `QUESTIONS FOR THE USER:`, relay those questions exactly and
   reinvoke the same agent with the answers. Never answer for the user.
4. A reply with neither a written artifact nor `QUESTIONS FOR THE USER:` is a
   failed run. Say so and retry; never present it as delivery.
5. After delivery, the main session runs
   `node .docod/docod.mjs verify <artifact>`, shows the output, checks the
   remaining evidence postconditions, and runs `status` again.
6. Never approve. Approval belongs only to `/docod:approve` and the user.

