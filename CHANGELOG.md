# Changelog

All notable changes to the DOCOD bundle. Versions follow semver and match the
`specVersion` in the spec files: patch = fixes, minor = new agents/commands/
migrations (backward-safe), major = contract changes that move user state —
and those only ship together with their migration (install.sh step 2b).

## [1.12.1] — 2026-08-12

Fixed: the task-executor no longer narrates its worklog into the code. A field
example — a home component whose comments carried "Tarefa 8.9 (RF-014)", the
subtask decision log, dates and `grep` commands — reads to a reviewer as AI
churn and couples the source to instance-internal task numbers that drift when
a task is resequenced. New execute_task postcondition: comments carry the
non-obvious WHY for the next engineer, never the worklog; the trace is the
record's job (the commit, the task file, `tasks.md`). The code is the
deliverable; the record lives elsewhere — CONDUCTOR's two-registers doctrine,
one layer down.

coding-standards clarifies this is method-level, not a project rule: "comments
carry the why, never the worklog" survives a change of language, so by the
template's own generation test it is advice, not a CS rule — it lives in the
executor's contract, not a derived ruleset.

specVersion → 1.12.1 in lockstep (5 spec files + install.sh + plugin.json).

## [1.12.0] — 2026-08-06

The conductor release — from the review-loop field transcript ("um vai e vem
que confunde e faz o usuario querer desistir"). Diagnosis, verified against
the bundle: every producer runs contracted and isolated and behaves; the main
session — the actor the user actually talks to, the one that reads state,
dispatches and hands back — ran on a discovery block that only governed
"acting as an agent". The only ungoverned actor in the method was the one
touching every interaction, and it improvised: four throwaway verifier
scripts with four different parse bugs, one of which hid the single real
divergence from the instrument presented as proof.

Added: `CONDUCTOR.md` at the bundle root — the always-on contract of the main
session, deliberately NOT an agent. It fails the agent test (delivers no
document), and per the method's own precedent (requirements-specialist,
diagrams) what fails the test is expelled to its own kind, never bent in:
agent.yaml § nao_e_agente gains the `conductor` entry, the third non-agent
kind after rule and skill. The agent law ("an agent that delivers no document
binds nothing") stays untouched — no carve-out. The contract: route, surface,
record; dispatch owners, never produce inline; never improvise a check, a
step, or vocabulary; and a hand-back style law with four rules — SEVERITY
FLOOR (below-minor goes to a declared debt list, and the floor filters where
a finding is REPORTED, never what severity it GETS), ACT BY DEFAULT (one
clearly better path → take it and name why, never on what the user owns),
LABEL YOUR OWN CHECKS (runtime-verified vs self-scripted are different
claims), TWO REGISTERS (the record stays dense and complete; the hand-back
translates — claim first, IDs demoted to citations, output summarized never
dumped). Its checks are declared judgment-class: a conversation has no hash;
the verifier is the human noticing — said in the contract itself, so the
contract does not violate the self-attestation doctrine it carries.

Wired: the discovery block install.sh writes into CLAUDE.md/AGENTS.md gains a
"Conducting the session" bullet — plain prose, harness-neutral on purpose (an
@-reference would be one harness's syntax; the block is read by all of them).
commands.yaml's "NOT an orchestrator agent" law is reconciled in place: the
prohibition stands — the forbidden orchestrator DECIDES; the conductor
contract exists to forbid deciding. validate-layers gains a conductor check
(exists, limbs present, body stack-neutral) instead of an agents/ exemption —
the reference is validated because a declared reference with nothing on the
other side is this project's recurring failure.

Added: `verifier_discipline` in spec/agent.yaml — the verifier is also a
claim. Two field cases: the improvised verifier (four scripts, four parse
bugs, the accidental set-match that hid the real divergence; the catch came
from the reviewer who did NOT write the script) with the three-step ladder —
label as assertion, re-run by a non-author, promote vocabulary-first after
the second improvisation; and the refused rule (a TDD rule written, the model
still declining tests, only the measured coverage catching it) — a rule the
producer holds is an intention; only a check the producer does not control is
a fact.

Fixed: the `approved_with_comments` limbo is now NAMED where it bites. The
downstream gate compares literally with 'approved', so a with-comments
verdict can never satisfy it without a fresh clean re-review — which turned
every such state into a user-paid arbitration ("is the waiver a shortcut?").
status now says it at the decision point: the waiver is the DESIGNED path,
comments stay as declared debt, not a bypass. Message honesty only; the gate
semantics are graduated-gate's design (migration.yaml, now carrying this
transcript as field_proof and the open edge-definition question).

Recorded in migration.yaml, with open decisions named: `traceability-invariant`
(promote the four-times-improvised COMP-/RF- set-equality into verify, the
COVERAGE path — vocabulary first: the table convention becomes method
vocabulary before the machine enforces it; report set differences, never a
bare count) and `health-delta` (the one genuine gap in the field's "four
mandatory tests": measure code-health delta against the pre-change baseline
as an evidence postcondition — three open decisions: where the baseline
lives, who measures under layer-2 neutrality, how rules-factory derives the
ceiling).

specVersion → 1.12.0 in lockstep (5 spec files + install.sh + plugin.json).

## [1.11.1] — 2026-08-04

Two gaps found reviewing 1.11.0, both the week's own disease (announced is
not recorded; a rule with no owner).

