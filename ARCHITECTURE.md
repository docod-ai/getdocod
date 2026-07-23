# DOCOD internals: how everything works, down to the bit

This is the maintainer's document. The README sells and orients; this explains the machinery. Read it before arguing about the design in an issue, because most "why not X?" questions have an answer that lives here.

## 0. The one sentence

DOCOD is a set of contracts (markdown + YAML) interpreted by three small programs: an installer (bash), a runtime (node), and a dev validator (python). All state is derived from files on every run. Nothing maintains an index by hand, and nothing trusts an agent's claim when a machine can check it.

## 1. The four layers, and what enforces them

| Layer | Lives in | Contains | Changes when |
|---|---|---|---|
| 1. Method | `spec/method.yaml` | stages (define/orchestrate/confirm/observe/redefine), 12 capabilities, skill registry, status machine, who_approves, approval schema | the method itself evolves |
| 2. Contract | `spec/agent.yaml`, `spec/artifacts.yaml`, `spec/commands.yaml`, `spec/rules.yaml`, `agents/*.md`, `rules/*.md`, `spec/skills/*` | what every agent and artifact IS | agents/artifacts evolve |
| 3. Adapter | `adapters/*.yaml` | tool names, materialization, enforcement wiring per harness | a harness changes |
| 4. Instance | `docod.yaml` (user's project root) | language, docsRoot, topology, targets | per project |

Neutrality is not aspirational, it is checked: `validate-layers.py` (dev-only, never installed) greps layers 1 and 2 for vendor names, tool names and stack terms against curated lists, with documented exclusions for false-positive words. Every check in it was tested by planting the error first. The recurring failure this project made nine-plus times, and the validator exists to kill, is: a reference declared in prose with nobody on the other side and no validator watching. Whenever you add a cross-reference between files, ask who validates it.

Key vocabulary invariants (never translate, never rename casually): agent keys, artifact keys (including the Portuguese-born `evidencias`), action names, capability names, status values `draft|review|approved`, verdict values, postcondition prefixes `deterministic:|evidence:|judgment:`, placeholders `{docsRoot} {ws} {seq} {slug} {date} {version} {target.tasksRoot} {target.path} {target}`, the marker `QUESTIONS FOR THE USER:`, and the marker `generated-by: docod`.

## 2. Anatomy of an agent (`agents/<key>.md`)

One file, two halves.

**Frontmatter = the contract** (parsed by runtime and validator):

```yaml
key: frd                     # identity; must be unique
interactive: true            # needs answers from a human
capabilities: [...]          # abstract needs; adapter maps to tools
skills: [...]                # must exist in method.yaml registry, both directions checked
contract:
  owns: { artifact: frd }    # one artifact, one owner (validator checks both directions)
  triggers: [...]            # advisory: who this agent typically activates
  actions:
    create_frd:
      stage: define
      scope: [project, ws]
      requires:              # PRECONDITIONS, evaluated mechanically by status
        - artifact: prd
          status: [approved]
          waivable: false    # waivable: true blocks softly; waiver recorded in frontmatter
      reads: [...]           # every key must exist in artifacts.yaml (validated)
      writes: { artifact: frd, status: draft }   # agents may only write draft/review
      postconditions:
        - "deterministic: ..."   # machine-checkable; verify covers the computable subset
        - "evidence: ..."        # agent must show command + output
        - "judgment: ..."        # not enforceable; gated by reviewers
```

**Body = the role**, in prose, with exactly three enumerated role sections, each opening a block after a `---` line: `## structure` (the document template it delivers), `## inquiry` (what it asks, with the conventions "NEVER skip.", "Ask closed:", "Skip if:", "Cost of the error:", "### On closing"), `## style`. The validator parses roles as "the `## x` heading that opens a block after `---`"; a fourth section name is an error. `interactive: true` without `## inquiry` is an error (promises to ask, doesn't say what).

Every reverse_* action (and `extract_from_code`) additionally honors the `reverse_conventions` block in `spec/agent.yaml`: mandatory triangulation of legacy docs (cited as external provenance, never imported), numbered DIV-nn divergences with evidence on both sides, and three question classes never mixed (gap, product decision, external-owner). Current census: 28 agents. 27 producers plus `tech-lead` (counsel; owns the append-only `counsel` log; the one agent materialized in the main session because sparring is conversation). Identity tests that killed or converted agents in v1: delivers a document (agent) vs. delivers a craft (skill: 12 of them) vs. is a discipline someone obeys (rule: 4 templates specialized by `rules-factory`).

## 3. The artifact registry (`spec/artifacts.yaml`)

Every artifact has: `stage` (metadata, never a folder), `owner` (validator checks the owner agrees), `scope` subset of `[project, ws, target]`, and a `path` template per scope. 37 artifacts.

Path resolution is the load-bearing trick. Templates use placeholders; the runtime resolves `{docsRoot}` from the instance (default `docs/`), `{ws}` from context, and produces **one pattern per target**, substituting `{target.tasksRoot}`, `{target.path}` and `{target}` (the target's key) per entry in the instance's `targets:`. All remaining placeholders (`{seq}`, `{slug}`, `{date}`, `{version}`, and `{ws}` when unbound) become `*` and the result is globbed. Unbound `{ws}` deliberately globs instead of vanishing: an unregistered front's artifact must show up as a finding. The glob engine is home-grown (about 30 lines) because `fs.globSync` only exists from node 22 and node 18 is the floor.

Filesystem layout is by NATURE, never by stage (a revisited document must not change homes): `product/ design/ decisions/ quality/ ops/ releases/ standards/ workstreams/` under `{docsRoot}`; target-scoped artifacts (tasks, evidence, qa, codereview) live next to the code under `{target.tasksRoot}`.

**Ownership exceptions** (exactly two, both narrow and declared as `co_writer`): the `task` file (executor may tick `- [x]` checkboxes and add inline evidence, may NOT touch scope/criteria/tests, because an executor that edits its own bar self-approves through the back door) and `workstreams.yaml` (the user closes fronts via the `ws` command; only `prd` creates them).

**Lineage classes** (born from the first real test):

- default (live): `inputs[].hash` mismatch means stale, verify fails it.
- `lineage: snapshot` on the nine record artifacts (design-review, impact-analysis, codereview, qa, evidencias, postmortem, adr, release-notes, counsel): inputs are observed-at, reported but never failed, because refreshing them would lie about what was analyzed.
- inputs pointing at an `append_only` artifact (the `decisions` sidecar): observed state of a file that grows by design, not live-checked.
- input entries may carry `external: true` (imported .docx provenance): recorded, not resolvable. An unregistered input WITHOUT `external` is still a failure; that is how typos get caught.

## 4. Hashes, approval, and the status machine

`sha256Body(file)` hashes the content EXCLUDING the frontmatter, truncated to `sha256:` + 16 hex chars. Excluding frontmatter is essential: writing the approval into the file must not invalidate the approval it records.

Human gate: `docod.mjs approve <file> --by <who>` writes `approval: {by, at, content_hash}` and sets `status: approved`. **Effective status** is computed on every read: `approved` with no approval record shows as `approved?`; `approved` whose `content_hash` no longer matches shows as `review` with the warning "INVALID approval, content changed after the approve by X on Y". Nobody remembers anything; the hash remembers. Downstream `requires` re-block automatically because they consult effective status, not written status.

Re-approving changed content prints the previous approver/date and a ready `git log -p --since=... -- <file>` line: the unread made visible, never forced (a mandatory checkbox is theater).

Agent gates (design-review, qa, code-review): the verdict lives in the REVIEWER's artifact frontmatter (`verdict: approved|approved_with_comments|changes_requested|rejected|blocked`); the owner moves their own status, legally only when a fresh `approved` verdict is newer than their last edit (comparable via hashes). Three reviewers, three objects: document before code, diff, behavior. None reviews its own work; none moves anyone's status.

## 5. The runtime (`docod.mjs`)

Plain node >= 18, ESM, zero installation: js-yaml is vendored in `vendor/js-yaml.mjs` (MIT, license alongside), pinned to the YAML 1.2 CORE schema. The pin matters: the default 1.1 schema converts `2026-07-17` into a Date object and reserialization would mutate the user's file. The runtime neither lies nor "improves" what it read.

Commands (each derives everything fresh from disk):

- `status [--ws]`: workstreams from `{docsRoot}workstreams.yaml`, artifact instances via glob, effective status per file, orphan ws folders reported as findings, then `possible now` vs `blocked (and why)` computed by evaluating every action's `requires` against the effective statuses present. Contract: NEVER lie; a status that reassures is worse than none.
- `start`: entry doors given what exists; refuses to be a start if artifacts exist (that is `continue`).
- `continue <ws>`: focused status.
- `approve`, `ws list|done|abandon --reason` (abandon without reason is refused: a front that vanishes silently is lost work with no record).
- `verify <file>`: EXTERNAL verification of the computable class, run by the caller, never the producer. Checks: frontmatter parses (real parser, not grep), status in enum, approval hash vs current content, every `inputs[].hash` against live source artifacts (honoring the lineage classes above), artifact registered. Warn tier (`⚠`, does not fail): a hash field holding a non-hash value (placeholder written instead of computed data). Section names are deliberately NOT checked: documents are written in the instance's language and matching English names would false-fail, and a false positive trains the user to ignore the alert. Every pass is explained ("observed-at, not live-checked"), because a silent pass teaches nothing.
- `rebless --by <who> --reason "..." [--repin-inputs] [--yes]`: the cascade-cost answer. Batch re-approval of invalid approvals plus opt-in re-pinning of stale live-lineage inputs. Guards: reason mandatory and stored inside every touched approval (`rebless_reason`); without `--yes` it prints the plan with a per-file diff command; re-pin resolves the source by the input's `key` (both sides normalized: extension off, path relative; path-first, basename after) and acts only on a UNIQUE resolution — snapshot, append-only and external inputs are never touched. Verify also warns on undeclared links: a body citing ADR-nnnn absent from `inputs[]`.
- `report`: collects the same derived state plus document bodies and task checkbox progress (`- [x]` vs `- [ ]` gives the kanban lane: todo/doing/done), injects JSON into `report-template.html` (with `<` escaped so no document can close the script block), writes static, offline, self-contained `report.html`. UI labels localize via an `I18N` dict keyed by the instance `language:` with English fallback. Cards show a red `changed since approval` chip when body hash diverges from the recorded approval.

## 6. The installer (`install.sh`)

Pure bash, zero dependencies, idempotent, merge-safe. The merge rule in one line: everything of ours lives namespaced (`docod`), and what is not ours we never touch.

What it does: (1) rsync/tar the bundle into `.docod/` (excluding dev-only files: `validate-layers.py`, `migration.yaml`, `install.sh`, `report.html`, and the user's `docod.yaml`); (2) create the instance `docod.yaml` once, never overwrite, but WARN when the preserved file lacks newer top-level fields, pointing at the reference copy that now ships at `.docod/docod.yaml`; (3) copy skills to `.agents/docod/skills/` and symlink them as `.claude/skills/docod-*`, skipping (with a warning) any name that exists and is not ours; (4) generate one native subagent per agent into `.claude/agents/docod-<key>.md`, extracting description/interactive/actions from frontmatter with awk/sed, marked `generated-by: docod` (a namesake without the marker is skipped, never clobbered), EXCEPT `tech-lead`, which becomes the main-session command `/docod:lead`; (5) generate the 8 orchestration commands in `.claude/commands/docod/`; (6) run detection-based migrations (step 2b): no state file, detection is the state; move only when the destination does not exist; judgment-required shapes print the exact manual recipe (the rich ADR ledger); any bundle change that moves user state must ship its migration in the same commit; (7) write the DOCOD block into `CLAUDE.md` and symlink `AGENTS.md`, so every harness discovers the method at the repo root; (8) check for node and warn without failing.

The generated subagent is a thin envelope: its first instruction is to read `.docod/agents/<key>.md` in full (subagents do not expand `@` references, so the read is an instruction; a copy would be scheduled drift). The envelope carries eight non-negotiable harness rules, notably: run `status` first and stop on blocked requires; never write `approved`; computed hashes only, never placeholders; product answers go to the `decisions` log while technical decisions get flagged for the `adr` agent; write everything in the instance's `language:` (the method speaks English, the product speaks the instance); run `verify` for the computable class; and the interactive hand-back: a subagent cannot reach the user, so it stops and returns `QUESTIONS FOR THE USER:` instead of inventing.

`/docod:run <agent> [action] [ws]` is the explicit door: it delegates, relays hand-back questions verbatim, treats a reply with neither a written artifact nor questions as a FAILED run (junk detection, learned from a real junk return), runs `verify` on the delivery, and never approves.

## 7. Materialization on Claude Code (`adapters/claude-code.yaml`)

Mode: subagent, with owned costs stated in the adapter: (1) interactive degrades to the hand-back protocol; (2) hooks do NOT fire inside subagents (anthropics/claude-code#34692, #33049; open issues, current behavior, not a promise), so `deterministic` enforcement is in-band for everyone plus the external `verify`; (3) the model may auto-invoke a subagent; each description says "invoke ONLY when the user explicitly asks", an instruction, not a lock, accepted risk. External tools (Context7, Playwright) are declared `external: true` with `degraded_to` and install hints; a missing tool degrades honestly ("NOT VERIFIED"), it never pretends. Swapping the adapter file swaps the harness; layers 1-2 do not move.

## 8. Known limits, on record (`migration.yaml`, dev-only)

Pending: `multi-approver` (the human gate is singular; the team phase needs `approvals: []` with joint hash invalidation; disagreement routes to rfc/tradeoffs then an ADR with a named owner, because approval is a record, not a forum), `action-contract` (workflows/teams reference a pre-contract world; rewrite deferred to the teams phase) and `scale-down-profile` (a lighter instance profile for simple projects; needs more N before designing). Resolved along the way, each against a real incident: external verification (`verify`), lineage classes, junk-subagent detection, seq-race claim rule, declared-inputs coverage, bundle migrations, legacy-absorption conventions, and `rebless` with its twice-tightened key resolver. Resolved entries stay on record with their reasoning: a deleted blocker is a blocker that comes back.

## 9. The design principles that explain everything else

1. Derived, never maintained: all state is recomputed from files; an index would drift by tomorrow.
2. Never lie, never reassure: invalid approvals show red; gaps show as gaps; passes are explained.
3. One artifact, one owner; exceptions are named, narrow, and written down.
4. The human orchestrates: commands inform and record; a command that decides is an orchestrator in disguise. Counsel (tech-lead) recommends and logs; it never invokes, approves, or edits.
5. What a machine can check, a machine checks, and never the machine that did the work.
6. References need validators: every cross-file reference either has a check or it is a bug waiting for its third occurrence.
7. The method speaks English; the product speaks the instance's language.
8. False positives are worse than gaps: they train the user to ignore the alert.
9. Guards tighten without loosening: a resolver may learn to recognize an identified source; it never learns to guess an ambiguous one.
10. The machine automates the work and leaves the judgment where it belongs: rebless executes in bulk, but whether a change was cosmetic is, and remains, the human's call.
