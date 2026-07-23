---
key: verifiable-requirements
name: Verifiable Requirements
description: Writing atomic requirements and verifiable acceptance criteria. Atomicity, imperative voice, the testability test, the requirement × implementation boundary and Given-When-Then. Use when specifying, validating or deriving requirements.
layer: 2
neutral: true
owner: null
used_by: [frd, user-stories-epics, test-plan, task-extraction, design-review]
requires_capabilities: []
---

# Verifiable Requirements

Requirement and criterion are born in the same act: **you cannot write "the system shall X" without knowing how you would verify X.** If you cannot describe the test, you did not understand the requirement — discovering that now costs a sentence; discovering it in QA costs a sprint.

---

## The testability test

> **Can I write, in one sentence, what I would observe to say "this is done"?**

Cannot → it is not a requirement yet. It is an intention.

| ❌ Intention | ✅ Requirement |
|---|---|
| "The system shall be secure" | "The system shall lock the account after 5 incorrect PIN attempts in 10 minutes" |
| "Authentication shall be fast" | "The system shall complete local authentication in < 1s at the p95" |
| "The system shall work offline" | "The system shall authenticate without a connection for up to 7 days since the last revalidation" |
| "Good login experience" | "The system shall offer PIN as an alternative when biometrics fails 2 times" |

Adjectives are the signal: *secure, fast, easy, robust, intuitive, scalable*. Every adjective hides a number nobody decided.

---

## Atomicity

**One requirement, one verification.** If the test needs two "and"s, it is two requirements.

```
❌ RF-012: The system shall authenticate via biometrics and record the attempt in the audit trail.
```

That is two. One can pass and the other fail — and then RF-012 is "half done", which does not exist.

```
✓ RF-012: The system shall authenticate the user via the device's biometrics.
✓ RF-013: The system shall record every authentication attempt in the audit trail,
          with result and identity.
```

**Compound detector:**
- "and" joining two verbs → two requirements
- "or" that is not a user's alternative → two requirements
- a comma listing behaviors → N requirements
- "in addition", "also", "and furthermore" → it stopped being one

**Exception:** an "or" that is the user's choice is atomic. *"The system shall authenticate via biometrics or PIN, at the user's choice"* — one capability, one test with two paths.

---

## Requirement × implementation

The requirement says **what the system does**. The implementation says **how**. The line:

> If swapping the technology for an equivalent one changes the requirement, you wrote implementation.

| ❌ Implementation in disguise | ✅ Requirement |
|---|---|
| "The system shall use JWT with 7-day validity" | "The system shall keep the offline session valid for up to 7 days" |
| "The system shall store the hash in the Secure Enclave" | "The system shall prevent extraction of the local credential by another app" |
| "The system shall use Redis for session cache" | (nothing — there is no requirement here, only a technical decision) |
| "The system shall call POST /auth/revalidate on sync" | "The system shall revalidate identity against the server upon reconnecting" |

Swapping JWT for an opaque token does not change "the session is valid for 7 days". It changes the "how" — and the "how" belongs to the design, with a recorded trade-off.

**The test:** does the requirement survive swapping the technology? If not, it is implementation.

---

## Voice and form

```
The system shall <verb> <object> <condition>.
```

- **Imperative, explicit subject.** "The system shall..." — not "one should", not "it is necessary that", not "it would be nice".
- **"Shall" ≠ "may" ≠ "should".** Use "shall" for the mandatory. If it is optional, either it is not a requirement, or the optionality is the condition — and then write the condition.
- **Present tense, positive.** "The system shall reject invalid input" > "The system shall not accept invalid input".
- **No hidden subject.** "On authentication, validates the token" — who validates? The system? The client? The server?

---

## Acceptance criteria

Every requirement carries its own. Two forms, and the choice is not aesthetic:

**Given-When-Then** — when there is state and transition.

```gherkin
Given an unregistered device
When the user tries to authenticate
Then the system requires enrollment before granting access

Given a registered device and an offline session 8 days old
When the user tries to authenticate
Then the system requires online revalidation
```

**Verifiable list** — when it is a stateless property.

```
- Biometrics available → offers biometrics as default
- Biometrics fails 2×  → offers PIN
- Incorrect PIN 5× in 10min → locks for 30min
- Lock active → denies even with correct biometrics
```

**Cover the four dimensions.** A criterion of only the happy path is not a criterion, it is a demo:

| Dimension | Question |
|---|---|
| **Normal** | what happens when it works? |
| **Boundary** | and at the limit? (zero, one, maximum, expired, exactly on the deadline) |
| **Error** | and when the dependency goes down, the input is invalid, the permission is missing? |
| **State** | and the second time? concurrent? after a partial failure? |

`test-plan` will derive test cases from these criteria. A shallow criterion becomes a shallow test plan, which becomes a bug in production.

---

## Traceability

```
RF-001  ←── PRD Success Criterion
  ├── acceptance criterion
  ├── test case (test-plan derives from here)
  └── task (task-extraction derives from here)
```

- **Every requirement has a stable ID.** RF-001 is never reused — if the requirement dies, the ID dies with it. A recycled ID breaks every piece of history that pointed there.
- **Every requirement traces upward:** which PRD objective does it serve? A requirement that serves none is invented scope — point it out.
- **Every objective traces downward:** is there a requirement fulfilling it? An objective without a requirement is a promise without a plan.

**A requirement without an origin and an objective without a requirement are both defects.** List both explicitly.

---

## Anti-patterns

| Anti-pattern | How it shows up | Why it hurts |
|---|---|---|
| **Compound requirement** | "shall X and Y" | impossible to say whether it passed |
| **Adjective without a number** | "shall be fast" | nobody decided the number; someone will decide alone in the code |
| **Implementation in disguise** | "shall use JWT" | freezes the technical decision before the trade-off |
| **Happy path only** | criterion without error or boundary | QA discovers the other three |
| **Orphan requirement** | traces to no objective | scope nobody asked for |
| **Recycled ID** | RF-007 becomes something else | breaks history, tests and tasks |
| **"Should" / "it would be nice"** | undeclared optionality | nobody knows if it is mandatory |
| **Hidden subject** | "validates the token" | who validates? |

---

## Test before delivering

1. Does each requirement have a test I can describe in one sentence?
2. Does any have an "and" joining verbs? (then it is two)
3. Would any survive swapping the technology? If not, it is implementation.
4. Did every adjective become a number?
5. Does every criterion cover normal, boundary, error and state?
6. Does every requirement trace to a PRD objective?
7. Does every PRD objective have at least one requirement?
8. Was any ID reused?
