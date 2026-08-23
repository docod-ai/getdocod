# Contributing to DOCOD

DOCOD welcomes contributions in:

- agent contracts;
- artifact definitions;
- validators;
- adapters;
- skills;
- runtime behavior;
- documentation;
- diagnostic rules;
- examples;
- tests based on real failures.

Before proposing a change, read the maintainer internals and the design principles below.

The project values changes that:

- are grounded in a real failure or use case;
- preserve layer neutrality;
- include a validator for new cross-file relationships;
- avoid hidden state;
- surface uncertainty honestly;
- keep human authority explicit;
- make the method stricter without making it noisier.

A new rule without a failing case is usually a theory.

A new relationship without a validator is usually future drift.

---

## Design principles

DOCOD is built around a small set of principles. Five of them lead the README; the full set lives here.

### 1. Derived, never maintained

State is recomputed from files.

A manually maintained index would eventually disagree with the repository.

### 2. Never hide invalidity

Changed approvals stay visible.

Stale relationships stay visible.

Unknowns stay unknown.

### 3. One artifact, one owner

Exceptions are narrow, declared and mechanically constrained.

### 4. Humans retain authority

Agents propose, produce, execute and verify.

Humans approve, accept risk and decide direction.

### 5. Machines check what machines can check

Computable claims are not left to agent confidence.

### 6. The verifier is not the producer

Self-review is not independence.

### 7. Every reference needs a watcher

A cross-file relationship without validation is future drift.

### 8. Missing capability is not permission to improvise

Unavailable verification becomes `NOT VERIFIED`.

### 9. Ambiguity is surfaced, never guessed

A resolver may become better at recognizing a source.

It must never become better at pretending ambiguity does not exist.

### 10. Judgment remains judgment

Automation performs the mechanical work.

Humans decide whether a change is cosmetic, acceptable or worth the risk.

### 11. Vocabulary comes before enforcement

A failure must first become expressible, classifiable and recordable.

Only then can it become mechanically detectable.

## The bundle's own config-eval

The method now asks instances to regression-test their agent configuration
(the `evals` artifact: a rules change ships with the suite's run attached).
The bundle holds itself to the same law, and its suite already exists — by
name, now, not just by habit:

- `python3 validate-layers.py` must end `0 warning(s)` after ANY change to
  spec/, agents/, rules/, adapters/ or the conductor contract;
- the smoke pattern must stay green after any runtime or installer change:
  install into a scratch directory, run the governance cycle
  (prd → approve → amend → verify fails explained → rebless → verify ok),
  the queue battery (concurrent `question add`, corrupted-queue refusal),
  and `observe` over a bands fixture;
- every fix lands with its bug PLANTED first: the planted case must fail on
  the old code and pass on the new, in the same change. A check that was
  never seen failing has never been tested.

A change to the specs or agents is a configuration change, and configuration
steers the machine — it gets the regression testing code gets. That sentence
is the whole reason the `evals` artifact exists; it applies to this repo
first.
