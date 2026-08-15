# `/docod:approve <file> --by <who>`

Approval is the user's act. Require the file and the approver identity from the
explicit request, then run:

```text
node .docod/docod.mjs approve <arguments>
```

Never infer the approver. Re-approving amended content requires the runtime's
`--impact <file>` or `--no-impact "<reason>"` argument. Do not bypass that
refusal. Run and present `status` after a successful approval.

