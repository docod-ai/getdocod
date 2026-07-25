---
name: handoff
description: Compact the CURRENT SESSION into a thin handoff for the next one — session-only context and pointers, never duplicating what artifacts already record.
---

# Session Handoff

The method's state lives in artifacts: status derives it, the report shows it,
approvals and logs record it. A handoff that restates any of that is drift
scheduled for tomorrow. What artifacts CANNOT hold is the session: the thread
of reasoning mid-flight, the options weighed aloud and not yet recorded, what
the human said informally, where attention should land first.

## The rule

**Reference, never duplicate.** Anything already in an artifact is a path, not
a paragraph: "see docs/quality/impact/0006 §3", never a summary of it. If you
catch yourself summarizing a document, stop — link it.

## What goes in

- Where we are, in three lines (then: "run `node .docod/docod.mjs status` —
  it is the truth, this note is the color").
- The open thread: what was being decided, options on the table, leanings
  voiced but not recorded. If a leaning matters, say whose it was.
- Exact pointers: artifacts touched (paths), pending approvals, questions
  awaiting the human.
- Suggested next actions, each with the agent/command that owns it.
- Redact secrets and personal data. Always.

## What stays out

Artifact content (linked), history the git log already tells, praise, and
anything the next session can derive by running status or verify.
