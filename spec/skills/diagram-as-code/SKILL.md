---
key: diagram-as-code
name: Diagram as Code
description: Turning design into a figure that survives. Choosing the type by the question it answers, zoom level, node limit, labeled edges, and why exported images rot. Use when drawing any diagram inside a design, operations or analysis document.
layer: 2
neutral: true
owner: null
used_by: [system-design, data-design, api-contract, observability, runbook, postmortem, task-extraction]
requires_capabilities: []
---

# Diagram as Code

**A diagram is code, not an image.**

The rule that decides everything else. An exported image rots: it does not show up in diffs, nobody reviews it in a PR, the source gets lost, and in six months it shows an architecture that no longer exists — with the authority of a drawing. **A wrong diagram is worse than none**, because none forces you to read the text, and wrong convinces.

Diagram as code lives in the repository, appears in the diff, breaks in review. It ages together with everything else or gets corrected — either way, it does not lie.

Seven agents draw. If each has its own notion of a "good diagram", the project has seven visual languages and no reading.

---

## The diagram is born **inside** the document

There is no diagrams document. The ER lives in `data-design`; the context diagram lives in `system-design`; the sequence diagram lives in `api-contract`; the timeline lives in `postmortem`.

**A diagram without surrounding text is a riddle.** And a diagram in a file separate from the text it explains is the guarantee that the two will diverge — because whoever edits the text does not open the other file.

Every diagram comes with a short caption in prose: **what it shows and what it does not show.** The second half is what keeps the reader from concluding too much.

---

## The question defines the type

**This is the main judgment call.** The wrong diagram for the question misleads with conviction.

| If the question is… | Use | Do not use |
|---|---|---|
| "Who uses the system and what does it talk to?" | context (C4 level 1) | sequence |
| "What are the internal pieces and how do they connect?" | container (C4 level 2) | ER |
| "What happens when the client does X?" | sequence | flowchart |
| "How does the data relate?" | ER | C4 |
| "What is the decision rule?" | flowchart | sequence |
| "What states does the entity go through?" | state machine | flowchart |
| "What runs where?" | deployment | container |

The most common confusion is **sequence × flowchart**. A sequence diagram shows **who talks to whom, over time** — the axis is the participant. A flowchart shows **the path of the decision** — the axis is the condition. Using a flowchart to show interaction between services produces a figure that looks right and answers nothing.

## Zoom: never mix levels

1. **Context** — the system as a black box, actors and external systems. Reader: anyone.
2. **Container** — applications, databases, queues. Reader: engineering and operations.
3. **Component** — inside a container. Reader: whoever will implement.
4. **Code** — rarely worth maintaining by hand. Generate it from the code or do not do it.

**Mixing levels is the most common mistake**: the diagram that has "Customer", "Orders API" and "OrderValidator class" together serves none of the three readers. Each of them needed a different level, and all of them read the same confusing drawing.

---

## Limits

- **~10 nodes.** Beyond that, break into levels. The "overall architecture" diagram with 40 boxes is read by no one — it exists for the wall, not for the reader.
- **One message per diagram.** If it needs a legend with 12 items, it is two diagrams.
- **Every edge labeled**, with protocol **and** intent: "HTTP/JSON — creates order". A bare arrow says a connection exists and hides what it is — which is precisely the information.
- **Single direction.** Top→bottom or left→right, never mixed in the same diagram.
- **Color is never the sole carrier of meaning.** It vanishes in print, vanishes for those who cannot distinguish it, vanishes in the diff. Use shape, label or grouping alongside.

---

## Coherence with the text is an obligation

**Every element of the diagram exists in the written design, with the same name.**

A name that diverges between figure and text ("Orders" in the diagram, "Order Service" in the paragraph) is how the doubt of whether they are the same thing is born — and the answer, six months later, is that nobody knows.

**Divergence between diagram and text is a defect.** When you find one, **point it out** instead of silently choosing which of the two is right. Choosing in silence is where the diagram becomes a second source of truth, and from then on two versions of the architecture coexist without anyone noticing.

If the source design is ambiguous — two components with the same name, a flow without a destination — **do not invent**. Produce the partial diagram, mark the uncertain part, list the question. A diagram that fills the gap with a guess turns doubt into fact.

---

## Format

Any diagram-as-text language works, as long as it:

- lives in the repository, next to the document
- shows up legibly in a diff
- renders where the team reads

**The concrete language is the project's or the adapter's choice, not the method's.** What the method requires is that it be text. An image without versioned source is the only forbidden format — and "I exported the PNG and dropped it on the wiki" is exactly that case.

---

## Anti-patterns

| ❌ | Why |
|---|---|
| "overall architecture" with 40 boxes | nobody reads it; it exists for the wall |
| unlabeled arrows | hides the information that matters |
| mixed levels in the same diagram | serves no reader |
| color as the only meaning | vanishes in print and in the diff |
| exported PNG without versioned source | rots and cannot be reviewed |
| diagram that contradicts the text beside it | two truths, neither trustworthy |
| flowchart showing interaction between services | wrong question, convincing figure |
| diagram without a prose caption | a riddle |

---

## Test

1. What **question** does this diagram answer? Is the type right for it?
2. Who is the reader — executive, new engineer, implementer, operator? Is the zoom theirs?
3. More than ~10 nodes? Then break it up.
4. Does every edge have protocol and intent?
5. Does every element exist in the text, with the same name?
6. Does any element of the diagram contradict the text? Is it pointed out, or was it chosen in silence?
7. Is color carrying meaning alone?
8. Is there a caption saying what it shows **and what it does not show**?
9. Did I invent anything the design does not say?
