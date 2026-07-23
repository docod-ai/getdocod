---
key: requirements-elicitation
name: Requirements Elicitation
description: The craft of extracting requirements from people. Peeling the solution back to the need, detecting the implicit and the unsaid, resolving ambiguity, finding contradictions, checking completeness. Use when interviewing someone to produce any requirements document.
layer: 2
neutral: true
owner: null
used_by: [business-case, prd, frd, user-stories-epics]
requires_capabilities: []
---

# Requirements Elicitation

Four agents interview people. This is the craft.

**A distinction that prevents confusion:** this skill is about **extracting** requirements from a person. `verifiable-requirements` is about **writing** what was extracted. One is the interview, the other is the writing. You need both, in this order.

---

## The rule that governs everything

> **People tell you the solution, not the problem.**

*"I need an export-to-CSV button."*
That is a solution. The requirement is behind it: **why** do you need to export? *"To open it in Excel and do the month-end close."* Ah — the requirement is **closing the month**, and CSV is one path. Maybe the right thing is a ready-made report. Maybe a direct integration. Maybe CSV after all.

If you write down the solution, you deliver the button and the problem continues.

**The probe:** *"What would you do with it once you had it?"* — three times, if needed. You stop when the answer becomes a business objective, not a screen.

**The caution:** peeling too far is also a mistake. If you arrive at "I want the company to be profitable", you overshot. Stop at the level where a product decision still exists.

---

## The implicit requirement

The most dangerous is not what the person does not know. It is **what they know so well they do not think to say it.**

> *"Obviously it works offline, we work on a factory floor."*

Obvious to them. Invisible to you. And if you do not ask, it becomes a requirement discovered in QA — or worse, in production.

**Where the implicit hides:**

| Category | The question that reveals it |
|---|---|
| Usage context | "Where is the person when they use this? Is there network? Are both hands free?" |
| Volume | "How many per day? And at the monthly peak?" |
| Who else | "Besides you, who touches this?" |
| What already exists | "How do you solve this today?" ← reveals the real process |
| Regulation | "Does anyone audit this? Do you need to prove it later?" |
| Consequence of failure | "If it goes wrong, what happens?" ← reveals real criticality |

**"How do you do it today?" is the highest-yield question of all.** The current process carries dozens of implicit requirements nobody would ever state — and it reveals the workarounds, which are requirements disguised as habit.

---

## The negative space

What was **not** said matters as much as what was.

If the person described five flows and none has an error path, the gap is not theirs — it is yours, for not having asked. Sweep the negative before closing:

- Described success, and failure?
- Described creating, and deleting? (almost always forgotten)
- Described the user, and the admin?
- Described the normal case, and the limit?
- Described the first time, and the second?
- Talked about data coming in, and data going out? retention? deletion?

Every "no" is a candidate requirement. Not all of them go in — but the decision to leave one out is a decision, and it must be made, not forgotten.

---

## Ambiguity

A vague word is not imprecise language: it is **a decision nobody has made yet**. If you let it through, someone decides alone, in the code.

| Word | What it hides | The question |
|---|---|---|
| fast | a number | "is fast under 1s, or under 5s?" |
| secure | a threat | "secure against whom? what could that person do?" |
| simple | a comparison | "simpler than what?" |
| many | a volume | "is many 100 or 100 thousand?" |
| sometimes | a frequency or condition | "sometimes when? what is the condition?" |
| if necessary | a decision rule | "who decides if it is necessary, and based on what?" |
| etc. / among others | an incomplete list | "which others? can you list them all?" |
| should | optionality | "is it mandatory or desirable?" |
| better | a criterion | "better at what? compared to what?" |

**"Etc." is the most treacherous.** It signals that the person did not finish thinking and you accepted it. Never let it through.

---

## Contradiction

Requirements contradict each other and nobody notices, because they come from different people or different moments.

**Where to look:**

- **Latency × consistency** — "response in 100ms" + "always the freshest data, replicated across 3 regions"
- **Offline × real time** — "works without network" + "notifies instantly"
- **Simplicity × control** — "one click" + "the user configures everything"
- **Privacy × personalization** — "we store nothing" + "remembers preferences"
- **Audit × right to be forgotten** — "immutable log of everything" + "erase the data on request"
- **Cost × availability** — "cheap infra" + "99.99%"

When you find one: **do not choose in silence.** Present the contradiction and let the person decide. *"The two together don't add up: either accept 500ms, or accept data up to 2s stale. Which hurts less?"*

A contradiction resolved by the agent without saying so is a decision made by someone who had no authority.

---

## Completeness

Before closing, check the categories everyone forgets:

**Non-functional** *(almost never stated spontaneously)*
- Performance: latency (percentile!), throughput, peak volume
- Availability: how much downtime hurts? is there a customer SLA?
- Security: who can do what? sensitive data? audit?
- Privacy: personal data? legal basis? retention? deletion?
- Accessibility: WCAG? screen reader? keyboard?
- Compatibility: browser, API version, device

**Lifecycle** *(always forgotten)*
- Create, read, update — and **delete**?
- First run, and the migration of what already exists?
- And when it gets shut down?

**Boundary**
- Who else consumes this? Is there a contract?
- What happens when the dependency goes down?

*References: ISO/IEC/IEEE 29148 (successor to IEEE 830), Volere, INVEST.*

---

## Interview anti-patterns

| Anti-pattern | Example | Why it hurts |
|---|---|---|
| **Leading question** | "You want email notifications, right?" | you get your own answer back |
| **Question shaped like a solution** | "Do you prefer a modal or a drawer?" | skipped the requirement and went to design |
| **Question that changes nothing** | "What's your favorite button color?" | wastes attention; the next question gets answered on autopilot |
| **Accepting the adjective** | "— it has to be fast. — noted." | you just outsourced the decision to the code |
| **Asking what can be researched** | "how much does the X license cost?" | it is public; look it up |
| **Asking what was already answered** | repeating what is in `decisions/` | teaches that the system does not keep what it is told |
| **Stacking questions** | 10 questions at once | they answer the first 3 and guess the rest |
| **Accepting "obvious"** | "— that's obvious. — ok." | obvious to them ≠ written down |

---

## When the person does not know

It happens, and it is information — not failure.

1. **Offer a range instead of an open field.** "Is it closer to 100 or to 100 thousand?" — almost everyone knows the order of magnitude even without knowing the number.
2. **Offer the default and ask for objection.** "I'll assume 5 attempts before locking. Objection?" — it is easier to disagree than to create.
3. **Mark the assumption and move on.** A declared assumption is honest; it becomes an open question in the document.
4. **Never invent.** An invented number becomes a target, and an invented target becomes accountability.

If the answer does not exist because nobody measured, **measuring becomes the first requirement.**

---

## Test before closing the interview

1. Did I write down a solution or a need? (if the person said "button", did I peel it back?)
2. Did I ask "how do you do it today?"
3. Did I sweep the negative space — errors, deletion, limits, the second time?
4. Is any adjective left without a number? any "etc."?
5. Did I look for contradictions between what was said at different moments?
6. Did I cover non-functional, lifecycle and boundary — or only the happy path?
7. Did I ask something that could be researched or that was already in `decisions/`?
8. Is what remained unanswered marked as an assumption — or did I invent it?
