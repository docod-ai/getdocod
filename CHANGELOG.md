# Changelog

All notable changes to the DOCOD bundle. Versions follow semver and match the
`specVersion` in the spec files: patch = fixes, minor = new agents/commands/
migrations (backward-safe), major = contract changes that move user state —
and those only ship together with their migration (install.sh step 2b).

## [1.9.0] — 2026-07-31

The coverage release — born from the sharpest field case yet: at task 6 of
dozens, the question "where is the auth task?" had no answer. The
system-design had defined "COMP-07 — Identidade & Autorização"; extraction
produced the component's NOUNS (user tables, enrollment, role mutation) and
lost its VERB (authenticate a request). Every downstream gate passed,
CORRECTLY: each gate checks its artifact against its input, and no gate
checked the input was completely carried forward. The invariant "every
design component has a task" lived nowhere it could be enforced.

Added: the COVERAGE guard in `verify` — external, run by the caller, because
the RF-coverage postcondition already existed in the extraction contract and
did not save (a deterministic postcondition in band is self-attestation; the
lesson that created verify, one level up). On a `tasks` index: every ID
defined upstream (definition-shaped lines — headings, bold entries — in the
system-design and the FRD) must be cited by at least one task file, or
verify warns naming the orphans and where they were defined. A citation,
including a declared gap, is visibility; zero citations is a hole nobody has
looked at. This check would have caught the auth hole on extraction day.

Changed: task-extraction gains the component→task edge as a deterministic
postcondition and the doctrine that names the failure — a component's nouns
are not the component; when its tasks are done, read the component's NAME
and ask whether some task DOES what it is FOR. The tasks.md template gains a
Coverage section (design names → tasks, or the gap declared). The machine
checks the citation edge; only extraction can check the verb.

Recorded (migration.yaml `coverage-invariants`): coverage is a CHECK CLASS —
the sibling edges (prd goals → RFs, boundaries → contract operations, slos →
alerts) get wired one real miss at a time; an invariant without a field case
behind it is a checklist item, and checklists rot.

Fixed (caught in the field, pre-tag): the registry's `sections:` had DRIFTED
from four agents' `## structure` — adr said 8 (the v1 prompt's list, with
Status and Authors the rewrite moved into the frontmatter) while the
structure defines 6, so EVERY real ADR failed verify's count, including
fifteen approved ones; the agent that refused to invent a seventh section to
please a counter was right. Same drift on test-plan (8 vs 6),
integration-guide (10 vs 9) and postmortem (11 vs 9). All four registry
mirrors realigned to their structures — the structure is the source
(agent.yaml ruled it: the body IS the prompt, `## structure` IS the minimum
sections, one place). And the reference gained its validator, per house law:
validate-layers.py now compares every `sections:` mirror against the owner's
structure ('##' count vs declared minimum, Title discounted; skipped for
multi-artifact owners where attribution is ambiguous) — tested by planting
the ADR drift first. A mirror without a validator is how fifteen approved
documents fail at once, eleven releases in.

Changed: the `report` dashboard, restyled and reorganized. Same dossier language
as `report --diagnostic` (serif/mono/sans, ink panels, semantic status colors),
plus a manual light/dark toggle that overrides the OS theme and persists. Tasks
are grouped by PRD — collapsible, in numeric SEQUENCE order (the plan order, not
lexical: 2 before 10), with per-group progress and done/doing/todo counts, and
drill-down into any task. The Flow tab groups the possible/blocked actions by
method STAGE (define → orchestrate → confirm → observe → [re]define), the SDLC
phases the README maps — each action now carries its stage in the report data.

specVersion → 1.9.0 in lockstep (5 spec files + install.sh + plugin.json).

## [1.8.0] — 2026-07-30

The resident-guide release: the answer to the adoption paradox the market
analysis named — teams with the discipline do not need the tool; teams
without it do not adopt, because adopting demands the discipline they lack.
The way out: the tool teaches itself, through the one agent already allowed
to live in the main session.

Added: the tech-lead's `guide` action — the resident expert in the DOCOD
method and the getdocod runtime, for the user who ran a reverse and is lost.
It DERIVES its expertise on every run (status + the artifacts + the spec —
never a memorized flow, which would rot the day the runtime changes) and
answers with exactly three things per step: the next step, the why in the
method's own terms, and the EXACT command to run. Guide, not pilot: it shows
the move and the user makes it — the instant it executed the step, approved,
or worked the gate it would be the orchestrator-in-disguise the method
forbids. Teaching rides along by design (why the gate exists, why reverse
comes before forward): a guide that only names commands builds dependence;
one that explains the mechanism builds the autonomy adoption actually
requires. Orientation that changes a direction logs to counsel like any
influential advice. `/docod:lead` gains the "what now?" mode; start/continue
keep showing the mechanical doors — the guide adds the judgment of which
door and why, and the human decides. It is also the diagnostic's missing
bridge: the reverse scares the owner, the guide takes their hand from the
dossier into the method that keeps the findings true.

specVersion → 1.8.0 in lockstep (5 spec files + install.sh + plugin.json).

## [1.7.1] — 2026-07-30

The post-release review pass — three findings from evaluating 1.6/1.7 against
a live fixture, each one a small honesty gap in the release that made honesty
the product.

