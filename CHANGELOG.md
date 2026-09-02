# Changelog

All notable changes to the DOCOD bundle. Versions follow semver and match the
`specVersion` in the spec files: patch = fixes, minor = new agents/commands/
migrations (backward-safe), major = contract changes that move user state —
and those only ship together with their migration (install.sh step 2b).

## [1.22.2] — 2026-09-02

Fixed, from a real tasks folder one hour after 1.22.1: three defects in the
per-task grammar. (1) The task number was read as the LAST digit run in the
name, so `evidencias-3.0.md` (the task's "3.0" heading id) became "task 0"
and every evidence file in the field was an orphan; the number is now the
FIRST number after the artifact prefix, read numerically — `1_task.md`,
`evidencias-1.0.md` and the contract's `qa-0001.md` all say task 1. (2) A
record with NO number — `qa-report.md`, and the pre-1.22.0 fixed
`qa.md`/`codereview.md`/`bugs.md` — is not an orphan: it is a FOLDER-LEVEL
record, the verdict of the whole task set; verify says so, the codereview
opposition falls back to it when no per-task qa exists, and the report
shows it on the task group's header instead of warning. (3) The silent
one: when the paths became `<key>-{seq}.md`, the legacy fixed names
stopped matching the registry glob and every existing project's
`codereview.md` vanished from status — `code-review.re_review` showed as
BLOCKED over a file sitting right there. Per-task artifacts now also
discover their fixed legacy name; a record the registry knew yesterday
never becomes invisible.

specVersion → 1.22.2 in lockstep (5 spec files + install.sh + both plugin.json).

## [1.22.1] — 2026-09-02

Fixed: 1.22.0 misread the author's numbering. `qa-{seq}`, `codereview-{seq}`
and `bugs-{seq}` were absorbed as review ROUNDS ("the newest per folder
counts, earlier ones are history") when `{seq}` is the TASK's seq — the
convention `evidencias-{seq}` always had ("Task: {seq}_task.md"): qa-0003
is the qa OF task 0003, not a third pass. Under the shipped reading the
runtime lied within a day of use: it marked task 1's qa as "an earlier
round, the qa that counts is qa-0003" and dropped task 1's standing
with-comments debt from DECLARED DEBT because a later TASK existed. Every
piece of the rounds machinery is gone; in its place the vocabulary the
numbering actually needed: `per_task: true` on evidencias, qa, bugs and
codereview. verify says which task a record belongs to and warns on an
orphan (a number with no task beside it); the codereview's upstream-smells
opposition runs against the SAME task's qa (legacy fixed `qa.md` still
read); the reviewer agents' rule is now "one record per task, numbered
with the task's seq; a re-run rewrites that record". The misread is on
record in the ledger with the fixture that proves it.

Changed: the report nests each task's records inside the task. Evidence,
qa, bugs and code review belong to the task they are numbered after, not
to the system's documents, so the Documents tab no longer lists them; on
the Tasks tab each task row shows them as chips coloured by verdict, and
opening a task shows its records strip — each chip opens the record.
An orphan record stays on the Documents tab with its warning: the report
never hides a file.

specVersion → 1.22.1 in lockstep (5 spec files + install.sh + both plugin.json).

## [1.22.0] — 2026-09-02

The producer's-stamp release — a field complaint that sounded like a
feature request ("when I open a draft in the report, move it to review, I
am reviewing it") turned out to be a doctrine hole, and the request's
literal shape was refused on purpose.

Fixed: the wrong party was being corrected. method.yaml defines `draft` as
"incomplete, nobody should depend on it" and `review` as "complete,
awaiting the gate" — and every contract says `writes: {status: draft}`, so
producers stamped draft on FINISHED documents by habit, the human approved
what they had just read, and the conductor lectured them about a flow the
producer had skipped. Now the doctrine says it out loud (method.yaml rule,
agent.yaml § write_order, both harness envelopes in install.sh): the final
stamp of a COMPLETE run is `review`; `draft` is the producer's own
declaration of incompleteness and carries a `draft_reason`; the contracts'
`writes.status` is the status a document is BORN with, not delivered with.
The report was NOT given the power to move status: it derives, it never
writes, and a read is not a transition — a viewer that wrote state would be
an ungoverned actor, the exact thing the owner rule forbids. The report's
status chips now carry the method's definition as a tooltip instead.

Changed: `approve` on a draft stops lecturing. The message says what draft
means (the producer left it incomplete, with the draft_reason if one
exists), the approval records `from_status: draft`, and the EXCEPTION
STREAM lists it — approving a document its producer declared incomplete is
a review-board item, not a scolding. CONDUCTOR.md gains the matching Never:
correct the producer's habit, never the human's act.

Added: review ROUNDS (the author's registry change, absorbed whole).
`codereview`, `qa` and `bugs` are now sequential (`-{seq}.md`) and
registered `rounds: true` — a fixed name overwrote the previous verdict on
every re-run, and the history of how a task got to green was gone. The
vocabulary matters: an adr is sequential too, but each adr is its own
decision; rounds are records of ONE verdict, and only the newest round per
folder counts. Wired everywhere a stale round could have lied: gates and
DECLARED DEBT read only the latest round (planted bug: an
approved_with_comments from round 1 satisfied a gate after round 3 said
changes_requested); status marks earlier rounds as history; verify names
the round and whether it counts, and the codereview's upstream-smells
opposition now runs against the LATEST qa round instead of a fixed
`qa.md` that no longer exists. The reviewer agents gained the round rule
(new numbered file per pass, claim-by-creation, history never deleted).

specVersion → 1.22.0 in lockstep (5 spec files + install.sh + both plugin.json).

## [1.21.0] — 2026-08-29

The declared-links release — the whole check family the ledger's hub entry
was holding open ships in one release: every reference a document DECLARES
is now a reference a machine can cross, and the standing exceptions the
method grants stop hiding in scattered frontmatters.

Added: the traceability invariant, promoted at last. The same set-equality
check on the system-design — each component's declared requirement links
versus the transposed traceability table — was improvised as a throwaway
script FOUR times across one field review loop, with four different parse
bugs; one made the sets match by accident and hid the single real
divergence from the very instrument presented as proof. Vocabulary first,
the COVERAGE precedent: `Traces to:` is now a never-translate label, the
table's cell grammar is declared in the owner's `## structure` (components
`·`-separated; an id inside a parenthesis is a mention, not an assignment),
and `verify` gains the set-equality check — reporting DIFFERENCES, which id
on which side, never a bare count, because a count that matches by accident
is this check's founding bug. Both sides present and disagreeing FAILS;
half the vocabulary present warns (a link nothing can cross-check); a
translated-away label warns. And the promotion paid for itself before it
shipped: this release's own planted-bug run caught the fifth parse bug of
the same class — a mention line promoted to a definition — before it could
ship with a badge.

Added: the scenario floor on the frd. The template's bold field labels
(`Description:`, `Acceptance criteria:`, `Criticality:`, `Traces:`,
`Dependencies:`) become method vocabulary, never translated — the
evals-labels rule — and `verify` warns on every RF whose definition block
carries no criterion under `Acceptance criteria:`. A requirement with no
scenario is acceptance nobody can check. Warn, never fail at birth: legacy
frds predate the vocabulary, and a false positive trains the user to skip
the section.

Added: the enforcement edge — the decision → check link, fourth member of
the declared-links family. An adr MAY declare `enforced_by: [EV-nn]` in its
frontmatter, naming the evals case(s) that hold the decision up in the
code. Optional, because not every decision has a mechanizable check — but a
DECLARED edge is a checked edge: `verify` FAILS a dangling one, an edge
into a retired case (a retired check enforces nothing), and an edge that
does not parse. The reverse direction is the case's own `Origin:` line; the
case's continuous run is the adapters' merge_gate coercion point, already
shipped in 1.18.0. The load-bearing-rule-without-an-edge warn waits for a
weight marker, on record in the ledger.

Added: the EXCEPTION STREAM, `status`'s sibling of DECLARED DEBT. Every
standing exception the method has granted, surfaced in one derived block on
every run: correction approvals, partial rebless sweeps, `--no-impact`
waivers, waived preconditions — now with a canonical frontmatter shape,
`waived_requires: [{artifact, by, reason, at}]` (agent.yaml § waivable);
legacy free-form waiver fields still surface, never fail — and, when the
bundle repo is the cwd, the dev-side third-party name grants. Nobody keeps
this list; the standing records ARE the list, and the block is the review
board's agenda. The machine assembles the evidence; the human makes the
call — reversing those roles would be dismantling governance, not
automating it.

specVersion → 1.21.0 in lockstep (5 spec files + install.sh + both plugin.json).

## [1.20.0] — 2026-08-24

The route-never-delete release — a field report ("the PRD has a character
limit and the agent cuts information") turned out to be two defects wearing
one symptom, and neither was the limit it looked like.

Fixed: the prd's word ceiling asked the data to behave. The contract carried
"Main document ≤ 2,000 words" with no rule for what happens ABOVE the
target — so a compliant agent DELETED information to fit, the exact sin the
method exists to refuse. The field agent that hit it found the right answer
on its own ("two redaction passes without cutting content; the structural
fix is the FRD absorbing what is still enumeration here") and that answer is
now the contract: ~2,000 words stays as a READABILITY target, and above it
information is ROUTED — enumeration to the frd with the pointer left
behind, technical detail to the owning design — or the overflow is DECLARED
with its reason. Deleting content to fit the number is now, in the
contract's own words, a violation, not compliance. Postcondition, style and
inquiry closing all rewritten; the field report rides in the style as the
case.

Fixed: the real hole behind the perceived limit. The prd declared NO
`sections:` in the registry, so verify's truncation floor (section count vs
declared minimum) never ARMED for the method's most-written artifact — a
PRD cut mid-write by the harness's per-turn output ceiling passed VERIFY OK
in silence. The 1.5.0 FRD lesson, alive next door. The prd now declares its
nine sections (arming the floor: previously-silent truncated PRDs will now
FAIL, which is the point) and gains its protected spine
(Objectives & KPIs, Success Criteria, Scope) for the correction envelope.

Added: the write-in-passes verb, where the producers read. `write_order`
and the subagent envelope now teach it: a document longer than one response
is written skeleton-first, then section by section in separate edits, with
`status` stamped LAST — there is NO character limit in the method; the
ceiling is the harness's, and a file cut by it must fail verify as an
interrupted run, never pass looking whole.

Added: exploration before commitment, learned from a spec-driven workflow
tool we studied (named, with the full reading, in the dev ledger — shipped
documents do not carry third-party tool names; see the policy below) and
given the half its design does not keep. `/docod:lead` now explicitly owns the
fuzzy-idea room: read the codebase, compare options, sharpen the idea,
create NO artifact while doing it (governance starts at the door, not
before) — and when the idea crystallizes, hand the baton by NAMING the door
and the command instead of letting the conversation die. Substantive
insight still lands in the counsel log: exploration that shaped a decision
leaves a record.

Recorded in migration.yaml, from the same reading: `change-delta`
(major — requirement deltas in a mechanical ADDED/MODIFIED/REMOVED grammar
as the graduated gate's middle rung, checkable against the 1.19.0
envelope's ID inventory; open decisions named) and `scenario-floor` (minor
— every requirement ties to at least one scenario, riding the
traceability-invariant thread, vocabulary first). What was NOT taken, on
record in the entry: that tool's freshness story depends on human archive
discipline — no content-hash approval, no staleness graph; nothing to
absorb there.

Policy (author's rule, 2026-08-24): third-party tool names are FORBIDDEN BY
DEFAULT in shipped documents (README, CHANGELOG, ARCHITECTURE, CONTRIBUTING,
CONDUCTOR, agents/, rules/) and allowed only under a REGISTERED
justification — the dev-only `third-party-references.yaml` holds each
allowed (name, file) pair with its reason, and `validate-layers.py` now
fails any unregistered occurrence and warns on stale register entries. The
dev ledger (migration.yaml) keeps full provenance by design: it never
ships. The first census under the new check also caught a pre-existing
layer-2 leak — a harness path cited twice in an agent body's anti-pattern
example — now neutralized; the vendor-neutrality guard had covered spec
values and stack terms, never vendor names in agent bodies.

specVersion → 1.20.0 in lockstep (5 spec files + install.sh + both plugin.json).

## [1.19.0] — 2026-08-23

The graduated-gate release — the oldest field pain in the ledger, resolved.
Since the 1.5.0 review this entry was the named relief valve: every honesty
release added catches arriving at the exact bottleneck nobody widened, and
the 2026-08-06 transcript priced it ("um vai e vem que confunde e faz o
usuario querer desistir" — a one-cell fix re-paying the full ceremony plus a
waiver). Two halves, both author-decided.

Added: the approval ENVELOPE. The approval never kept the text it blessed,
only its hash — so "compare against the approved version" was impossible
without a VCS the runtime refuses to depend on. Now every approval records a
structural fingerprint of what it blessed: section count, heading-structure
hash, the EXPLICIT ID inventory (explicit so a refusal can say "RF-002
vanished" instead of "hash differs"), the inputs[] set, and a hash per
PROTECTED section — the document's spine, declared per artifact in the
registry by ordinal (frd, slos, system-design to start; ordinals are
language-neutral, like the count check).

Added: `approve --correction --reason`. A factual, no-semantic-change edit
is re-approved by CONFIRMATION instead of re-review — and the MACHINE
delimits the class, never the author ("just a correction" is the fork that
burned 1.3.0). Outside the envelope the refusal NAMES the broken leg;
inside it the confirmation is still a recorded human act (mandatory reason,
previous approver kept, `correction: true` in the record, verify shows the
provenance), and every downstream LIVE pin on the previous hash re-pins
automatically with `repinned_by` stamped — the radius executed instead of
waived. The honest boundary, on record: `p95 100→300ms` and "3 steps→4" are
structurally identical one-character edits; the envelope separates them by
WHERE they live (a protected spine takes the full ceremony; prose takes the
confirmation), and the semantic judgment inside the envelope stays human.
Diff size is deliberately not a leg. Approvals predating the envelope
refuse with the recipe. Cosmetic bulk keeps its own door (rebless).

Changed: the approved_with_comments limbo, closed by the author. A standing
with-comments verdict now SATISFIES a gate that asks for approved — and the
comments become DERIVED declared debt: status surfaces every standing
with-comments verdict on every run (nobody maintains a list; the standing
verdict IS the list; hiding one would break "never lie"). The 1.12.0
message honesty is retired along with the ceremony it was softening.

The planted battery caught a real bug in the fix itself, again: the
downstream re-pin scan hit a directory the home-grown glob matched and
crashed mid-sweep — projectState always guarded with isFile and the new
scan did not; guard applied. Third time the discipline pays for itself in
one month.

specVersion → 1.19.0 in lockstep (5 spec files + install.sh + both plugin.json).

## [1.18.0] — 2026-08-23

The regulated-profile release — the last two entries of the playbook
absorption, drained. The author widened the first beyond its sketch: not one
adapter, all three.

Added: a `coercion:` section in EVERY adapter (agents-1, claude-code,
codex). Cooperation stays the method — layers 1-2 do not move, the human
orchestrates, a gate that coerces is an orchestrator in disguise — and
coercion becomes a declared DEPLOYMENT option: six shared enforcement points
(approval_gate, hook_integrity, supply_chain, sandbox_egress, merge_gate,
config_regression) that the method owns as POINTS while each deployment owns
the mechanisms. claude-code binds several points to the managed-settings
profile, with the note that those names are the harness's vocabulary and
follow its releases (pointers, verified before rollout, never presumed).
codex binds only what it can vouch for and marks the rest `runtime_defined`
— its own honesty vocabulary; pointing at a config key the adapter cannot
verify would be failure #1 inside the adapter. agents-1 says out loud that a
file spec coerces nothing. Every point degrades DECLARED to the same
vendor-neutral floor: branch protection, required review, and the runtime's
honest exit codes (`verify`, `observe`, the validator) as required CI
checks. The floor lives outside every harness, which is exactly why it holds
for all of them — and why it is the strongest leg, not the consolation
prize.

Added: the rosetta. The README gained "If you arrived from the AI-native
SDLC playbook": intent ≈ business-case + prd, spec ≈ frd + system-design and
the design family, plan ≈ tasks, review findings ≈ the three reviewers,
breach detection ≈ bands + observe + observation, config evals ≈ evals. Keys
never rename and the registry holds no aliases — the mapping is
documentation, and the positioning rides with it: the playbook is the
public spec of the problem; this bundle is an executable, vendor-neutral
implementation that predates it, starting where the playbook stops
(content-hash approval, the lineage graph, diagnostic mode).

Docs: the README also gained "Close the loop in production" (bands/observe/
observation and the evals suite, with the runtime commands) and the
regulated-profile section under Adapter support; ARCHITECTURE records the
coercion contract in the materialization section and refreshes the
known-limits list — the 2026-08 playbook absorption is fully drained into
resolved, and the pending majors now lead with graduated-gate. Every README
reference resolves (validate-readme: 60 checked, 0 failures).

specVersion → 1.18.0 in lockstep (5 spec files + install.sh + both plugin.json).

## [1.17.0] — 2026-08-23

The config-evals release — the refused-rule doctrine gets its mechanism. The
1.12.0 field case (a TDD rule written, the model still declining tests, only
the measured coverage catching it) shipped as doctrine: a rule the producer
holds is an intention; only a check the producer does not control is a fact.
The doctrine had no machine. The vendor playbook operationalized the same
idea in public (evals in CI on any change to agent configuration, gated on
pass rate, every incident a permanent regression eval); this release adopts
it in the method's idiom.

Added: the `evals` artifact (42nd; owner: qa-executor) — the
agent-configuration regression suite. Case convention, watched by verify:
each case is a `### EV-nn — title` block with three LABELED lines — `Task:`
(a REAL task from the repo's history, an incident or a rule's motivating
case; a synthetic prompt tests the prompt, not the configuration),
`Acceptance:` (checkable without asking the author), `Origin:` (what earned
the case). The labels are method vocabulary, never translated; the content
speaks the instance's language. EV ids never vanish: a retired case keeps
its heading marked `retired:` with the reason, so a hole in the sequence IS
a silent deletion — the queue's computability lesson (1.13.0), applied to a
markdown suite. Ownership is deliberate: qa-executor owns it BECAUSE
rules-factory must not — the producer of the rules cannot own the check
that judges its own changes.

Added: the verbs. `define_evals` (derive cases from postmortems, bugs and
the rules' motivating incidents; every incident has a case or a declared
gap in ## Coverage & Gaps) and `run_evals` (the run MEASURED, never
narrated: per case pass/fail with command and output; the pass rate names
its denominator; a failing case is a finding routed by finding_urgency, the
gate stays human). rules-factory's `regenerate_rules` gains the evidence
postcondition that closes the loop: when a suite exists for the scope, an
amendment ships with the suite's RUN attached — cited from the
qa-executor's record, measured by a verifier the producer does not
control; no suite yet is a DECLARED gap, never a silent pass. A rule born
from an incident proposes its eval case in the same delivery.

Added: the evals checks in `verify` — duplicate EV ids fail, a sequence
hole fails naming the missing ids, a case without its labeled lines warns
(labels only: matching translated content would false-fail, the
section-name lesson), retired cases counted out loud.

And the bundle takes its own medicine: CONTRIBUTING now names the smoke
battery as this repo's config-eval — validate-layers at 0 warnings plus the
governance/queue/observe smoke after any spec, agent or runtime change,
with every fix landing its bug planted first. The sentence "configuration
steers the machine, so it gets the regression testing code gets" applies to
this repo before it applies to anyone's.

specVersion → 1.17.0 in lockstep (5 spec files + install.sh + both plugin.json).

## [1.16.0] — 2026-08-23

The observe release — OBSERVE closes in execution, not on paper. Until now
the method's weakest edge: the observe stage delivered artifacts (slos,
runbooks) and nothing DERIVED a violation from a live signal — the loop's
last edge was prose, and the vendor's SDLC playbook had just closed exactly
this in public (bands.yaml, rolling baselines, breach→intent). Adopted in
this method's idiom, never as a copy: no daemon, no state file, no invented
vocabulary.

Added: the `bands` artifact (40th; owner: observability) — the machine-read
sibling of the slos. Declarative: per metric a unique key, an optional
rolling-baseline window, an optional max_age_days, and bands in a strict
grammar — `(over|under) <number>[sigma]` — each carrying one CANONICAL
severity (critical|high|medium|low, the 1.13.0 vocabulary; the playbook's
1σ/2σ/3σ action tiers map onto severities the method already owns). Metric
SNAPSHOTS are dated YAML files in `{docsRoot}ops/metrics/` that the INSTANCE
produces (CI, a script — the adapter binds who): the runtime never collects.

Added: `docod.mjs observe [--record]`. Everything derives FRESH on every
run: the rolling baseline (mean and σ) is computed from the snapshots inside
the declared window — the latest point excluded, so the value under judgment
does not soften its own baseline; fewer than 5 points reports "insufficient
history", declared and skipped, never guessed. Every evaluation prints its
numbers — a pass that shows its work, a violation that names value,
threshold, window and n. Three findings that refuse silence: a latest
snapshot older than max_age_days is OBSERVING BLIND (old data is never used
silently); a metric declared but absent from the snapshot is
declared-not-measured; an unparseable band is a CONFIG ERROR, never a skip.
Exit code is honest: violations or config errors → non-zero, CI-usable.

Added: the `observation` artifact (41st; owner: observability; snapshot
lineage) — where a violation LANDS. `observe --record` materializes the
draft with the machine half filled: Anomaly and Evidence carry the computed
lines verbatim, with the bands file pinned as input and the snapshot cited
as external provenance; Impact, Recommendation and Open Questions are
written as DECLARED GAPS. The new `assess_observation` action is the owner
completing its own document — the machine-written evidence preserved
verbatim (a computed number is never laundered through an agent's
rewording), the Recommendation naming the re-entry door. Re-entry is a
HUMAN act through an existing door (prd, ws add, impact-analysis): the
command records, it never decides. One observation per day per slug — a
second --record refuses and points at the existing file. Headings localize
(en/pt-BR, English fallback declared out loud); the content contract does
not.

Added: the bands checks in `verify` — the observe contract must parse
BEFORE the day it is needed, because a band that fails at observe time is a
detection hole discovered during the incident. Fail-tier: no metrics list,
missing/duplicate keys, unparseable band grammar, non-canonical severity,
sigma band without a window, a metric with no bands ("telemetry lives in
the slos"). And `define_bands` gives the producer the verb (the 1.10.2
lesson: a mechanism nobody triggers does not reach the field).

specVersion → 1.16.0 in lockstep (5 spec files + install.sh + both plugin.json).

## [1.15.0] — 2026-08-20

Fixed: the frontmatter delimiter is now ANCHORED. Every split in the runtime
(`sha256Body`, `readFrontmatter`, `writeFrontmatter`, both `verify` sites)
found the closing `---` with an unanchored substring search — so an ASCII
comment rule (`# ----------`) INSIDE the frontmatter closed it right there.
Everything below the rule silently became body prose, and verify stayed
green, because every key it checks sat above the rule. Field case: a
diagnostic whose commented `report:` block vanished from the render — two
agents hit it in one run, and the reporter behaved exactly as the method
asks: read the runtime source, labeled the reading as its own, fixed its own
file, queued the defect for the author, touched nothing. The delimiter is now
a LINE that is exactly `---` (`fmClose()`, shared by all five sites), and the
dev validator's python split — which carried the same disease in `str.split`
clothing — is anchored to the same rule, because two parsers that disagree
about where a contract ends is how a green check ships a truncated one.

Compatibility, said out loud: for every healthy file the split is
byte-identical and the body hash does not move (verified over the 28 agent
contracts plus the smoke corpus: zero changes). For a file of the AFFECTED
class — frontmatter carrying a `---` substring in a comment — the body was
being mis-read, so its hash changes and any approval recorded over the
mis-read body now shows INVALID. That flip is honest: the approval vouched
for a body the runtime never actually delimited correctly. `rebless` is the
door, and the re-read is the point.

specVersion → 1.15.0 in lockstep (5 spec files + install.sh + both plugin.json).

## [1.14.0] — 2026-08-14

Added: the first fully materialized Codex adapter. `adapters/codex.yaml` maps
the neutral contracts to repository-scoped custom agents in `.codex/agents/`,
portable skills in `.agents/skills/`, and Codex command contracts under
`adapter-assets/codex/`. The generated agents remain thin envelopes over the
canonical roles, preserve the interactive hand-back, keep verification in the
parent session, and restrict the tech-lead subagent to diagnostic
consolidation.

Preserved: `/docod:*` is the public command API, not a Claude-specific detail.
The repository-root `.codex-plugin/` package exposes one explicit skill per
command from `skills/` under the `docod` plugin namespace;
repository-only installations get the same literal syntax through a router
skill plus the root `AGENTS.md` contract. The adapter does not rename commands
to Codex custom-prompt syntax, so existing documentation and operator muscle
memory remain valid.

Changed: `install.sh` accepts `--adapter claude-code|codex|agents-1`. New
instances record that choice; existing `docod.yaml` remains authoritative and
a conflicting explicit choice is refused. Claude materialization is unchanged,
while the neutral profile now installs only portable skills and discovery
instructions. An explicit instance adapter change retires only generated
surfaces from the previous harness. All generated surfaces remain idempotent
and refuse to overwrite or remove user-owned namesakes.

Added: adapter materialization validation and an end-to-end shell suite across
all three profiles, including collision preservation, idempotent reinstall,
Codex TOML parsing, plugin command coverage and mismatch refusal.

Fixed before release: Codex agent descriptions are shortened only at complete
word/codepoint boundaries. The previous Bash substring could split a UTF-8
character under `LC_ALL=C`, producing an invalid infrastructure-design TOML
while the installer exited zero. Generation is now locale-independent and
atomic: a strict built-in UTF-8 check runs on the temporary TOML before it is
published, and the regression suite deliberately installs under the `C`
locale.

specVersion → 1.14.0 in lockstep (5 spec files + install.sh + both plugin
manifests).

## [1.13.0] — 2026-08-14

The queue release — the first diagnostic run against a real legacy turned the
method on itself and won. Four findings AGAINST the method surfaced mid-run,
were queued as proposals owned by the author (nothing self-promoted — the
conductor contract, days on disk, holding), survived three rounds of
adversarial cross-review, and the author promoted them. All four are the
house's own recurring diseases: a record nobody watches drifting silently, a
reference with nobody on the other side, a silent fallback — in the honesty
product.

Added: `question add|answer` — the external-questions queue gets its single
writer. Field proof, from the run's own file: three parallel reverses each
rewrote the whole queue; the YAML stopped parsing and EIGHT prior entries
vanished (EXT-001..006, EXT-007..008 — per the forensic note the agents left
as YAML comments while restoring; two were unrestorable by an agent that had
never read them). `add` allocates the next EQ-nn and appends under an O_EXCL
lockfile (two well-behaved concurrent adds raced the allocation; a stale lock
refuses with the recipe, never auto-removed), in strict candidate→parse→
assert→write order — a queue that does not parse REFUSES the write, because
appending over corruption buries the evidence of what corrupted it. `answer`
flips the entry surgically, preserving every other byte: the field file
carries its loss report as comments, and a redump would erase the forensics.
The subagent preamble and the diagnose flow teach the verb. On record: the
planted corrupted-queue test caught a bug in the fix itself — `die` inside
the critical section skips `finally` and leaked the lock; released via the
process exit event now.

Added: the queue checks in `verify` — detection carries the guarantee, since
a command is an instruction, not a lock. The entry_schema had declared
`id: EQ-nn, sequential` since the artifact was born: an append-only entry
never leaves the file, so a hole in the sequence IS a lost entry — and nobody
had written the check (verify ran exactly two checks on a .yaml artifact,
both green over the wreck). Now: duplicate ids fail; a sequence gap fails
NAMING the missing id, checked PER PREFIX FAMILY — the field file carries two
grammars (EQ-nn canonical, EXT-nnn grandfathered; renumbering breaks the
documents that cite them) and an EQ-only check would have passed green over
the exact eight entries the field lost; state outside open|answered fails;
legacy field names (raised_by/blocks) read via alias and warned, never
failed — those are precisely the restored entries, and a false positive there
trains the reader to skip the section. And `status` stops swallowing: an
unparseable queue prints a LOSS warning, never an empty list — in the field,
the corrupted queue rendered as "zero open questions" with eight gone.

Fixed: the tech-lead materialization gap. install.sh generated 27 of 28
subagents — tech-lead rightly excluded for sparring (/docod:lead) — while
/docod:diagnose's CONSOLIDATE step delegated to `docod-tech-lead`: a dispatch
to a wrapper that would never exist, the recurring failure live in the
shipped flow. The exclusion stays right and stops being a blanket:
docod-tech-lead now generates as a RESTRICTED envelope, consolidate_diagnostic
only, everything else stopping and pointing at /docod:lead. validate-layers
gained `check_generated_refs`: every `docod-<key>` in the command texts must
resolve to a generated agent, the exclusion set PARSED from install.sh's own
skip pattern so the next exclusion is watched by construction. On record: the
first draft of this check scanned plugin-commands/*.md — which contains no
docod-<key> at all — and would have passed green by looking at the wrong
layer; the cross-review caught it before it shipped.

Fixed: severity is CANONICAL method vocabulary now. It sat in the report
contract with no enum and outside the never-translate list, so a pt-BR
producer wrote `crítica` — and the template's prefix match (indexOf("crit"))
missed on the accent: all 13 gravest findings rendered in the neutral colour,
silently, in the dossier whose product is honesty. Vocabulary first:
critical|high|medium|low declared canonical in artifacts.yaml § diagnostic
(keys never translate; display labels localize), the producer got the verb
(tech-lead deterministic postcondition), and the template matches EXACTLY —
an unrecognized key renders with a dashed border, a chip note and a loud
banner at the top of the dossier, never silently neutral. Old diagnostics are
snapshots: never rewritten, rendered with the marker.

specVersion → 1.13.0 in lockstep (5 spec files + install.sh + plugin.json).

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
