---
key: decision-reversibility
name: Decision Reversibility
description: How much rigor a decision deserves. One-way vs two-way door, the trigger for recording, last responsible moment, superseding vs editing. Use when deciding whether something becomes an ADR, and how deep the tradeoff needs to go.
layer: 2
neutral: true
owner: null
used_by: [adr, tradeoffs, rfc, design-review]
requires_capabilities: []
---

# Decision Reversibility

Three agents record decisions. This decides **how much work each one deserves** — which is what separates a useful ADR from bureaucracy.

---

## First: is it a decision?

> **Without a real alternative, it is not a decision. It is a constraint.**

| | Decision | Constraint |
|---|---|---|
| Was there a choice? | yes | no |
| "We will host on Azure" | if AWS was an option | if the company has an enterprise contract with Microsoft |
| "We will use Node" | if the team could choose Go | if the whole team only knows Node and the deadline is 3 weeks |
| Becomes | **ADR** with tradeoff | **constraint in the PRD** — you do not do a tradeoff on what you cannot choose |

A constraint documented as a decision lies twice: it pretends there was a choice, and it hides the lock-in that explains it. If the constraint is expensive, it deserves recording — but as a constraint, with who imposed it and until when it holds.

---

## The trigger: when something deserves an ADR

**It deserves one** when a real alternative exists **and at least one of these**:

- **Expensive to reverse** — data migration, change to a public contract, retraining the team
- **Creates lock-in** — depending on a proprietary API, a closed format, a single vendor
- **Someone will ask "why did we do it this way?"** — in 6 months, without you around
- **Contradicts a previous ADR** — the contradiction must be explicit, not silent

**It does not deserve one:**

- There was no alternative → it is a constraint
- Reversing costs an afternoon → decide and move on
- Nobody will ask → it is a preference, not a decision
- It is an obvious consequence of an ADR that already exists → cite the ADR, do not create another

**The mistake on both sides:** an ADR for choosing a date library inflates the record and nobody reads any of them. Zero ADRs and every "why is this?" becomes archaeology. The trigger exists to hit the middle.

---

## One-way door vs two-way door

```
TWO-WAY — you can go back                ONE-WAY — you cannot, or it costs dearly
────────────────────────                 ──────────────────────────────
swapping an internal library             public API schema
folder structure                         persisted data format
variable name, code style                cloud choice with managed service
test framework                           contract with an external client
                                         domain data model
↓                                        ↓
decide fast                              decide slowly
short ADR, or none                       ADR + full tradeoff
the cost of being wrong is an afternoon  the cost of being wrong is a quarter
```

**The asymmetry matters more than the classification.** At a two-way door, the cost of over-deliberating is greater than the cost of being wrong. At a one-way door, the reverse. Treating everything with the same rigor is wrong in both directions: it paralyzes the trivial and rushes the irreversible.

**Beware of the door that looks two-way:** "it's just a Redis cache, we'll swap it later" — until 40 places depend on its behavior. Reversibility decays with time and with coupling. The right question is: *is reversing this in 6 months, with the system in production, still an afternoon?*

---

## How much tradeoff the decision deserves

| Door | Alternatives | Rigor |
|---|---|---|
| Two-way | 2 obvious ones | No tradeoff. The ADR's "Alternatives Considered" section is enough — one paragraph each. |
| Two-way | many, high switching cost | Light tradeoff: pros-and-cons table, no weights. |
| **One-way** | any | **Full tradeoff:** weighted criteria, matrix, evaluation, sensitivity. |
| One-way | and expensive in money | Full tradeoff **+ `financial-modeling`** — TCO, exit cost, opportunity cost. |

**That is why `tradeoffs` is not mandatory before the ADR.** If every decision required a weighted matrix, nobody would write ADRs — and an unrecorded decision is worse than a record without a matrix. The tradeoff is the **deepening** that the one-way door demands, not a toll on every decision.

---

## Last responsible moment

> Decide at the last moment when it is still possible to decide well — not before, not after.

- **Before:** you decide with less information than you would have. The premature decision is the one that most often becomes a superseded ADR.
- **After:** the decision was made by inertia. Someone wrote the code and now the ADR only documents what is already done — which is the inversion the method exists to prevent.

**How to know the moment has arrived:** someone is about to write code that depends on the answer.

**Deferring is a legitimate decision** — and it deserves recording if the cost of deferring is real. "We deferred the database choice until we have volume data; until then, we isolate access behind an interface" is a good ADR.

---

## Supersede, never edit

An ADR is immutable. When the decision changes:

```
ADR-0004  status: superseded   supersedes: —          superseded_by: 0011
ADR-0011  status: accepted     supersedes: 0004
```

- 0004 **stays there**, with the context that made sense in 2024. Deleting it destroys the history that explains the code that still exists.
- 0011 says **what changed in the context** — not "we were wrong", but "premise X no longer holds".
- Editing 0004 in place is the worst path: those who read it before saw something else, and nothing records that it changed.

**A revoked decision is not failure.** A superseded ADR is a sign the method works: the decision was recorded, the context changed, someone noticed. Zero superseded ADRs in two years means nobody is reading the ADRs — not that everyone was right.

---

## Anti-patterns

| Anti-pattern | How it shows up | Why it hurts |
|---|---|---|
| **ADR for a constraint** | "We decided to use Azure" when there is an enterprise contract | pretends there was a choice; hides the lock-in that explains it |
| **Retroactive ADR** | written after the code | documents, does not decide — and nobody will contradict what already runs |
| **Tradeoff for a two-way door** | weighted matrix to pick a date lib | paralyzes the trivial and trains the team to ignore the process |
| **No tradeoff at a one-way door** | "we chose Kafka", period | opinion with authority |
| **Straw-man alternative** | 2 bad options and the favorite | a facade of comparison |
| **Editing an accepted ADR** | fixes the text in place | those who read it before saw something else |
| **ADR without consequences** | only what was decided | half the value is in what it costs |
| **Premature decision** | chooses before needing to | becomes superseded, with code already depending on it |

---

## Test before recording

1. Was there a real alternative? If not, it is a constraint — do not write an ADR.
2. Is it a one-way or two-way door? The answer sets the rigor of everything else.
3. Is reversing it in 6 months, in production, still an afternoon?
4. Will someone ask "why did we do it this way?" without me around?
5. If it is one-way: is the tradeoff complete, or did I skip it because I already knew the answer?
6. Are the alternatives real, or straw men set up so the favorite wins?
7. Am I deciding now because it is needed, or because I can?
8. Does it contradict a previous ADR? Then it is a supersede — not silence.
