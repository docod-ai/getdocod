---
key: measurable-goals
name: Measurable Goals
description: Turning a vague objective into a verifiable goal. Baseline, leading vs lagging, percentile, window, counter-metric and Goodhart. Use when defining a KPI, acceptance criterion, SLO or test threshold.
layer: 2
neutral: true
owner: null
used_by: [prd, business-case, frd, observability, test-plan]
requires_capabilities: []
---

# Measurable Goals

Five agents define goals. This exists so they define them the same way.

**The rule that cuts across everything:** a goal without a baseline, a number and a window is not a goal — it is a wish dressed up as a commitment.

```
"improve performance"                       ✗ wish
"reduce latency"                            ✗ wish with a verb
"p95 < 300ms"                               ✗ goal without baseline or window
"p95 from 1.2s → 300ms in 90 days"          ✓ goal
```

---

## The four elements

Every goal has all four. Missing one, it is not a goal.

| Element | Why | Without it |
|---|---|---|
| **Baseline** | you do not know if you improved if you do not know where you were | "+15%" over what? |
| **Number** | it is what makes it verifiable | "improve" is never false |
| **Window** | defines when to hold accountable | a goal without a deadline never comes due |
| **Measurement point** | where you measure changes the number | measuring at the server hides the network |

**Baseline first, always.** If nobody measured, the first goal is to measure. A guessed goal over a nonexistent baseline is debt: either it is too easy and changes nothing, or impossible and the team learns to ignore goals.

---

## Leading vs lagging

| | Lagging | Leading |
|---|---|---|
| Measures | the outcome | the behavior that causes the outcome |
| Example | revenue, churn, NPS | 7-day activation, time to first value |
| Good for | proving it worked | steering while it happens |
| Bad because | arrives too late to act | may not cause the outcome you think |

**Use both.** Only lagging: you discover the failure at the end of the quarter. Only leading: you optimize a proxy and the revenue does not come.

The question that separates them: *"if this number improves, does the outcome follow — or will I only know later?"*

---

## Vanity metric vs actionable

A vanity metric **always goes up and decides nothing**.

| ❌ Vanity | ✅ Actionable | Why |
|---|---|---|
| total pageviews | activation rate | totals only grow; rates show quality |
| registered users | 7-day active users | signup is not usage |
| lines of code | time to deploy | LOC is cost, not value |
| tickets closed | p90 resolution time | closing fast and badly still closes tickets |
| downloads | D30 retention | downloading is not using |

**The vanity test:** if this number got worse, would anyone make a different decision? If not, it is vanity — do not put it in the document.

---

## Averages lie. Use percentiles.

```
Latencies: 100ms · 100ms · 100ms · 100ms · 8000ms
Average: 1,680ms   ← nobody felt this
p95:     8,000ms   ← what 1 in 20 users felt
```

- **p50** — the typical experience
- **p95** — the tail that generates tickets
- **p99** — the tail that generates incidents
- **average** — almost never useful; hides exactly what hurts

Rule: for latency, errors and size, **always percentiles**. Average only for volume and cost, where the total is what matters.

---

## Counter-metric

Every goal has a way of being hit by cheating. The counter-metric is what **must not get worse** while you chase the goal.

| Goal | How to cheat | Counter-metric |
|---|---|---|
| reduce support response time | close tickets without resolving | reopen rate |
| increase signups | remove email validation | 7-day activation |
| reduce p95 latency | kill slow requests with a timeout | error rate |
| increase test coverage | tests that assert nothing | bugs escaped to production |
| speed up delivery | skip review | incidents per release |

**A goal without a counter-metric is an invitation to the shortcut.** And the shortcut is not bad faith: it is a rational response to a badly designed incentive.

---

## Goodhart's law

> When a measure becomes a target, it ceases to be a good measure.

It is not academic trivia — it is what happens to every metric that gets enforced. Mitigations:

1. **Counter-metric** — makes the shortcut visible
2. **Composite metric** — harder to game than a single number
3. **Rotation** — if a metric became a target and saturated, it did its job; swap it
4. **Range goal, not maximum** — "between 60% and 80%" resists better than "above 60%", which becomes 95% at the expense of something else

Before closing any goal, ask: **how would I hit this without delivering any value?** The answer is the counter-metric.

---

## Realistic goal

The target sits between two limits, and both must be known:

```
   what the architecture delivers today  ──┐
                                           ├──  the target is here
   what the user tolerates               ──┘
```

- **Above what the architecture delivers** → constant alarms, and the team learns to ignore alarms. An aspirational goal is a dead goal.
- **Below what the user tolerates** → you hit the goal and the customer leaves, satisfied with the number.

Without measuring the current state, you have no floor. Without knowing what the user feels, no ceiling. A goal defined without both is a guess with authority.

---

## Writing it

```markdown
| Objective | Baseline | Goal | Window | Measurement | Counter-metric |
|---|---|---|---|---|---|
| Speed up checkout | p95 = 4.2s | p95 < 1.5s | 90 days | edge (not server) | error rate < 0.5% |
| Increase activation | 34% in 7d | 50% in 7d | Q3 | `first_value` event | D30 churn stable |
```

**The measurement point matters and is almost always omitted.** Measuring at the server hides network, DNS and cold starts. Measuring at the client is more honest and the number is worse — and the worse number is the real one.

**If there is no baseline:** write `baseline: not measured` and make that the first goal. Do not invent the baseline to be able to have the pretty goal.

---

## Test before delivering

1. Does every goal have baseline, number, window and measurement point?
2. If the baseline does not exist, is that written down — or did I invent one?
3. Do I use percentiles where it is latency/errors, or did I fall back to the average?
4. Does each goal have a counter-metric?
5. How would I hit this goal without delivering value? Is that covered?
6. Is the target between what the architecture delivers and what the user tolerates — and do I know both?
7. Does any metric only go up? (then it is vanity — remove it)
