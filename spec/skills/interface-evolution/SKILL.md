---
key: interface-evolution
name: Interface Evolution
description: Changing the contract without breaking whoever consumes it. What a real breaking change is, expand/contract applied to interfaces, versioning, deprecation with a deadline, and why the external consumer has no rollback. Use when specifying, reviewing, executing or measuring the impact of a contract change.
layer: 2
neutral: true
owner: null
used_by: [api-contract, code-review, impact-analysis, task-executor]
requires_capabilities: []
---

# Interface Evolution

**A deploy you can revert. The client who already updated, you cannot.**

It is the same asymmetry as `schema-migration`, in a place where nobody expects to find it. The contract looks like code — it is in the repository, passes CI, has tests. But it is not yours: it is the promise other people built on top of. When you break a contract, the damage is not in your process, it is in theirs — and your rollback does not undo the mobile app that already shipped to the store, nor the partner who rewrote the integration.

Four agents touch the same change: one specifies it (`api-contract`), one catches it in the PR (`code-review`), one finds who consumes it (`impact-analysis`) and one executes it (`task-executor`). `code-review` is the critical point — it is the last cheap place to catch the breaking change, and it is where it slips through, because in a diff almost every breaking change looks small.

---

## What a real breaking change is

Intuition gets it wrong in both directions. The real rule: **it breaks what the consumer had the right to assume.**

| Change | Breaks? | Why |
|---|---|---|
| add an **optional** field to the response | no | those who don't know it, ignore it — **if** the consumer tolerates unknown fields |
| add a **required** field to the request | **yes** | every existing client starts sending invalid requests |
| add an optional field to the request | no | nobody needs to send it |
| remove or rename a response field | **yes** | someone reads it |
| make an optional field required | **yes** | it removes the permission to omit |
| make a required field optional | no | but whoever reads the response may not expect the absence |
| loosen validation | **almost always no** | accepts more than before |
| tighten validation | **yes** | it rejects what used to pass |
| add a new value to an enum | **yes, in the response** | the consumer's `switch` has no case for it |
| add a new value to a request enum | no | they don't need to send it |
| new error code | **yes, in practice** | nobody handles what they don't know |
| change a field's **meaning**, keeping the type | **yes, and it's the worst** | compiles, passes the tests, and silently produces wrong results |

The two traps almost everyone gets wrong:

**Adding a value to a response enum breaks.** It looks additive — it removes nothing. But the consumer has a `switch` with the values that existed when it was written. A new `status: "in_dispute"` falls into the `default`, and the `default` of someone who did not foresee it is almost never safe.

**Changing the meaning without changing the shape is the worst of all.** `price` going from cents to whole units breaks no test, changes no type, appears in no schema diff. It only produces wrong charges. A breaking change the machine cannot detect is the one that demands human review.

---

## Expand / contract, again

**Never change and remove in the same step.** The sequence is the schema's, under other names:

1. **Expand** — the new field/endpoint comes into existence, alongside the old one
2. **Accept both** — the implementation serves those who send the old and those who send the new
3. **Migrate the consumer** — and here is the difference: **you do not control this step.** In the schema, the one who migrates is you. Here it is someone else, on their own time.
4. **Deprecate** — announcement, deadline, notice in the contract itself
5. **Measure** — how many still use the old one? If nobody measured, nobody knows.
6. **Contract** — remove. Irreversible.

Step 5 is what separates deprecation from hope. **Removing an endpoint without knowing who calls it is not a decision, it is a bet** — and its cost is paid by someone who was not in the room. If the contract is internal and you measure the traffic, great. If it is public, you do not measure everything, and that changes the answer: a longer deadline, or never remove.

---

## Versioning: when, and what

Versions are not free: every live version is live code, live tests, bugs fixed twice. **Version when you cannot evolve without breaking** — not by default.

- **Additive** does not need a version. A new optional field goes into the current version.
- **Breaking** does: new version, old version alive for a declared period.
- **Two versions alive forever** is the worst of all worlds: you pay the maintenance of both and gain nothing. A new version without a death date for the old one is a fork.

What must always be declared in the contract, regardless of the versioning scheme:

- **what counts as breaking** in this contract (the table above changes from project to project — it depends on whether the consumer tolerates unknown fields or not)
- **how long the previous version lives**
- **how the consumer finds out it is going to die** — if they find out from a 404, you did not deprecate, you broke with zero days' notice

---

## Events break in silence

An asynchronous contract is a contract. The difference is that **when it breaks, nobody receives an error.**

A broken API returns 400: someone sees it, someone opens a ticket, someone fixes it. A broken event gets consumed, the `parse` fails or — worse — partially works, and the message goes to the dead-letter queue nobody looks at. The failure shows up weeks later, as missing data, and nobody connects one thing to the other.

That is why events need **more** discipline than APIs, not less:

- versioned and **explicit** schema. "It's just JSON" means the contract exists, but inside the heads of two different people.
- does the consumer tolerate unknown fields? If not, **every new field is breaking** — including the optional one.
- old messages are still in the queue during the deploy. The new consumer receives the old format. That is N-1, on the event side.
- **replay**: if the queue reprocesses history, the new consumer will see months-old formats. Can it handle them?

---

## Review signals

| 🔴 | Why |
|---|---|
| field removed or renamed in the same PR that adds the replacement | expand and contract together, no safety net |
| new required field in the request | breaks every existing client |
| new value in a response enum | falls into the `default` of someone who did not foresee it |
| tightened validation | rejects what used to pass |
| unit or semantics changed, type kept | breaks nothing — only produces wrong results |
| endpoint removed without a count of who still calls it | a bet, not a decision |
| new version without a death date for the old one | permanent fork |
| event schema changed without checking the queue and the replay | breaks in silence, shows up weeks later |

---

## Test

1. Does this break what the consumer had the right to assume?
2. If yes: who consumes it? **How many?** Do you have the number, or is it a hunch?
3. Are the change and the removal in the same step?
4. If it is a response enum: does the consumer have a safe `default`?
5. Did the meaning change without the shape changing? (no test will catch it)
6. If deprecated: is there a deadline, an announcement and a way to measure who still uses it?
7. If it is an event: does the consumer tolerate unknown fields? Does the queue hold messages in the old format? Can the replay handle it?
8. Is the consumer **external**? Then there is no rollback — only a deadline.
