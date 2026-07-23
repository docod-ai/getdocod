---
key: security-rules
kind: rule-template
generates_artifact: security-rules
generated_by: rules-factory
---

<!--
MOLD — not the rule. The `rules-factory` generates THIS project's rule from here.

It SPLIT from `security-design`. The v1 had two things under one name — same
diagnosis as the `trd`:

  principle, IAM, secrets, input validation        → RULE (here)
  threat model, cryptography, keys, attack surface → DESIGN (security-design agent)

The difference: a norm the executor OBEYS while writing. A threat model someone
must DO, looking at this system. If it all became a rule, the threat model
would be orphaned — and the design-review would start checking security against
a generic checklist, which is the opposite of its job.

SPECIAL CARE: this is the mold where the temptation of the generic is
strongest, because the world is full of ready-made lists. "Validate input",
"least privilege", "defense in depth" — all true, all useless in a rule: they
reject nothing and approve nothing. And here the cost of the generic is worse
than in the others: it gives the feeling that security has been handled.
-->

## derivation

**Deriving is the default. Asking is the exception.**

### Derive

| Rule | Born from | Provenance |
|---|---|---|
| authentication and scope per route | `api-contract` — each operation already declares it | `decided` |
| error format that does **not leak** detail | `api-contract` § Conventions | `decided` |
| which field is personal or sensitive | `data-design` § Per-field Classification | `decided` |
| retention, purge, legal basis | `data-design` § Retention, `data-privacy` | `decided` |
| cryptography, keys, rotation | **`security-design`** — it is design, not a norm | `decided` |
| exposed surface, who talks to whom | `system-design` § Boundaries | `decided` |
| where the secrets live | the pipeline config | `evidence` |
| analysis tool and what it rejects | the pipeline | `evidence` |
| regulated sector, compliance | `prd`, `frd` | `decided` |

**What the pipeline's security tool already rejects does NOT become a rule.** It goes into "what the machine guarantees". The rule talks about what the machine does not see — and in security that is almost everything that matters: authorization logic, data in the wrong place, undue trust.

### Ask — only this

| Question | Why it cannot be derived | No answer |
|---|---|---|
| **what here has leaked, or almost?** | it is written nowhere, and it is worth more than any checklist | skip; do not insist |
| which violation **blocks** the merge | it is a rigor decision | **gap** |
| who may see production data | it is policy | **gap** |
| what is acceptable in a test environment | it is policy — and it is where the leak happens | **gap** |

### Never

- **Do not copy a ready-made list.** "Least privilege", "defense in depth", "validate input" — a universal truth rejects no PR. If it holds in any repository, it is not this project's rule.
- **Do not do threat modeling.** That belongs to the `security-design`. You say what to obey; it says what threatens us.
- **Do not choose an algorithm, a library or a provider.** A real alternative is `adr` — and here it is a one-way door, so it probably requires `tradeoffs` too.
- **Do not invent a rotation period or a key size.** No decision means a **gap**.
- **Do not let the generic pass for coverage.** A vague security rule is worse than the other generics: it gives the feeling that security has been handled, and that stops the conversation.

---

## structure

```markdown
---
paths:
  - "<area glob>"
---

# Security — what this project requires

## What the machine already guarantees
| Tool | Rejects |
|---|---|
| static analysis | known insecure patterns |
| dependency audit | high/critical vulnerabilities |
| secret scanning | committed secrets |

**Below is on us — and in security this is where what matters lives:** authorization,
data in the wrong place, undue trust. The machine catches none of the three.

## Rules
- **SR-01** — Personal data never in a log. Not in the application log, not in the audit log, not in an error message. `decided` data-design § 4 · **blocks**
  **Why:** it is the most common leak because **nobody decides to leak**. Someone serializes the whole object into a log, and the data ends up in a system with a different retention, a different access control, and outside every purge.
- **SR-02** — Every route declares authentication and scope, **including the internal ones**. `decided` api-contract · **blocks**
  **Why:** "it's internal" is the premise that ages the worst. Today's internal is tomorrow's exposed, and nobody revisits it.
- **SR-03** — An error message returns no stack, no query, no file path. `decided` api-contract § 2 · **blocks**
  **Why:** a verbose error is free reconnaissance for whoever is looking.

## Gaps
- **who sees production data** — not decided.
- **real data in the test environment** — no policy. **It is where the leak happens**, and nobody looks.

## Exceptions
- [where it does not apply, and why]
```

### What separates this rule from a list off the internet

**It cites the project's artifact.** `data-design § 4`, `api-contract § API-01`. A rule without an internal source is a ready-made list with a different header.

**It talks about what the machine does not see.** The tool catches committed secrets and vulnerable dependencies. It does not catch wrong authorization, personal data in the log, or undue trust between services. **That is all the rule should talk about.**

**The question "what has leaked here" is worth more than any checklist.** It is concrete, it is this project's, and the rule that comes out of it is the only one the team will remember.

### Test before generating

1. Is any rule a universal truth? Delete it — it rejects nothing.
2. Does any rule repeat what the pipeline's tool already catches?
3. Does every rule cite an artifact of this project?
4. Did I do threat modeling? That belongs to the `security-design`.
5. Did I choose an algorithm, a lib or a provider? That is `adr` — and a one-way door.
6. Did I invent a rotation period or a key size?
7. Are the gaps written down — including real data in test?
8. Does it fit on one screen?