Fixed: `rebless --only` now RECORDS its scope, not just announces it. The
plan header named the scope on the console — which scrolls away — while the
only durable record, the touched approval, carried just `rebless_reason`. Six
months on, a reader could not tell a full sweep from a scoped one, losing
exactly the negative a partial sweep must keep: which files were not examined.
Each touched approval now persists `rebless_scope` (structured, not concat'd
into the prose reason — the same don't-bury-provenance-in-prose lesson as the
edge-lineage work). Absent `--only`, nothing is added.

Fixed: `finding_urgency` now says WHO answers "would it change what is about
to be built?" — the agent that found it, which is the one with the least
downstream visibility, and the error is asymmetric ("no" when it was "yes"
builds on a known-wrong foundation). The closing rule: an agent may answer
"no" only if it can NAME the downstream work and show the finding does not
touch it; otherwise it records the finding UNCLASSIFIED and the human decides
at the drain. No throughput added — the human decides only where the agent
admits it cannot see.

specVersion → 1.11.1 in lockstep (5 spec files + install.sh + plugin.json).

## [1.11.0] — 2026-08-04

The cascade-week release — the buildable slice of a week-long diagnosis
(five real findings, ~20 agent rounds; the amplification was sequencing and
tooling, not rigor). What was inequivocal ships; what needs measurement
first is recorded in migration.yaml (`section-granularity`,
`cascade-economy`) with its open decisions named, so it waits for design
instead of evaporating.

Added: `rebless --only <path>` (repeatable) — the pointer-tax squeegee.
Closing the design body used to require sweeping the task files too,
because rebless was all-or-nothing: 128 re-pins, zero intellectual content.
Two deliberate semantics: the scope filters which files are TOUCHED, and
CANNOT RESOLVE reports only in-scope orphans — otherwise the flag would not
free you from looking at what you scoped out. The plan header names the
scope: a partial sweep is on record as partial.

Added: `finding_urgency` in spec/agent.yaml — the sorting doctrine for
findings, tested against the field week. The question is "WOULD IT CHANGE
WHAT IS ABOUT TO BE BUILT?" (not "does it block execution?", which left
both real cases undecided): yes ⇒ now, the cascade is paid; no ⇒ recorded
and drained in a deliberate, HUMAN-fired batch. What is deferred is the
re-run, never the knowledge — deferring knowledge is the
converge-early-and-patch sin. Security findings are always "now".

Fixed: migration.yaml had carried a silent duplicate-key corruption since
1.9.0 — the coverage-invariants insert ate the `- id: graduated-gate`
header, folding that entry's keys into the one above. The dev validator's
parser swallows duplicates (last wins), so it stayed green; the runtime's
strict YAML 1.2 parser is what refused. Header restored, with the incident
annotated in place — the mirror-drift disease struck the very file that
catalogs it.

Added: the four-case coverage taxonomy in task-extraction, with the
measured field case. The auth component was defined 41× and cited 16× —
the coverage check was GREEN and the verb was still missing. The check
catches defined-but-uncited; badly-extracted needs the extractor's own
question ("does some task DO what it is FOR?"); never-defined needs the
design gate. Coverage is a FLOOR (did anyone look?), never a ceiling (did
they look right?) — and the child-ID iteration that could lower the ceiling
waits, in migration, for a decomposition convention.

