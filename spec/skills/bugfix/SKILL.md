---
key: bugfix
name: Bug Fixing
description: Fix the cause, not the symptom. Reproduce before fixing, a regression test that fails if the fix is reverted, ordering by severity, and why haste costs more here than anywhere else. Use when fixing a bug, when reviewing a fix, and when investigating the cause of an incident.
layer: 2
neutral: true
owner: null
used_by: [task-executor, code-review, postmortem]
requires_capabilities: []
---

# Bug Fixing

**A bug has already cost once. A wrong fix makes it cost again — and the second time nobody believes you anymore.**

Fixing a bug carries a pressure that building a feature does not: someone is waiting, sometimes in production, sometimes the boss. And that pressure pushes toward the one thing that guarantees rework — treating the symptom.

---

## Build the feedback loop first — this is the skill

Everything else is mechanical. If you have a TIGHT pass/fail signal that goes
red on THIS bug, you will find the cause: bisection, hypothesis-testing and
instrumentation all just consume it. If you do not have one, no amount of
staring at code will save you. Spend disproportionate effort here.

Ways to construct one, in rough order of preference: a failing test at
whatever seam reaches the bug; a scripted call against a running instance
diffed against known-good output; replaying a captured real input through the
code path in isolation; a throwaway harness (minimal subset of the system,
one call); a property/fuzz loop for "sometimes wrong"; a bisection harness
when the bug appeared between two known states; a differential run (old vs
new, same input, diff the outputs). A human-in-the-loop script is the last
resort — and even then, script the human so the loop stays structured.

## Reproduce before fixing

**The rule haste kills first.** If you did not reproduce, you do not know what the bug is — you have a hypothesis about a report. Fixing a hypothesis produces three outcomes, and two are bad:

1. the bug goes away (you got lucky, and you do not know why — it comes back)
2. the bug does not go away (you changed code for nothing, and now you have two problems)
3. the bug goes away and you understood it (the only acceptable one)

And if you could not reproduce it, **that is information, not failure**: it means the bug's condition is not in the report. Environment, data, concurrency, timing, permissions, version — something is missing. Discovering what is missing IS the work.

---

## Cause, not symptom

| Symptom | Cause |
|---|---|
| `if (user == null) return;` | why does `user` arrive null here? |
| `try/catch` swallowing the error | why does the error happen? |
| `sleep(500)` before the assertion | what is the race? |
| retry until it works | why does it fail the first time? |
| defensive `toString()` on the field | who is sending the wrong type? |

All the ones on the left **work**. The test passes, the ticket closes, the user stops complaining. And all of them leave the bug there, now invisible, waiting for a slightly different condition to come back wearing a different face — and the next person will be debugging a system where someone has already hidden the clue.

**The test is honest and uncomfortable:** *"do I know why this was happening, or do I know what made it stop happening?"* Only the first is a fix.

**When the root cause is too expensive for now**, that is a legitimate decision — but it is a **decision**, and decisions get recorded. A declared mitigation with the cost written down is engineering. A mitigation called a fix is debt disguised as delivery.

---

## The regression test has one requirement

**It must fail if the fix is reverted.**

This is not a detail of rigor: it is the only proof that it tests the bug. A test written after the fix, without this check, frequently tests the happy path that already worked — and joins the suite forever, providing confidence about nothing.

The sequence is: write the test, **watch it fail**, fix, watch it pass. If you invert it, you never knew whether it caught the bug.

And the test goes at the level of the bug:

| The bug was | The test is |
|---|---|
| in the logic of a function | unit |
| in the conversation between modules | integration |
| in the flow the user performs | end to end |

An integration bug covered by a unit test is false security: the unit test passes with the mock, and the mock is where the bug was not.

---

## Severity defines the order, not the haste

Fix from most severe to least. But **severity does not change the method** — a critical bug does not authorize a hack. It authorizes mitigating fast **and declaring it was a mitigation**, with the real fix scheduled.

The opposite is what happens in practice: the high-severity bug becomes the one with the most fragile fix, because it was the most rushed. And then it comes back.

---

## Find its siblings

**A bug is rarely unique.** The cause that produced this one almost always produced others: the same wrong pattern copied in five places, the same wrong assumption in three callers.

After finding the cause, **look for the same cause elsewhere**. It is the cheapest moment to find it — you have just understood exactly what to look for, and you will never have this context this fresh again.

---

## Review signals

| 🔴 | Why |
|---|---|
| fix without documented reproduction | nobody knows if that was the bug |
| regression test never seen failing | may test nothing |
| new `catch` with no handling, just silence | hid it, did not fix it |
| fixed wait (`sleep`) to "solve" flakiness | the race is still there |
| null check in the consumer, without investigating the producer | the wrong data keeps being born |
| fix that changes 12 files | either it was not a bug, or it was not a fix |
| bug closed and the same cause in another file, untouched | the siblings stayed |
| "fixed" without a test, "because it's simple" | simple is where the regression gets through |

---

## Test

1. Did I reproduce the bug before touching the code?
2. Do I know **why** it happened, or only what made it stop?
3. Does the regression test fail if I revert the fix? **Did I see it fail?**
4. Is the test at the right level — where the bug was?
5. Is this a fix or a mitigation? If it is a mitigation, is it declared, with the real fix scheduled?
6. Does the same cause exist elsewhere in the code?
7. Does the whole suite still pass — not just the new test?
8. Did I discover another bug along the way? Was it recorded, not silenced?
