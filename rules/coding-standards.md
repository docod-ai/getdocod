---
key: coding-standards
kind: rule-template
generates_artifact: coding-standards
generated_by: rules-factory
---

<!--
MOLD — not the rule.

The `rules-factory` reads this and generates THIS project's rule, with the real
language, the real tool, the real numbers. Only the generated one counts.

Why it does not come ready-made: a generic `coding-standards` is WORSE than
none. It produces "use descriptive names" and the `code-review` starts pointing
that out with the authority of a rule. Without a rule, the reviewer says "it's
my opinion" and the author argues as an equal. With a vague rule, they say "it
violates the coding-standards" — and the same opinion became a norm. Generic
does not fill the void: it institutionalizes personal taste.
-->

## derivation

**Deriving is the default. Asking is the exception.**

Almost everything that becomes a code rule is already written somewhere in this project. Asking what is written is not redundancy: the user answers differently from what the file says, and the project now has two sources — born on the same day, by the factory's own hands.

### Derive

| Rule | Born from | Provenance |
|---|---|---|
| naming, line limit, imports, formatting | linter/formatter config | `evidence` |
| mandatory typing | types config + actual % of adoption in the code | `evidence` |
| language, runtime, framework, allowed lib | `adr` | `decided` |
| error format | `api-contract` § Conventions | `decided` |
| personal data in logs, retention | `data-design`, `security-rules`, ADR | `decided` |
| allowed dependency | dependency manifest + stack ADR | `evidence` + `decided` |
| folder structure | the code itself, **if consistent** | `evidence` |
| commit/branch convention | VCS history | `evidence` — **habit ≠ rule** |

**What the linter already rejects does NOT become a rule.** It goes into the "what the machine guarantees" section and that is that. Nobody reads a rule to discover what CI catches — and every unnecessary line dilutes the ones that matter.

### Ask — only this

| Question | Why it cannot be derived | No answer |
|---|---|---|
| the unwritten rule the newcomer breaks in their first week | it is nowhere. **It is the only reason to interview anyone** | skip; do not invent |
| which violation **blocks** the merge and which is a caveat | it is a rigor decision, not a fact | **gap** |
| what to do with legacy that violates the new rule | it is policy | **gap** |
| the `paths` of each rule | depends on how the team thinks about the repo | derive from the `targets`, confirm |

### Never

- **Do not decide.** A real alternative — which linter, which branch policy — is `adr`. Asking "what do you think" invites the user to decide off the cuff, with no alternative and no cost, and the answer enters as a norm without ever having been a decision.
- **Do not invent a number.** Coverage, limit, size: no answer means a **gap**. An invented number in a rule becomes a target the following week and nobody remembers it came from nowhere.
- **Do not canonize habit.** 80% of files doing the same is not a rule with an exception: it is inconsistency, and maybe it is exactly what the team wants to fix. Point it out and ask.

---

## structure

**One rule per area, scoped.** Not a single document.

A UI rule has nothing to say about data migration. A single rule becomes a 40-item list nobody reads — and an unread rule is not discipline: it is an arsenal to reject any PR.

```markdown
---
paths:
  - "<area glob>"
---

# <Area> — what this project requires

## What the machine already guarantees
| Tool | Config | Guarantees |
|---|---|---|
| formatter | <config> | all formatting — not debated in review |
| linter    | <config> | 23 active rules |

Above the line is automatic. **Below is on us — and that is all the rule talks about.**

## Rules
- **CS-01** — [imperative, one line]. `decided` ADR-0009 · **blocks**
  **Why:** [the pain it avoids]
  ❌ [wrong, short]   ✅ [right, short]

## Gaps
- **minimum coverage** — not decided. The `code-review` does NOT flag coverage as a violation.

## Exceptions
- [where it does not apply, and why]
```

### The three sections that are not obvious

**"What the machine guarantees"** exists so the rest stays short. If it is there, it does not become a rule.

**"Gaps" protects the PR's author.** Silence in the rule does not mean "free" — it means the reviewer fills it with their own taste. A written gap is what prevents that.

**"Why" on every rule.** A rule without a reason is obeyed without being understood — and then the first legitimate exception becomes a fight, or worse, a silent workaround.

### Severity

| | |
|---|---|
| **blocks** | security, data, contract, frozen decision |
| **caveat** | acceptable debt |
| **nit** | preference. Marked as a nit, **not insisted on** |

Without this, the `code-review` treats everything the same — and the migration without a rollback arrives with the same voice as the variable's name.

### Test before generating

1. Would any rule survive a change of language? **Delete it** — it is advice.
2. Does any repeat what the formatter does? Delete it.
3. Is every rule verifiable without asking the author?
4. Does every rule have provenance and severity?
5. Did I invent a number?
6. Did I choose something that should be an `adr`?
7. Are the gaps written down?
8. Does the rule fit on one screen? If not, either it is two rules with different `paths`, or there is advice in the middle.
9. **Is the "what the machine guarantees" section bigger than the rules section?** Great sign.