## [1.10.2] — 2026-08-03

The finishing pass on the review of 1.9.0–1.10.1 — three notes, one of them
the method's own medicine: the spec had gained the noun (`lineage: snapshot`
on an input entry) and NO producer had gained the verb. No agent knew to
emit it — the security-design, the literal field case that motivated the
feature, had no instruction to mark its api-contract edge. A mechanism
nobody triggers does not reach the field; it is the COVERAGE failure one
layer up, shipped by the people who named it.

Fixed: the producers now know the verb. The shared subagent preamble
(install.sh, rule 3 — every generated agent reads it) teaches the edge
discipline: live dependency ⇒ nothing extra; input read for context,
typically one that derives from your artifact downstream ⇒ `lineage:
snapshot` on the entry; and an input actually read is NEVER dropped to
silence staleness — that erases provenance. The security-design gains the
concrete contract: a deterministic postcondition marking the api-contract
edge snapshot, and the doctrine in its note (data-design must bite;
api-contract asks for a reassess — one artifact-level class cannot say
both, the entry-level one can).

Fixed: the status-vocabulary fallback no longer degrades in silence. It is
the one surviving mirror, and it fails PERMISSIVE — a spec restricting the
vocabulary would be ignored without a word. Both fallback paths (method.yaml
unreadable, `status:` block missing) now announce themselves on stderr.

Fixed: the coverage OK names what it proves. The check measures VISIBILITY
— cited by at least one task or declared as a gap — not construction; a
green that reads as "everything has a task" would be the flatten the census
fix just killed, in a new spot. The message now says: citation proves each
ID was SEEN by extraction, not that it was built; the verb remains
extraction's judgment.

## [1.10.1] — 2026-08-03

Fixed: `verify` now reads the status vocabulary from method.yaml's state
machine instead of a retyped list. The hardcoded trio (draft|review|approved)
failed every `superseded` document — a state the spec itself defines as legal
and terminal ("replaced by another artifact; kept for history") — and would
have failed `rejected` the same way. The field case: ADR-0004, correctly
superseded by its replacement, red forever; and the tempting "fix" (flipping
it back to approved to please the tool) would have reintroduced the exact
defect supersession exists to prevent — an executor reading a stale ADR as
current. The document describes the world; the checker checks the document;
when they disagree and the document is right, the checker is wrong. Third
always-red alarm in one week (sections drift, the mutual-staleness cycle,
this), all one disease: an alarm that always rings stops being an alarm.
Same cure as 1.9.0's sections fix, one step further — do not validate the
mirror, DELETE it and read the source (with a matching fallback only for a
bundle whose method.yaml is unreadable).

## [1.10.0] — 2026-08-03

The edge-lineage release — one field critique, correct end to end: lineage
was a property of the ARTIFACT, applied to every input alike, and the
relation to each input is not alike. The security-design's edge to the
data-design is live (the model changes ⇒ the threat model may be WRONG); its
edge to the api-contract is not — the contract DERIVES from it, so a
contract change asks for another look, not invalidation. One value forced a
false choice: live made both edges permanently red (the cycle that appeared
in the field); snapshot silenced the legitimate data-design alarm. And the
workaround — dropping the input, citing it in prose — resolved by ERASING
the information: six months later the file reads as "written without looking
at the contract". False, and machine-illegible.

Added: `lineage: snapshot` on the INPUT ENTRY (edge-level). The relation
stays written, the hash stays observed-at, and the alarm rings only where it
should: verify reports the edge (never fails it), impact-analysis — not
staleness — is who revisits it, and `rebless --repin-inputs` skips it
(re-pinning an observed-at would lie about what was read). Downgrade only,
two guards: an unknown edge value warns and is treated as live; `lineage:
live` on an edge inside a snapshot artifact warns and is ignored — a record
of a moment never fails, whatever its edges claim. Absent `lineage` on an
entry keeps exactly the old behavior: the artifact-level class remains the
default, so no existing frontmatter changes meaning.

specVersion → 1.10.0 in lockstep (5 spec files + install.sh + plugin.json).

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
