# `/docod:loop <task> [--until qa|review]`

Dispatch exactly one task through the non-human stretch. This is not a batch
runner and never replaces a human gate.

1. Restate the task and end stage (default: code review). Confirm once.
2. Spawn `docod_task_executor`; verify its delivery externally; spawn
   `docod_qa_executor`; when QA finds code-local bugs, reinvoke the executor's
   fix action and re-run QA, at most two fix rounds; then spawn
   `docod_code_review` unless `--until qa` was requested.
3. Stop and hand back when an agent returns `QUESTIONS FOR THE USER:`, a
   requires gate blocks, the same task receives a failing verdict twice, a
   finding belongs to an approved upstream artifact, anything needs approval,
   or a human decision is materially required.
4. Otherwise continue without requiring station-by-station babysitting. End
   with one report containing verdicts, evidence pointers, and the exact human
   queue. Never deploy, release, or approve.

