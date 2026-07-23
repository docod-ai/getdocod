---
key: architecture-boundaries
name: Architecture Boundaries
description: Where one thing ends and another begins. Coupling and cohesion, dependency direction, what decides the boundary, Conway's law, and why distributed is not better. Use when drawing, following, or judging an architectural boundary.
layer: 2
neutral: true
owner: null
used_by: [system-design, design-review, data-design, infrastructure-design]
requires_capabilities: []
---

# Architecture Boundaries

Architecture is deciding **where one thing ends and another begins**. Everything else is detail inside the boundary.

Four agents touch this line: one draws it (`system-design`), two follow it (`data-design` in the schema, `infrastructure-design` in the topology) and one judges it (`design-review`). If each has its own notion of boundary, the system has four architectures.

---

## What decides a boundary

**Not the org chart. Not the layer. Not the database.**

The boundary sits where things **change for different reasons**.

| Sign that it is a boundary | Sign that it is not |
|---|---|
| changes for a different reason | always changes together |
| has a different owner | the same person touches both |
| has a different rhythm (one changes every week, the other once a year) | same rhythm |
| independent failure is acceptable | if one goes down, the other is useless |
| scales along a different axis | they scale together |

**The test:** *if I change A, do I need to change B in the same sprint?* If yes, they are not two — they are one, with an imaginary line down the middle. And the imaginary line has a cost: network, serialization, coordinated deploys, distributed debugging.

---

## Cohesion and coupling

```
Cohesion  HIGH → what changes together stays together
Coupling  LOW  → what changes separately stays separate
```

They are the same sentence said from two sides. And the classic mistake is optimizing one while ignoring the other:

- **Cohesion without looking at coupling** → the monolith where everything is cohesive because everything knows everything
- **Coupling without looking at cohesion** → the distributed system where every business change touches 6 services

**Cohesion by what:** grouping by *domain* (everything about orders together) tends to get it right. Grouping by *technical type* (all controllers together, all models together) tends to get it wrong — because change is business-driven, and it cuts across the types.

```
❌ by layer            ✓ by domain
   controllers/           orders/
     order.py               api.py
     payment.py             model.py
   models/                  service.py
     order.py             payments/
     payment.py             api.py
                            model.py
```

On the left, changing "order" touches 2 folders. On the right, 1.

---

## Dependency direction

> **The stable does not depend on the volatile.**

If A depends on B, every change in B threatens A. So: **B must be more stable than A.**

```
✓ business rule  →  persistence abstraction
✗ business rule  →  specific ORM

  the rule lasts 10 years; the ORM lasts 3.
```

**Stability is not quality — it is the number of people who depend on you.** Many dependents = you cannot change = you are stable, whether you like it or not. That is why what many people use needs to be well thought out: it has lost the right to change.

**When the dependency points the wrong way**, invert it with an abstraction declared by the one who depends:

```
❌ Order → PostgresRepo
✓ Order → OrderRepo (interface, in the domain)
              ↑
           PostgresRepo (infra implements)
```

The arrow now points inward. The domain does not know Postgres exists.

**And beware of the cycle.** A → B → A means they are a single component with two names. Either merge them, or break the dependency.

---

## Conway's law

> The architecture of the system mirrors the communication structure of those who build it.

It is not a curse — it is an observation. Two teams that do not talk will produce two modules with poor integration, **no matter what the diagram says**.

Practical consequences:

- **A boundary that cuts across a team works badly.** If components A and B need to change together every week and the teams are different, either the boundary is wrong or the team is.
- **The inverse maneuver:** if you want an architecture, organize the team that way. It is cheaper to change the team than to fight the law.
- **The warning sign:** a component that requires a meeting between two teams every time it changes. The boundary is in the wrong place.

---

## Distributed is not better

Splitting into services **adds** problems, it does not remove them:

| Gain | Pay |
|---|---|
| independent deploys | network: latency, timeouts, retries, partial failure |
| independent scaling | consistency: distributed transactions do not come free |
| isolated failure | debugging: distributed traces, correlation, "where did it stop?" |
| independent teams | operations: N deploys, N monitors, N on-calls |

**The well-modularized monolith is the default choice.** It has the same logical boundaries and none of the costs. Distribute when the gain is concrete and named — "scale checkout separately because it is 80% of the load" is a reason; "microservices are modern" is not.

**Rule of thumb:** if you cannot draw the boundary inside the monolith, distributing will not create the boundary — it will create a distributed monolith, which is the worst of both.

---

## Boundary and data

**The hardest boundary of all is shared data.**

Two services that write to the same table **are not two services**. They are one, with two deploys — and with none of the guarantees the monolith would give.

```
❌ Order  ─┐
           ├→ [ orders table ]     ← this is ONE component
   Invoice ─┘

✓ Order  → [ orders ]
   Invoice → [ invoices ]  ─── reads orders via contract, not via table
```

`data-design` follows this boundary: **schema per owner**, never per convenience. If the data boundary does not match the service boundary, the service boundary is fictional.

---

## Anti-patterns

| Anti-pattern | How it shows up | Why it hurts |
|---|---|---|
| **Boundary by layer** | controllers/ models/ services/ | a business change cuts across all of them |
| **Boundary by org chart** | one service per team, with no domain reason | a reorg breaks the architecture |
| **Shared database** | 2 services, 1 table | they are not 2 services |
| **Inverted dependency** | domain imports ORM | the rule dies when the ORM changes |
| **Cycle** | A → B → A | they are one, with two names |
| **Distributed for no reason** | microservice just because | pays everything, gains nothing |
| **Component that needs a meeting** | two teams change together every time | boundary in the wrong place |
| **Anemic layer** | service that only forwards to the repo | boundary with no purpose |

---

## Test before closing the boundary

1. Do A and B change for different reasons? If they always change together, they are one.
2. Who depends on whom — and is the depended-on more stable than the dependent?
3. Is there a cycle? (then they are not two)
4. Do two components write to the same data? (then they are not two)
5. Does the boundary cut across a team? If so, it will hurt — either it is wrong, or the team is.
6. If I distributed: what is the concrete gain, and does it pay for network + consistency + operations?
7. Can I draw this boundary inside a monolith? If not, distributing will not save it.
8. Did I group by domain or by technical type?
