---
key: financial-modeling
name: Financial Modeling
description: Formulas, conventions and pitfalls of ROI, payback, TCO and NPV. Use when you need to justify, compare or project the cost and return of a technical decision.
layer: 2
neutral: true
owner: null
used_by: [business-case, tradeoffs, project-management, infrastructure-design]
requires_capabilities: [calculator]
---

# Financial Modeling

Five agents do money math. This exists so they do the same math.

**Rule that cuts across everything:** a number without a declared premise is a guess with authority. Every estimate here carries where it came from.

---

## The four calculations

### ROI — return on investment

```
ROI = (total_gain − total_cost) / total_cost
```

- Express it as % and **always with a window**: "180% ROI over 24 months". ROI without a timeframe means nothing — 180% over 2 years and over 20 years are opposite decisions.
- `total_gain` and `total_cost` cover the **same window**. Comparing 3 years of gain with 1 year of cost is the most common mistake and the easiest to hide.
- Negative ROI is a legitimate result. If the math came out negative, write it negative.

### Payback — how long until it pays for itself

```
payback = initial_investment / net_gain_per_period
```

- Use it when the decision-maker asks "when does it come back?". It is the metric an executive understands without explanation.
- **It ignores what comes after break-even.** A project with a 6-month payback and an 8-month useful life loses to one with 18 months and a 10-year life. Never use payback alone to choose.
- Gain per period is rarely constant. If it is not, compute the cumulative month by month until it crosses zero — do not divide by the average.

### TCO — total cost of ownership

```
TCO = acquisition + implementation + operations×N + maintenance×N + training + exit
```

TCO exists because the purchase price is the smallest part. **What is almost always missing:**

- **Ongoing maintenance** — the biggest omission. Software does not stand still: dependencies break, CVEs appear, third-party APIs change.
- **Exit cost** — migrating away, exporting data, terminating the contract. Lock-in has a price and it only shows up at the end.
- **Team time** — an engineer's hour is a cost. If the "build in-house" alternative has no hours × cost/hour, it is falsely cheap.
- **Training and ramp-up** — productivity drops before it rises.
- **Opportunity cost** — what the team did NOT do while doing this. It is real and it is the most forgotten.

Declare the `N` (horizon). TCO without a horizon is incomparable.

### NPV — net present value

```
NPV = Σ [ cash_flow_t / (1 + rate)^t ] − initial_investment
```

- Use it when the horizon exceeds ~2 years or when comparing options with outlays at different times.
- **The discount rate is a premise, not a fact.** Declare which one you used and why. Sensitivity: show the NPV with the rate ±5pp — if the sign flips, the decision is not robust and that is the most important information in the document.
- NPV > 0 means "better than the alternative embedded in the rate". It does not mean "good".

---

## Pitfalls

| Pitfall | How it shows up | Correction |
|---|---|---|
| **Different windows** | 3 years of gain vs 1 year of cost | same window on both sides, declared |
| **Savings as revenue** | "saves 200h/month = R$ 40k in revenue" | savings reduce cost; they only become cash if the hours are reallocated or cut. Say which. |
| **Zero opportunity cost** | "the team is already paid, so it's free" | the team would do something else. Name what stopped being done. |
| **Sunk cost** | "we already spent R$ 500k, we can't stop" | money spent does not come back and does not enter the decision. Only future cost counts. |
| **TCO without maintenance** | only the license/build price | maintenance × horizon, always |
| **Hidden discount rate** | NPV without stating the rate | declare the rate and show the sensitivity |
| **Single scenario** | one number, no range | pessimistic / likely / optimistic. Always three. |
| **False precision** | "ROI of 187.3%" | the premise has 30% error; the result cannot have 3 decimal places. Round to the real uncertainty. |
| **"Do nothing" at zero cost** | the baseline alternative does not appear in the table | doing nothing has a cost: the problem continues. Quantify it. |

---

## Output conventions

**Every premise is declared and traceable.**

```markdown
| Premise | Value | Source | Confidence |
|---|---|---|---|
| Engineering cost/hour | R$ 120 | team average, HR | high |
| Hours saved/month | 80 | measured over 3 sprints | medium |
| Adoption rate at 6 months | 60% | ⚠ assumption — no basis | low |
| Discount rate | 12% p.a. | cost of capital stated by finance | high |
```

A low-confidence premise that dominates the result is the most important finding in the document. Say it to their face: *"the ROI depends entirely on an adoption rate that nobody measured."*

**Always three scenarios.**

```markdown
| Scenario | Premise that changes | ROI 24m | Payback |
|---|---|---|---|
| Pessimistic | adoption 30% | 40% | 19 months |
| Likely | adoption 60% | 180% | 9 months |
| Optimistic | adoption 85% | 310% | 6 months |
```

A single number conveys certainty you do not have.

**Round to the uncertainty.** If the premise is worth ±30%, the result is "approximately 180%", not "187.3%".

---

## When the number does not exist

Do not invent it. The three honest outputs, in order of preference:

1. **Range with a declared basis** — "between R$ 80k and R$ 150k, per benchmarks from X and Y"
2. **Marked assumption** — "⚠ assuming 60% adoption; no measured basis. If it is 30%, ROI drops to 40%."
3. **Open question** — "there is no cost/hour data. Without it, the comparison with 'build in-house' is not possible."

An invented number becomes a target. An invented target becomes accountability. A document with an honest gap is better than a document with a pretty, false number.

---

## Test before delivering

1. Does every premise table have source and confidence?
2. Do gain and cost cover the same window, and is it written down?
3. Does the TCO include maintenance, exit cost and opportunity cost?
4. Does "do nothing" have a quantified cost?
5. Are there three scenarios, or only the one you wanted to show?
6. If the weakest premise varies 2×, does the recommendation change? Is that stated?
7. Are the decimal places compatible with the premise's uncertainty?
