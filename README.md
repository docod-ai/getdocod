<div align="center">

<img src="assets/logo.png" alt="DOCOD" width="100">

<br>

**Define · Orchestrate · Confirm · Observe · [re]Define**

### Agents write code fast.  
### DOCOD keeps the project from losing agreement with itself.

DOCOD is executable governance for AI-native software engineering.

It combines a method, a small runtime, agent contracts and human gates to keep intent, requirements, design, decisions, tasks, code, evidence and approvals aligned as the project changes.

**The human orchestrates and approves. Agents produce and verify. Nothing approves itself.**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](#license)
[![Runtime: Node ≥18](https://img.shields.io/badge/runtime-node%20%E2%89%A518-brightgreen.svg)](#requirements)
[![Install: Pure Bash](https://img.shields.io/badge/install-pure%20bash-lightgrey.svg)](#install)

📖 [Read the book](https://docod.ai/book) ·  
✉️ [Take the daily challenge](https://docod.ai/challenge) ·  
🌐 [Explore DOCOD](https://docod.ai)

</div>

---

## What DOCOD changes

AI made code generation cheap.

It did not make software engineering cheap.

The difficult work moved elsewhere:

- deciding what should be built;
- preserving context across sessions;
- separating product intent from technical decisions;
- verifying behavior instead of trusting plausible output;
- understanding what became stale after a change;
- preserving responsibility when agents perform the execution.

A coding agent can produce a clean diff, pass the type checker and still deliver the wrong system.

### A spec is not a method

Writing the specification first helps.

But a spec-driven repository can still fail three weeks later:

- the PRD says one thing;
- the implementation does another;
- an architectural decision was never recorded;
- a pull request changed behavior without changing the contract;
- a reviewer approved a document that was edited afterward;
- nobody can say exactly when the project stopped agreeing with itself.

The missing layer was never more prose.

It was the machinery that keeps claims attached to the work.

### None of this is new. That is the point.

PRD, functional requirements, design review, ADRs, test plans, runbooks, postmortems: this is not a methodology someone invented last quarter. It is the **SDLC** — the Software Development Life Cycle, the discipline software engineering has taught for decades, the one that shipped everything you rely on.

Every DOCOD movement maps onto a phase you already learned:

| Classic SDLC phase | DOCOD movement | The artifacts you will recognize |
|---|---|---|
| Planning & feasibility | Define | business case |
| Requirements & analysis | Define | PRD, FRD, user stories |
| Design & architecture | Orchestrate | system / data / security design, API contract, ADR |
| Implementation | Orchestrate | tasks, code, evidence |
| Testing & verification | Confirm | test plan, QA, design review, code review |
| Deployment & operations | Observe | SLOs, runbooks, playbooks, release notes |
| Maintenance & evolution | [re]Define | postmortem, impact analysis, feeding the cycle again |

The table shows where each artifact is most often born. ADR and the other cross-cutting artifacts (RFC, tradeoffs, impact analysis) appear whenever the need does, in any phase; the full method map further down marks them ⚡.

Most teams abandoned this lifecycle for one honest reason: writing and maintaining those documents was slower than writing the code.

AI inverted that equation, twice:

- **The documents became the input.** An agent's output is bounded by the context it receives. The spec stopped being paperwork about the system and became the program that programs the agent. A human developer fills gaps with judgment and hallway context; an agent fills them with plausible guesses. The discipline your team dropped is exactly what agents cannot work without.
- **The cost that killed it is gone.** DOCOD's agents write and maintain these documents with you: interview, draft, cross-check, propagate changes. The historical reason to skip the lifecycle is no longer decisive.

So DOCOD is not asking you to adopt something new. It is the SDLC you already know, revived, wired for agents, and enforced with gates instead of good intentions. If you want AI to build software, this layer is no longer optional. It is the difference between engineering and generation.

> 📐 Why the spec is back at the center, and how documentation becomes an execution system for agents: chapters 13 and 14 of the book (*Spec-Driven Development* and *Documentation as an Execution System*).

### The layer above generation

Every step of that lifecycle now has an owner.

Every important input is declared.

Every gate is explicit.

Every approval is attached to a specific version of the content.

Every computable claim can be checked outside the agent that made it.

DOCOD does not make language models deterministic.

**It makes the engineering process verifiable when they are not.**

---

## See it work

Install DOCOD into a repository:

```bash
git clone https://github.com/docod-ai/getdocod
./getdocod/install.sh /path/to/your/project
cd /path/to/your/project
```

Then open the project in your agent harness and run:

```text
/docod:start
```

DOCOD reads the actual repository state and shows the correct entry point.

For a new product:

```text
/docod:run prd create_prd
/docod:approve docs/product/prd.md --by <you>
/docod:run frd create_frd
```

For an existing codebase:

```text
/docod:diagnose
```

At any moment:

```text
/docod:status
```

You receive a derived answer to four questions:

```text
What exists?
What is valid?
What is stale?
What is blocked, and why?
```

No manually maintained dashboard.

No hidden database.

No agent memory required.

The files are the state.

---

## Choose your starting point

DOCOD does not require every project to begin in the same place.

There are three doors.

**New project** — an idea you want defined, designed and built under governance.

```text
/docod:run prd create_prd
```

**Existing project** — code you want to keep changing, governing the next feature without documenting the whole system first.

```text
/docod:run rules-factory extract_from_code
```

See *Working in a legacy codebase*.

**Diagnose only** — no adoption yet; you want to see where the system already stopped agreeing with itself.

```text
/docod:diagnose
```

No approvals, no gates. See *Diagnose before adopting*.

The granular index, when you already know the intent:

| I want to… | Start here |
|---|---|
| Turn an idea into a defined product | `/docod:run prd create_prd` |
| Justify an investment before defining the product | `/docod:run business-case create_business_case` |
| Continue work already started | `/docod:start` |
| Resume a specific workstream | `/docod:continue <ws>` |
| Understand an existing codebase before adopting the method | `/docod:diagnose` |
| Reconstruct the design of a legacy system | `/docod:run system-design reverse_design` |
| Extract the rules the codebase already follows | `/docod:run rules-factory extract_from_code` |
| Discuss a technical decision | `/docod:lead <question>` |
| Turn approved design into executable tasks | `/docod:run task-extraction extract_tasks` |
| Dispatch one task through build, QA and review | `/docod:loop <task>` |
| See what is valid or blocked | `/docod:status` |
| See the whole project in one report | `/docod:report` |

The method bends to where the project actually starts.

The discipline stays the same.

---

## The DOCOD cycle

DOCOD organizes AI-native software engineering into five movements.

```text
DEFINE
Decide what should exist.
Capture intent, requirements, contracts and decisions.
Prepare the context and decompose the work.

        ↓

ORCHESTRATE
Dispatch execution through agents, tools and environments.
Build according to approved inputs and declared success criteria.

        ↓

CONFIRM
Run sensors, QA and reviews.
Collect evidence.
Let the human decide what advances.

        ↓

OBSERVE
Watch the software and the process in reality.
Capture incidents, drift, cost, failures and operational evidence.

        ↓

[re]DEFINE
Feed what reality taught back into the next cycle.
Update specifications, harness, rules and process.
```

Governance crosses every movement.

DOCOD is not a rigid sequence of ceremonies.

It is a recurring engineering cycle whose state is visible, versioned and inspectable.

---

## What happens when something changes

Assume a PRD was approved.

```yaml
status: approved
approval:
  by: fabio
  at: 2026-08-06T10:30:00Z
  content_hash: sha256:8bf4a91d61a2a891
```

A week later, someone changes the body of the document.

The written status may still say `approved`.

The effective status does not.

```text
INVALID APPROVAL
Content changed after approval.
Effective status: review
```

Every action requiring the approved PRD becomes blocked again.

Nothing needed to remember the event.

Nothing needed to update a separate index.

The current content and the recorded hash disagree, so the system knows that the approval no longer applies.

This is one of the central guarantees of DOCOD:

> Approval belongs to a version of the content, not permanently to a filename.

---

## Evidence, not assertion

An agent saying that a check passed is not evidence that the check passed.

DOCOD separates postconditions into three classes.

| Class | Meaning |
|---|---|
| `deterministic:` | A machine can recompute the result |
| `evidence:` | A command, output, screenshot, trace or observation must be attached |
| `judgment:` | A reviewer or human must interpret the result |

Example:

```yaml
postconditions:
  - "deterministic: the artifact frontmatter parses"
  - "evidence: the test command and output are present"
  - "judgment: the design boundaries are appropriate"
```

DOCOD checks the computable class externally.

It requires proof for the observable class.

It leaves judgment where judgment belongs.

---

## Three reviewers, three objects

DOCOD does not ask one agent to produce and approve the same work.

Different reviewers examine different objects.

```text
design-review
checks the design before code exists

code-review
checks the diff against the task and project rules

qa-executor
checks the running behavior against requirements
```

These roles are complementary.

A diff can be clean while the behavior is wrong.

The behavior can pass while the architecture is poor.

The architecture can be coherent while the product requirement itself is wrong.

No single reviewer sees every class of failure.

That is why DOCOD separates them.

---

## The shortest useful workflow

A complete project may use many artifacts.

A first experience does not need to.

```text
PRD
  ↓ human approval
FRD
  ↓ human approval
System design
  ↓ agent review
Tasks
  ↓ human approval
Execution
  ↓ external verification
QA
  ↓
Code review
  ↓ human decision
```

The pattern is consistent:

```text
Agent produces
Machine checks what it can
Another role verifies
Human approves what requires authority
```

DOCOD automates the work.

It does not automate responsibility away.

---

## Build verified code

The documents are not the final product.

They are the context the coding agents consume.

```text
/docod:run rules-factory generate_rules
/docod:run task-extraction extract_tasks
/docod:run task-executor execute_task
/docod:run qa-executor run_qa
/docod:run code-review review_code
```

### Project-specific rules

`rules-factory` does not impose a generic style guide.

It derives rules from:

- your approved designs;
- your ADRs;
- your existing code;
- your testing patterns;
- your repository structure;
- your explicit decisions.

Each rule has an origin and a scope.

A backend rule does not need to contaminate the frontend.

A legacy pattern is not silently replaced by someone else's taste.

### Success criteria cannot be rewritten by the executor

The task executor may:

- implement;
- update progress;
- attach evidence;
- mark completion steps.

It may not change:

- task scope;
- success criteria;
- required tests;
- the definition of done.

An executor that edits its own bar approves itself through the back door.

DOCOD prevents that ownership collapse.

---

## Dispatch without babysitting

```text
/docod:loop <task>
```

`/docod:loop` dispatches a single task through the non-human part of delivery:

```text
Build
  ↓
Verify
  ↓
QA
  ↓
Fix
  ↓
QA again
  ↓
Diff review
```

It stops when:

- the task requires a human answer;
- an approved upstream artifact appears to be wrong;
- requirements are blocked;
- a verdict repeatedly fails;
- an approval is required;
- the declared stop condition is reached.

It never approves.

It never deploys by itself.

The human decision is the dispatch.

The stop conditions are contract.

---

## A tech lead to think with

Most DOCOD agents produce an artifact.

The tech lead does something different.

```text
/docod:lead should we split the payments service now or after launch?
```

The tech lead reads the actual project state:

- approved requirements;
- system boundaries;
- ADRs;
- workstreams;
- task state;
- QA findings;
- stale inputs;
- open questions.

Then it presents:

- the realistic alternatives;
- the cost of each;
- the relevant evidence;
- its recommendation;
- what it would do and why.

The choice remains yours.

It does not invoke other agents.

It does not approve artifacts.

It does not silently decide architecture.

When the recommendation changes project direction, the counsel is recorded in:

```text
docs/decisions/counsel.md
```

The recommendation leaves a trail.

Your decision leaves a trail.

Six months later, “why did we do this?” has an answer.

---

## See the whole project

```text
/docod:report
```

<div align="center">

<img src="assets/report.png" alt="DOCOD report: documents, kanban and project flow" width="720">

<br>

<sub>Static, offline, self-contained HTML. No server, CDN or tracking.</sub>

</div>

The report shows:

- artifacts grouped by nature;
- declared and effective status;
- invalid approvals in red;
- stale and observed-at relationships;
- tasks grouped as todo, doing and done;
- possible actions;
- blocked actions and their reasons;
- workstreams;
- document contents;
- project flow.

The report is a visual representation of the same state used by `status`.

It is not a separate source of truth.

---

## Workflows by scenario

Complete paths, not isolated commands.

### New product

```text
/docod:run prd create_prd
/docod:approve docs/product/prd.md --by <you>
/docod:run frd create_frd
/docod:run system-design create_design
/docod:run task-extraction extract_tasks
```

Each task then goes through *Dispatch without babysitting*.

### A feature in a legacy codebase

```text
/docod:run rules-factory extract_from_code
/docod:run system-design reverse_design
/docod:run prd create_prd <workstream>
/docod:run task-extraction extract_tasks
```

Govern the feature you are about to change, not the entire system.

### Diagnostic only

```text
/docod:diagnose
```

One command. No approvals, no adoption — a dated snapshot with `DIV` and `RISK` findings. See *Diagnose before adopting*.

### Delivering a single task

```text
/docod:loop <task>
```

One dispatch through build, verification, QA, fix and diff review. See *Dispatch without babysitting*.

---

## Commands

```text
/docod:start
Find the correct entry point from the current repository state.

/docod:status
Show what exists, what is valid, what is stale and what is blocked.

/docod:run <agent> [action] [ws]
Invoke an agent contract explicitly.

/docod:approve <file> --by <who>
Record a human approval attached to the current content.

/docod:continue <ws>
Resume a workstream with focused status.

/docod:ws list|add|done|abandon
Manage workstream lifecycle.

/docod:report
Generate the static project dashboard.

/docod:lead [topic]
Discuss a technical decision with project-aware counsel.

/docod:loop <task> [--until]
Dispatch one task through build, verification, QA and review.

/docod:diagnose
Analyze an existing codebase without adopting governance.
```

The Node runtime also provides lower-level commands such as:

```text
node .docod/docod.mjs verify <file>
node .docod/docod.mjs rebless ...
```

---

## Diagnose before adopting

Not every team is ready to install a complete governance flow.

That should not prevent the team from seeing the problem.

```text
/docod:diagnose
```

Diagnostic mode reads an existing codebase and available legacy documentation, then produces a dated snapshot containing:

- reconstructed artifacts;
- provenance for each important claim;
- `DIV` findings where claims and reality disagree;
- `RISK` findings where the code carries danger on its own;
- questions that only an external owner can answer;
- an honest account of coverage and unknowns.

No approvals.

No governance gates.

No adoption required.

The output is pre-read, not pre-approved.

You receive an evidenced map of where the system already stopped agreeing with itself.

---

## Working in a legacy codebase

The strongest legacy strategy is usually not to document the entire system.

It is to govern the feature you are about to change.

```text
/docod:run rules-factory extract_from_code
/docod:run system-design reverse_design
/docod:run data-design reverse_model
/docod:run api-contract reverse_contract
/docod:run prd create_prd <workstream>
```

The reverse actions classify reconstructed information as:

```text
evidence
read directly from the code or a source

inferred
deduced from available evidence

user-supplied
provided by an external owner
```

Important inferences become questions.

Contradictions become numbered `DIV` findings.

One-sided dangers become numbered `RISK` findings.

DOCOD does not pretend that reverse engineering recovered truth perfectly.

It records what was observed, what was inferred and what remains unknown.

---

## Project graph and lineage

DOCOD treats the repository as a graph of engineering artifacts.

```text
PRD
  ↓
FRD
  ↓
System design
  ├── Data design
  ├── API contract
  ├── Security design
  └── Infrastructure design
          ↓
        Tasks
          ↓
         Code
          ↓
     QA and review
          ↓
      Operations
```

Relationships are declared through inputs and requirements.

Not every relationship behaves the same way.

### Live lineage

The downstream artifact is expected to remain aligned with the current upstream artifact.

A hash mismatch means stale.

### Snapshot lineage

The artifact records what it observed at a specific moment.

A postmortem should not rewrite history every time the code changes.

### Append-only lineage

The source grows by design.

A decision log is observed at a point in time, not continuously repinned.

### External provenance

The source exists outside the DOCOD artifact registry.

It is recorded but not falsely presented as mechanically resolvable.

### Edge-level snapshot

One relationship may be historical even when the rest of the artifact remains live.

This prevents a false choice between erasing provenance and over-invalidating the project.

---

## Full method map

The live answer is always:

```text
/docod:status
```

The following map is a conceptual overview.

```text
DEFINE

  ○ business-case
          │
          ▼
      ● prd ⚑
          │
          ▼
      ● frd ⚑


ORCHESTRATE

      ● system-design ⚑
          ├── ○ data-design
          ├── ○ api-contract
          ├── ○ security-design
          ├── ○ infrastructure-design
          └── ○ observability
                    └── ○ slos

      design-review
          │
          ▼
      ● task-extraction
          │
          ▼
        tasks ⚑
          │
          ▼
      ● task-executor
          ⇅
      ● qa-executor
      ● code-review


OBSERVE

      ○ runbook
      ○ playbook
      ○ integration-guide


[re]DEFINE

      ○ release-notes
      ○ postmortem
          └── impact-analysis


CROSS-CUTTING

      ⚡ adr
      ⚡ tradeoffs
      ⚡ rfc
      ⚡ impact-analysis
      ⚡ rules-factory
      ⚡ tech-lead
```

Legend:

```text
● core
○ optional when the project needs it
⚑ human approval
⚡ triggered by need, not stage
```

Optional does not mean decorative.

It means the method can operate without the artifact, while the cost of omission remains explicit.

---

## Four-layer architecture

DOCOD has four layers.

| Layer | Location | Responsibility |
|---|---|---|
| Method | `spec/method.yaml` | Movements, capabilities, statuses, approvals and shared rules |
| Contract | `spec/`, `agents/`, `rules/`, `skills/` | What agents, actions and artifacts are |
| Adapter | `adapters/*.yaml` | How the method materializes in a specific harness |
| Instance | `docod.yaml` | Paths, language, topology and targets for one project |

The method and contract layers are vendor-neutral.

The adapter contains tool-specific wiring.

The instance contains project-specific configuration.

Swap the adapter.

Keep the method.

---

## Adapter support

DOCOD is designed to remain independent of model, language and repository stack.

Operational capability depends on the adapter.

### Claude Code

Claude Code is currently the fully materialized reference adapter.

It provides:

- native subagents;
- slash commands;
- explicit hand-back questions;
- command orchestration;
- generated agent envelopes;
- runtime verification after delivery.

### Other harnesses

The installer exposes DOCOD through root-level discovery files such as:

```text
AGENTS.md
CLAUDE.md
```

Harnesses capable of reading these files can discover the method, rules and artifacts.

Full feature parity depends on an adapter implementing the corresponding capabilities.

DOCOD does not claim that every harness currently supports every orchestration feature.

The method is portable.

Materialization is adapter-specific.

---

## Installation and instance configuration

### Repository install

```bash
git clone https://github.com/docod-ai/getdocod
./getdocod/install.sh /path/to/your/project
```

The installer is:

- pure Bash;
- dependency-free at install time;
- idempotent;
- merge-safe;
- namespace-safe.

Run it again to update the bundle.

Your project configuration is preserved.

### Claude Code plugin

```text
/plugin marketplace add docod-ai/getdocod
/plugin install docod@docod
/docod:setup-docod
```

The plugin keeps the method bundle managed and current.

The repository install copies the bundle so you can inspect, modify and fork everything.

Both approaches preserve the same principle:

```text
Your docod.yaml is yours.
Your artifacts are yours.
Your decisions are yours.
```

### What gets installed

```text
.docod/
The method bundle, contracts, agents, runtime and templates.
Recreated during updates. Do not edit generated copies here.

docod.yaml
Your project instance.
Created once and never overwritten.

.claude/agents/docod-*
Native Claude Code subagents.

.claude/commands/docod/
DOCOD orchestration commands.

.agents/docod/skills/
Method-neutral skills.

.claude/skills/docod-*
Claude-compatible links to DOCOD skills.

CLAUDE.md
A namespaced DOCOD discovery block.

AGENTS.md
Created as a link when appropriate, allowing compatible harnesses to discover the method.
```

Everything DOCOD owns is namespaced.

A same-named file without the DOCOD marker is never overwritten.

The installer warns and skips it.

### Your `docod.yaml`

The project instance is intentionally small.

```yaml
project:
  name: "my-project"
  spec: ./.docod/spec/

adapter: claude-code

language: en

docsRoot: docs/

topology: single

targets:
  app:
    path: .
    stack: []
    tasksRoot: tasks/
```

#### Monorepo example

```yaml
topology: monorepo

targets:
  api:
    path: services/api/
    tasksRoot: services/api/tasks/

  web:
    path: apps/web/
    tasksRoot: apps/web/tasks/
```

DOCOD resolves target-scoped paths once per target.

That allows tasks, QA, evidence and reviews to live close to the code they govern.

---

## Files, workstreams and language

### The files

By default:

```text
docs/
  product/
  design/
  decisions/
    adr/
    rfc/
    tradeoffs/
    log/
  quality/
  ops/
    runbooks/
    playbooks/
    postmortems/
    slos.md
  releases/
  standards/
  workstreams/
```

Tasks, evidence, QA and code reviews live under each target's `tasksRoot`.

Grouping is by nature, not by stage.

A document does not move because the project revisited it.

### Workstreams

A workstream is a bounded project front.

By default, it is created when a PRD runs in workstream scope.

It is registered in:

```text
docs/workstreams.yaml
```

Its artifacts live under:

```text
docs/workstreams/<ws>/
```

A workstream ends through:

```text
/docod:ws done <ws>
```

or:

```text
/docod:ws abandon <ws> --reason "..."
```

Abandoning without a reason is refused.

Work that disappears silently becomes lost context.

DOCOD records the ending.

### Language

The method contracts use stable English keys.

The artifacts produced for your project use the language configured in:

```yaml
language: pt-BR
```

The method speaks English.

The product speaks your language.

Agent keys, artifact keys, actions, placeholders and machine vocabulary are never translated casually because they form the executable contract.

Human-facing documents, questions and reports are translated.

---

## Rebless

A legitimate edit invalidates the old approval.

That is correct.

Sometimes a broad change is cosmetic, such as a product rename across many approved documents.

For that case:

```text
rebless
```

`rebless` can batch re-approve invalid approvals and optionally repin stale live inputs.

It requires:

- an approver;
- a reason;
- a visible plan before execution;
- unique source resolution;
- explicit scope when desired.

It never guesses ambiguous references.

Anything it cannot resolve is reported and returns a non-zero exit code.

“I do not know which source this means” is an acceptable result.

Silence is not.

---

## Design principles

DOCOD is built around a small set of principles. The five that most define it:

### Derived, never maintained

State is recomputed from files. A manually maintained index would eventually disagree with the repository.

### Never hide invalidity

Changed approvals stay visible. Stale relationships stay visible. Unknowns stay unknown.

### The verifier is not the producer

Self-review is not independence.

### Missing capability is not permission to improvise

Unavailable verification becomes `NOT VERIFIED`, never a fabricated success.

### Ambiguity is surfaced, never guessed

A resolver may become better at recognizing a source. It must never become better at pretending ambiguity does not exist.

The full set — one artifact one owner, humans retain authority, machines check what machines can, every reference needs a watcher, judgment remains judgment, vocabulary comes before enforcement — is in [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

## What DOCOD does not guarantee

DOCOD is not a formal verification system.

It does not prove that:

- a human actually read an artifact before approving it;
- the identity in `approval.by` is cryptographically authenticated;
- two agents using the same model are epistemically independent;
- every architectural judgment is correct;
- all failures can be detected by tests;
- every harness has the same operational capabilities.

Current recorded design work includes:

- multi-approver governance;
- action-contract evolution for future team workflows;
- a validated scale-down profile for small projects.

Known limits are kept on record.

A deleted limitation is a limitation that returns without context.

---

## What DOCOD is not

DOCOD is not:

- an autonomous software factory;
- a replacement for engineering judgment;
- a proprietary project database;
- a cloud service required to read your own project;
- a generic collection of prompts;
- a rigid process that decides for the team;
- a promise that language models become deterministic;
- spec-driven development with more files.

DOCOD is the machinery that keeps specification, decisions, implementation and evidence from drifting apart.

---

## The wider DOCOD ecosystem

The runtime is one part of a larger system.

```text
                         DOCOD

             AI-Native Software Engineering

      ┌─────────────────┼─────────────────┐
      │                 │                 │
    LEARN              BUILD             GROW
      │                 │                 │
      │                 │                 │
    Book              Method           Community
    Daily             Runtime          Jobs
    Challenges        Documentation    Certifications
    Courses           Templates        Career network
```

### Learn

Understand the discipline.

- **Book** — the principles, models and complete operational method.
- **Daily challenges** — deliberate practice in small, recurring exercises.
- **Courses** — deeper learning in context engineering, harness engineering, agents, specifications, QA and governance.

### Build

Apply the discipline.

- **Method** — Define, Orchestrate, Confirm, Observe and [re]Define.
- **Runtime** — derived state, gates, hashes, lineage and verification inside the repository.
- **Documentation** — contracts, examples and maintainer internals.
- **Templates** — reusable structures for real engineering work.

### Grow

Build a career around the new discipline.

- **Community** — learn and exchange experience with other AI-native engineers.
- **Jobs** — connect professionals with teams redesigning software development around agents.
- **Certifications** — future validation of practical skills and method proficiency.

These are not unrelated products.

They are one learning and execution loop:

```text
Learn the discipline
        ↓
Practice it
        ↓
Apply it in real repositories
        ↓
Share evidence and experience
        ↓
Grow professionally
        ↓
Teach the next cycle
```

The book explains why.

The method explains how.

The runtime makes it executable.

The platform helps people learn, practice, connect and grow.

---

## The book

<a href="https://docod.ai/book">
  <img src="assets/book-cover.png" alt="AI-Native Software Engineering" width="150" align="right">
</a>

**AI-Native Software Engineering** is the conceptual and operational foundation behind DOCOD.

It covers:

- the shift from AI-augmented to AI-native development;
- context engineering;
- harness engineering;
- rules and skills;
- sensors and feedback loops;
- execution environments;
- planning systems;
- the DOCOD cycle;
- spec-driven development;
- documentation as an execution system;
- decomposition;
- autonomous agents;
- QA;
- human gates;
- observability;
- failure modes;
- security;
- long-term maintenance;
- practical implementation through the DOCOD runtime.

The repository is the executable reference implementation.

The book is the complete explanation of the discipline surrounding it.

📖 [Read the book](https://docod.ai/book)

---

## Daily challenges

Learning a method once is not enough.

The DOCOD daily challenge turns AI-native engineering into deliberate practice.

Examples include:

- transforming vague intent into measurable requirements;
- finding hidden assumptions in a PRD;
- decomposing a feature into agent-sized tasks;
- distinguishing product decisions from ADRs;
- designing a QA loop;
- identifying drift between code and documentation;
- writing criteria an executor cannot reinterpret;
- deciding what belongs to automation and what belongs to human judgment.

Challenges are delivered in six languages.

✉️ [Take the daily challenge](https://docod.ai/challenge)

---

## Courses, community and jobs

The DOCOD platform is being released incrementally.

The first public areas focus on:

- the book;
- the method;
- the runtime;
- daily challenges;
- articles and industry analysis.

Future areas expand the same mission:

- practical courses;
- community discussions;
- project showcases;
- reusable templates;
- professional profiles;
- AI-native engineering jobs;
- certifications.

The goal is not to build another content portal.

It is to create the home of AI-native software engineering.

🌐 [Explore DOCOD](https://docod.ai)

---

## Requirements

### Installation

```text
Bash
```

No package installation is required.

### Runtime commands

```text
Node.js ≥ 18
```

YAML support is vendored.

No `npm install`, Python or `pip` is required for the installed runtime.

### Development validation

Maintainers may use additional development-only validators.

They are not installed into user projects.

---

## Contributing

DOCOD welcomes contributions in agent contracts, artifact definitions, validators, adapters, skills, runtime behavior, documentation, diagnostic rules, examples and tests based on real failures.

The project values changes grounded in a real failure or use case, that preserve layer neutrality, include a validator for new cross-file relationships, avoid hidden state, surface uncertainty honestly and keep human authority explicit.

A new rule without a failing case is usually a theory.

A new relationship without a validator is usually future drift.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full guidance and the complete set of design principles.

---

## Author, support and license

DOCOD was created by **[Fabio Valencio](https://docod.ai)**, author of *AI-Native Software Engineering*.

The project grew from a recurring problem:

Agents could produce more software than a human could reliably keep aligned.

The answer was not a larger prompt.

It was an engineering system around the agents.

### Support the project

If DOCOD earns a place in your workflow:

⭐ Star the repository  
📖 [Read the book](https://docod.ai/book)  
✉️ [Take the daily challenge](https://docod.ai/challenge)  
🌐 [Join the platform](https://docod.ai)

That is what keeps the method, runtime and learning ecosystem evolving together.

### License

MIT.

Use it.

Adapt it.

Build on it.

Your artifacts, decisions and repository remain yours.

A link back to [docod.ai](https://docod.ai) is appreciated.

---

<div align="center">

## The future is AI-native.

**Learn the discipline. Build with governance. Grow with the ecosystem.**

[docod.ai](https://docod.ai)

</div>
