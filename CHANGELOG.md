# Changelog

All notable changes to the DOCOD bundle. Versions follow semver and match the
`specVersion` in the spec files: patch = fixes, minor = new agents/commands/
migrations (backward-safe), major = contract changes that move user state —
and those only ship together with their migration (install.sh step 2b).

## [1.5.0] — 2026-07-29

The field-report release: every change below answers a defect named by an
agent that ran the method for real.

Added: `verify` completeness — the check that made VERIFY OK stop lying. A
truncated FRD (11 requirements and 4 sections short, its promised frd.yaml
never written) had passed with a hundred ✓ because verify measured provenance
and was read as measuring integrity. Three truncation detectors, all
fail-tier: section count vs the contract's declared minimum (count, not
names — language-neutral by design), kept frontmatter promises (a promised
companion file that does not exist fails), and presence of `status` on
registered artifacts. Paired with the new `write_order` protocol in
spec/agent.yaml: the producer stamps `status` LAST, so its absence IS the
incomplete-run marker — no heartbeat, no progress file; completion itself is
the mark.

Added: prose-reference watch in `verify` — the two rot vectors that bit four
owners in one session. A hash quoted in the body that matches no current
artifact and no declared input warns (one survived three rounds and an
approval while wrong); a NAKED file:line anchor in a live-lineage document
warns (snapshot records observe and are exempt). Naked is the operative
word, caught in review before the tag: the reverse's evidence discipline
REQUIRES file:line — "cite file:line or do not claim" is what found the
production bug — and a guard firing on the method's own prescribed output
would be defect #3 reborn inside the best feature. The line is drawn by
content, and the machine CHECKS it rather than trusting its syntax: an anchor
carrying the observed fragment in backticks on the same line is re-read against
the cited file — present at the line passes, moved is flagged as drift, gone as
rotted evidence (presence of backticks is not a free pass). The producers were
brought into conformity in this same release: the evidence format
(file:line PLUS the observed fragment) is now the contract in
spec/agent.yaml (provenance, reverse_conventions, postcondition natures) and
in every reverse-capable agent's postconditions. Backed by the new
`reference_discipline` block: reference by content, declare in inputs[]; the
checking procedure a field agent had to discover by hand is now the
method's own.

Recorded, not shipped (migration.yaml, deliberately): gate granularity
(`graduated-gate`) gained the review's sharpest observation — everything in
this release makes the tooling MORE honest, which means MORE catches at the
exact gate nobody widened. WHO approves stays this-or-nothing; WHAT crosses,
in which ceremony, is the highest-leverage open item and deserves
rebless-grade design, with decision-reversibility as the doctrine. And to
keep readings honest: seven closed defects make the method truthful and
quiet, not cheap — the 5:1 is design cost, untouched on purpose.

Added: `ws add` — the light registration door. A front whose tasks already
existed (file, line, approach, criteria from a field report) would have cost
a prd round to restate what was already stated, and the honest
recommendation was to bypass the method; a method better served by being
bypassed in a legitimate case is information about the method. --reason is
mandatory and travels in the registry entry; the prd remains the default
door.

Added: the `external-questions` artifact — the single queue of questions only
an outside owner can close. They had accumulated scattered across four
decision logs, the easiest kind to lose because nobody inside the project
can close them. One file on purpose (unlike per-agent `decisions`); `status`
surfaces the open entries on every run.

Added: `divergence_taxonomy` in spec/agent.yaml — a FALSE CLAIM (doc asserts
X, reality is Y) justifies an amendment; an UNMET TARGET is the normal
condition of a PRD/SLO and justifies none. Born from CS-7: the two were
confused and nearly cost an unnecessary PRD amendment plus its cascade.

Fixed: `rebless --repin-inputs` resolves the keys the agents actually write and
no longer fails silent. The fourth field-found key shape — scope-prefixed
parenthesized keys ("project (docs/product/prd.md)") — now unwraps before
normalization (the basename had choked on the closing paren and declared
identified sources non-repinnable). And it no longer answers "nothing to
rebless" when it means "I don't know how to resolve this": every stale input
without a unique resolution is listed under CANNOT RESOLVE with the reason, and
the exit code goes non-zero — a stale input never again walks out looking whole.

Fixed: the self-citation noise in `verify`'s undeclared-ADR guard. An ADR
citing its own ID (which its `## structure` requires in the title) warned on
every ADR ever written, and `counsel` warned by function (citing ADRs is
what the log is for). Own number excluded; append-only logs exempt. An
alert that always fires trains the reader to skip the line where a real
problem will one day be.

## [1.4.0] — 2026-07-24

Added: Claude Code plugin packaging (.claude-plugin/ + /docod:setup-docod);
the `handoff` skill (session-only context by reference, never duplicating
artifacts); skill enrichment learned from the field — seams and the
tautological-test anti-pattern in testing-guidelines, feedback-loop-first as
the spine of bugfix, tracer bullets in vertical-slicing.

Added: touched-doc-means-mapped-radius, mechanically. Re-approving an artifact
AMENDED after approval now requires either --impact <impact-file> (recorded in
the frontmatter) or --no-impact "<reason>" (a recorded waiver); the runtime
refuses otherwise. Born on record: an ad-hoc impact sweep left 4 task files
stale (2 merged) and spent effort on a non-ripple; the owned transitive
closure caught both. First approvals untouched; cosmetic bulk has rebless.

Changed: `/docod:loop` is now the dispatch of ONE task through the non-human
stretch (build → external verify → QA → fix rounds → diff review), not a batch
runner across tasks — parallel tasks are parallel dispatches. Same stop
conditions (hand-backs, upstream root cause, repeated failing verdict, anything
needing approval); it never approves.

Docs: README gains the plugin install path and a "Where DOCOD sits" section
(skill pack vs process framework vs raw agent — what each gives, what it
cannot); ARCHITECTURE documents the impact-approval gate and the
attribution-mismatch warning.

## [1.3.0] — 2026-07-23

Added: the upstream-root-cause gate. QA now classifies every bug's root cause
by layer (this task's code vs a named upstream artifact); an UPSTREAM root
cause triggers impact-analysis and blocks forward-patching. The executor is
forbidden to patch around an approved contract/design ("additive,
non-breaking" self-classification is the fork). The loop stops on it. Found in
the field: a code fix for a contract omission created a code↔design
contradiction that no hash can detect, because neither side was edited — they
just stopped agreeing.

## [1.2.1] — 2026-07-23

Fixed: `verify` false-positive storm — the undeclared-ADR-link guard sliced
path-shaped keys to "docs" and warned on every declared ADR. It now extracts
the ADR number from any key shape. When everything warns, nothing warns.

## [1.2.0] — 2026-07-23

Added: the execution-start stamp. The task-executor's first write on a task is
`execution: {started: {by, at}}` in its frontmatter (a fact, not a progress
claim; `co_writer` extended accordingly), and the report's kanban shows a
stamped-but-unticked task as in progress. Also exposes abandoned tasks:
started long ago, zero ticks.

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
