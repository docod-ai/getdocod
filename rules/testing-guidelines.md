---
key: testing-guidelines
kind: rule-template
generates_artifact: testing-guidelines
generated_by: rules-factory
---

<!--
MOLD — not the rule. The `rules-factory` generates THIS project's rule from here.

It does not come ready-made because "write good tests" rejects nothing and
approves nothing — it only lets the reviewer call what they disliked a
violation.

SPECIAL CARE HERE: this is the mold where the most tutorial gets written. AAA,
mocks, the test pyramid — the team already knows, or it is not the project that
will teach them. The rule says what THIS project requires and what rejects the
PR. Nothing more.
-->

## derivation

**Deriving is the default. Asking is the exception.**

### Derive

| Rule | Born from | Provenance |
|---|---|---|
| framework, runner, command | test config + dependency manifest | `evidence` |
| the levels that exist today | the test folders and the pipeline | `evidence` |
| what runs on each trigger (PR, merge, nightly) | the pipeline | `evidence` |
| configured coverage and the current gate | coverage config + the CI step | `evidence` — **if it exists** |
| what needs a contract test | `api-contract` — every operation with a consumer | `decided` |
| what needs a migration test | `data-design` § Migration | `decided` |
| what needs an accessibility test | is there an interface? then it is a requirement, not an improvement | `decided` |
| test data and personal data | `data-privacy`, `security-rules` | `decided` |
| verifiable criterion | `frd` — the RF already says how it is verified | `decided` |

**What CI already rejects does NOT become a rule.** It goes into "what the machine guarantees".

### Ask — only this

| Question | Why it cannot be derived | No answer |
|---|---|---|
| does a red test **block** the merge? | it is a rigor decision | **gap** |
| what to do with a flaky test: quarantine, remove, fix on the spot? | it is policy, and it defines whether the suite is trustworthy | **gap** |
| legacy code without tests: require on touch, or leave it? | it is policy | **gap** |
| what is deliberately **not** tested here | nobody writes down what they decided not to do | skip |

### Ask — seams
- *"What are the public seams — the boundaries where behavior is observed —
  and which ones do we test at?"* Tests live at PRE-AGREED seams, never
  against internals: code can change entirely, tests should not. An
  unconfirmed seam gets no test — agreeing seams up front is how effort lands
  on critical paths instead of every edge.

### Never

- **Do not teach how to test.** AAA, mocks, the pyramid: the team knows, and if it does not, the rule is not what will fix it. A rule that becomes a tutorial is not read — and what matters in it dies along with it.
- **Do not invent coverage.** No decision means a **gap**. An invented number becomes a target the following week, and then the team writes tests for the number, not for the bug. It is Goodhart, and he arrives fast.
- **Do not decide the framework.** A real alternative is `adr`.

---

## structure

```markdown
---
paths:
  - "<area glob>"
---

# Tests — what this project requires

## What the machine already guarantees
| Trigger | Runs | Rejects? |
|---|---|---|
| PR      | unit + contract | yes |
| nightly | end to end      | no — opens a ticket |

## Rules
- **TG-01** — Every `api-contract` operation has a contract test, **including the errors in the closed list**. `decided` api-contract § 3 · **blocks**
  **Why:** an untested error is what the consumer discovers in production.
- **TG-02** — Every migration has a test with representative volume. `decided` ADR-0012 · **blocks**
  **Why:** a migration that runs in 2s in dev runs in 40min with real data — and locks the table.
- **TG-03** — A bug fix comes in with a test that **fails if the fix is reverted**, and it was **seen failing**.  **blocks**
  **Why:** a test written after the fix usually tests the happy path that already passed. It stays in the suite forever giving confidence about nothing.

## Anti-patterns the review rejects

- **Implementation-coupled**: mocks internal collaborators, tests private
  methods, or asserts through a side channel. The tell: it breaks on refactor
  with behavior unchanged.
- **Tautological**: the assertion recomputes the expected value the same way
  the code does — it passes by construction and can never disagree with the
  code. Expected values come from an independent source: a known-good
  literal, a worked example, the spec.

## Gaps
- **minimum coverage** — not decided. The `code-review` does NOT flag coverage as a violation.
- **flaky tests** — no policy. Nobody knows whether to quarantine or fix.

## Exceptions
- [where it does not apply, and why]
```

### What makes this rule worth anything

**It talks about triggers and verdicts, not technique.** *"The contract test runs on the PR and rejects"* changes behavior. *"Prefer deterministic tests"* changes nothing.

**The regression-test rule is the one that takes the most work and pays the most.** It is the only one that keeps the suite from growing with tests that test nothing.

**The coverage gap is mandatory if there is no decision.** Without it written down, the reviewer flags coverage on their own — and the author has nothing to argue against.

### Test before generating

1. Is any rule a tutorial on how to test? Delete it.
2. Would any rule survive a change of framework? Delete it — it is advice.
3. Did I invent coverage?
4. Is it stated what **blocks** and what does not?
5. Is it stated what runs on **which trigger**?
6. Are the gaps written down?
7. Does it fit on one screen?
