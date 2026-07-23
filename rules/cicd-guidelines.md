---
key: cicd-guidelines
kind: rule-template
generates_artifact: cicd-guidelines
generated_by: rules-factory
---

<!--
MOLD — not the rule. The `rules-factory` generates THIS project's rule from here.

This is the easiest rule of all to derive: the pipeline IS a file. It says what
runs, when, and what rejects — no opinion, no interview.

If the factory asks "what's your CI like", it did not read the repository.
-->

## derivation

**Here deriving is not a preference: it is almost everything.** The pipeline is written, versioned and in force. Asking what it already says is pure damage.

### Derive

| Rule | Born from | Provenance |
|---|---|---|
| what runs, in what order, on what trigger | the pipeline file | `evidence` |
| what rejects and what only warns | the pipeline — a step that fails vs a step that is tolerated | `evidence` |
| environments and the promotion order | the pipeline + the deploy config | `evidence` |
| where the secrets live | the pipeline config — **never the code** | `evidence` |
| branch and merge pattern | VCS history + configured protections | `evidence` — **habit ≠ rule** |
| runner, cloud, orchestrator | `adr` | `decided` |
| migration before or after the deploy | `data-design` § Migration — expand/contract demands the order | `decided` |
| what needs a window | `data-design`, `infrastructure-design` | `decided` |
| RPO/RTO that constrains the rollback | `infrastructure-design` | `decided` |

### Ask — only this

| Question | Why it cannot be derived | No answer |
|---|---|---|
| **has the rollback ever been executed?** | the pipeline shows it exists, not that it works | **gap — and it is the gravest one** |
| who may approve a deploy to production | it is policy, not a file | **gap** |
| what authorizes skipping the pipeline (hotfix) | it is policy — and every team has one, informal | **gap** |
| forbidden deploy window | it is an agreement | skip |

### Never

- **Do not ask what the pipeline answers.** It is the easiest file in the repository to read.
- **Do not teach CI/CD.** Blue-green, canary, trunk-based: if the project uses it, it is in the file; if it does not, it is not the rule that will convince anyone.
- **Do not choose a deploy strategy.** A real alternative is `adr`.
- **Do not invent an SLA or a window.**
- **Beware of habit.** Three branch patterns coexisting in the history is not a rule with an exception: it is inconsistency. Point it out and ask.

---

## structure

```markdown
---
paths:
  - "<glob of the pipeline and the deploy config>"
---

# Pipeline & Deploy — what this project requires

## What the machine already guarantees
| Trigger | Runs | Rejects? |
|---|---|---|
| PR    | lint, types, unit, security  | yes |
| merge | build + deploy to staging    | yes |
| tag   | deploy to production         | requires approval |

## Rules
- **CD-01** — A secret never in the repository, nor in versioned config. `decided` security-rules · **blocks**
  **Why:** a committed secret lives in the history forever. Rotating is the only fix, and nobody rotates what they don't know has leaked.
- **CD-02** — A destructive migration step never in the same deploy as the constructive one. `decided` data-design · **blocks**
  **Why:** it is the only thing here that has no revert.
- **CD-03** — A skipped pipeline requires a record of who authorized it and why. **blocks**
  **Why:** an unrecorded hotfix is how the process dies — one exception becomes precedent, and precedent beats rule.

## Gaps
- **rollback never tested** — exists in the pipeline, never executed. **It is not a rollback: it is hope.**
- **who approves production** — not decided.

## Exceptions
- [where it does not apply, and why]
```

### The two things that matter here

**The rollback question is the one that pays the most.** The pipeline shows the step exists; it does not show it works. A rollback never executed is hope with a procedure's name — and the moment to find out is not during the incident. If the answer is "we never tested it", **that is a gap and it is grave**: write it that way.

**A recorded exception is what keeps the rule alive.** Every team skips the pipeline at some point. If there is no way to record it, the exception becomes silence, the silence becomes habit, and the habit beats the rule.

### Test before generating

1. Did I ask anything the pipeline file answers?
2. Is any rule a CI/CD tutorial? Delete it.
3. Did I choose a deploy strategy? That is `adr`.
4. Did I invent a window, an SLA or a deadline?
5. Did I canonize a branch pattern by majority?
6. **Did I ask whether the rollback has ever been executed?**
7. Does it fit on one screen?
