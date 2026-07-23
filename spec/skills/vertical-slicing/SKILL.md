---
key: vertical-slicing
name: Vertical Slicing
description: Breaking large work into slices that deliver value on their own. Vertical vs horizontal, SPIDR patterns, walking skeleton, how small is small. Use when splitting an epic into stories, or a story into tasks.
layer: 2
neutral: true
owner: null
used_by: [user-stories-epics, task-extraction, project-management]
requires_capabilities: []
---

# Vertical Slicing

**Every slice crosses all the layers and delivers something someone notices.**

```
❌ HORIZONTAL                        ✓ VERTICAL
┌─────────────────────┐             ┌───┬───┬───┐
│ 1. All the front    │             │ 1 │ 2 │ 3 │  front
├─────────────────────┤             ├───┼───┼───┤
│ 2. All the API      │             │ 1 │ 2 │ 3 │  API
├─────────────────────┤             ├───┼───┼───┤
│ 3. All the database │             │ 1 │ 2 │ 3 │  database
└─────────────────────┘             └───┴───┴───┘
nothing works until the end          1 works on its own
```

**Why horizontal fails:** nothing is deliverable until the last layer. You cannot truly test, cannot show, cannot learn. You discover at the end that the front needed a field the API does not have. And "70% done" means 0% delivered.

**The test:** *does this slice, on its own, change anything for anyone?* If the answer is "no, it needs the other one", you sliced wrong.

---

## SPIDR — five ways to cut

When the story is too big, try in this order:

### S — Spike
Cannot estimate because you do not know how to do it? The first slice is **finding out**, with a fixed timebox and a written question.

> "Investigate whether library X supports offline authentication — 1 day, deliverable: yes/no + how."

A spike does not deliver value to the user; it delivers a **decision**. Use sparingly: two spikes in a row means you are building the wrong thing.

### P — Path
Alternative flows become slices.

> "Authenticate" → biometrics (slice 1) · PIN (slice 2) · recovery (slice 3)

Each one delivers a whole path, working.

### I — Interface
Cut by input channel, not by layer.

> "Registration" → web form (1) · CSV import (2) · API (3)

### D — Data
Start with the simplest data subset.

> "Report" → one month (1) · custom range (2) · period-over-period comparison (3)

### R — Rule
Start with the simplest rule; add complexity in slices.

> "Lock on attempts" → locks after 5 (1) · 10-min sliding window (2) · progressive backoff (3)

**The order matters:** Path and Rule almost always yield better slices. "Splitting by CRUD" (create/list/edit/delete) looks vertical but is usually horizontal in disguise — nobody uses "create" without "list".

---

## Walking skeleton

The first slice of a new system crosses **everything**, in the dumbest way possible.

> One screen · one endpoint · one row in the database · one deploy · one end-to-end test

Ugly, no error handling, a single case. But **it walks**. After that, each slice fattens a piece of the skeleton.

The value is not the functionality — it is the proven path. You discover on day 2 that the deploy does not work, not on day 60.

---

## How small is small

| Sign of too big | What to do |
|---|---|
| Does not fit in one iteration | cut by Path or Rule |
| Has an "and" in the title | probably two |
| Has "manage", "administer", "support" | umbrella verb: list what it hides |
| You cannot estimate it | missing knowledge → Spike |
| Acceptance criteria exceed ~7 | it is several slices |
| Needs two people in parallel to fit | cut again |

**Sign of too small:** the slice changes nothing for anyone. "Create the users table" is not a slice — it is a step. If the only way to describe the value is technical, you went too far.

---

## Vertical is not dogma

Two honest exceptions:

**Purely technical work** — migration, dependency upgrade, CI pipeline. There is no user value to cross; the value is for the team or for the risk. Slice by **risk reduced** or **capability unlocked**, not by layer:

> "Security job blocking secrets in CI" — has no screen, but delivers eliminated risk and can be tested on its own.

**Enabler with a deadline** — sometimes the infra has to come first. Acceptable, if: it is declared as an enabler, has a deadline, and the next slice that uses it is defined. An enabler with no defined consumer is horizontal with a pretty name.

---

## Anti-patterns

| Anti-pattern | How it shows up | Why it hurts |
|---|---|---|
| **Slice by layer** | "Checkout backend" | nothing deliverable until everything is done |
| **CRUD as slices** | create / list / edit / delete | nobody uses "create" without "list" |
| **Technical slice with no value** | "Configure the ORM" | changes nothing for anyone |
| **Umbrella verb** | "Manage users" | hides 6 slices |
| **Cascading spikes** | investigate, then investigate more | you are building the wrong thing |
| **Orphan enabler** | "Prepare the infra" with no one using it | horizontal in disguise |
| **3-sprint slice** | an "epic" called a story | neither estimable nor testable |

---

## Test before closing the slice

1. Does this slice, on its own, change something for someone? Who, and what?
2. Does it cross all the layers it needs, or does it depend on another slice to work?
3. Does it fit in one iteration — with room for testing?
4. Can I write the acceptance criterion without "and then"?
5. If it is technical work: what risk does it reduce or what capability does it unlock?
6. If it is an enabler: who is the consumer, and what is the deadline?
7. Is there an umbrella verb in the title?