Fixed: the REPORT DATA CONTRACT now declares EVERYTHING the template consumes.
The dossier read `questions`, `thesis`, `standfirst`, `verify`, `corroborated`,
`unconditional` and `census.git` — none of them in the declared contract (and
the tech-lead's postcondition promised `questions` the contract omitted). A
consumer reading keys the contract does not name is the recurring failure this
repo documents nine-plus times, shipped inside the release that created the
contract. Also made explicit: `inferred` belongs to NEITHER census axis — a
deduction is not recorded rationale and nobody vouched it.

Fixed: snapshot anchors are now RE-READ and tallied as an as-of-now
OBSERVATION (never a warning, never a failure). The dossier's trust strip
prints "N anchors verified" — but the diagnostic is snapshot lineage, and the
fragment check exempted snapshots entirely, so the product's flagship number
was the one thing the machine never checked: self-attestation inside the trust
section. Now verify reports the tally (match / moved / gone / unresolvable)
and the reader dates it: fresh snapshot ⇒ fix the transcription; old snapshot
⇒ the measured drift a new diagnosis prices.

Fixed: the Portuguese absolute-absence pattern required no absence verb —
"nenhuma decisão pendente" fired. A false positive trains the reader to ignore
the alert (house law); the pattern now demands concept AND record-verb, with a
separate nunca/jamais + verb form. And the CONFIG GAP warning now also prints
at `start` — the one door a brand-new user hits before ever running `status`.

## [1.7.0] — 2026-07-29

The diagnostic-as-product release: three fronts that make the diagnostic
honest, sellable, and free of silent defaults.

Added: the sellable report profile. `docod.mjs report --diagnostic` renders a
static, self-contained, theme-aware dossier from the `report:` data block the
tech-lead's `consolidate_diagnostic` now emits (the REPORT DATA CONTRACT in
artifacts.yaml § diagnostic). Shock-first, evidence-dense (file:line with the
observed fragment), the honest "pre-read, not pre-approved" line kept as the
trust signal; the template is dumb, the consolidation is the intelligence.
Wired into /docod:diagnose as THE deliverable.

Added: the product language is asked, never defaulted. install.sh writes
`language: unset` (an invented default is what rules.yaml forbids); `status`
shows a CONFIG GAP until it is set, at ANY entry door; the shared agent preamble
stops before producing and records the choice. One trigger on the root file,
not per-command.

Changed: the provenance census reads on TWO AXES — recorded (evidence +
external + git-history) vs ratified this run (user-supplied + decided). A zero
in one class is never absence of the concept: legacy rationale lives in
`external`, recorded not ratified. `verify` now flags absolute-absence claims
("not one why was recorded", "no decision on file") in produced narratives so
the flatten cannot ship. Born on record: a brief that read "0 user-supplied →
no why exists" while the legacy PRD carried explicit rationale.

specVersion → 1.7.0 in lockstep (5 spec files + install.sh + plugin.json).

## [1.6.0] — 2026-07-29

The diagnostic release: the spearhead product unpacked from the method
(migration.yaml `diagnostic-mode`, viability proven by the Blue City pilot
on a foreign harness with none of the governance runtime present).

Added: `/docod:diagnose` — diagnostic mode as a door. The reverse unhooked
from governance: no approvals, no pins, no gates, no adoption required. What
rides along, because it costs nothing and IS the value: provenance labels,
observed-at hashes, DIV/RISK numbering with the evidence bar, an owner per
finding, and the external-questions queue — the line between a diagnosis and
a consultancy PDF. Everything produced is a dated snapshot: the system
leaves PRE-READ, not PRE-APPROVED — nothing self-approves, and adopting the
method later means a human vouching the artifacts forward.

Added: the `diagnostic` artifact (39th) — the consolidation of a run, owned
by the tech-lead (new `consolidate_diagnostic` action): numbered DIV and
RISK tables with owners, provenance census, open external questions, honest
coverage. Snapshot and immutable: a new diagnosis is a new file, and the
drift between two dated diagnoses is itself a product.

Changed: DIV-nn generalized from doc-vs-code to CLAIM-VS-REALITY — the claim
side may be a legacy doc OR another code artifact's stated contract (a
client type against the real endpoint shape is a legitimate DIV with no
document involved; the field's DIV-17 was already this shape, homeless).

Added: the RISK-nn class — the finding with no second side (exposed PII,
one-click destructive actions, leaking surfaces): code plus the judgment
that it is dangerous. Full parity with DIVs: numbered, same evidence bar
(file:line with the observed fragment), an owner per item; classification
maps to discipline the method already has (security-design Accepted Risks,
divergence_taxonomy's unmet-target exclusion). The pilot improvised the
label in prose; this promotes it to a class. Consequence for the offer: the
diagnostic has TWO engines and only one needs docs — the precondition is
"your system's parts stopped agreeing", not "you have docs you distrust".

Fixed: the installer copied the bundle's own `.git` into `.docod/`, nesting a
git repository inside the user's project and colliding with their repo. `.git`
and `.gitignore` are now excluded from the bundle copy — the bundle installs as
plain files, never as a repo.

Docs: README's legacy section now covers `/docod:diagnose` and the
claim-vs-reality DIV + RISK-nn model; the verification guarantee ("the rules
nothing bends") reflects verify's completeness and prose-reference checks
(catching up 1.5.0).

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
