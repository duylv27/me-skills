---
name: util-requirements
description: >
  Use this skill to clarify ambiguous requirements, tickets, user stories, or specifications.
  Triggers include: "clarify this", "what does X mean", "I'm not sure what is expected",
  "help me understand the requirement", "this ticket is vague", "what is the scope",
  "what are the acceptance criteria", or any request to break down or question a feature
  description before implementation begins.
---

# Requirements Clarification Skill

Help developers surface hidden assumptions, resolve ambiguity, and define clear boundaries
before writing a single line of code. Produces a structured summary that can be pasted into
a ticket or shared with stakeholders.

## Core Principle

> Never start implementing against an unclear requirement.
> A 5-minute clarification saves hours of rework.

---

## Step 1 — Read and Restate

Restate the requirement in your own words to confirm understanding before asking anything.
If your restatement is already wrong, that gap is the first thing to fix.

---

## Step 2 — Ask Targeted Questions by Category

Group questions into themes. Do not ask open-ended vague questions like "can you tell me more?".
Limit to the most impactful questions — prioritize ruthlessly.

### Business Intent
- What problem does this solve for the user or business?
- What is the measurable outcome of success?
- Who is the primary actor (end user, admin, system)?

### Scope Boundaries
- What is explicitly OUT of scope?
- Does this replace existing behavior or add to it?
- Which systems or services are affected?

### Input & Output
- What are the valid input formats, ranges, or types?
- What should happen with invalid, empty, or null inputs?
- What does a successful response look like (status, payload, side effects)?

### Error & Edge Cases
- What should happen when a dependency (DB, API, queue) is unavailable?
- Are there race conditions or concurrent access scenarios to consider?
- What are the retry/fallback expectations?

### Non-Functional Requirements
- Are there SLA or latency targets?
- Are there security or authorization constraints?
- Any compliance, audit, or data retention rules?

### Acceptance Criteria
- How will QA verify this is done?
- Are there specific test scenarios that must pass?
- Is there a definition of done beyond "it works"?

---

## Step 3 — Ask Before Assuming

**Do NOT make assumptions.** If anything is unclear after the restatement, ask for it explicitly.

- Prefer a short, focused follow-up question over silently filling in a gap
- Ask one round of questions at a time — wait for answers before proceeding
- If the user cannot answer, flag it as an **open question** in the summary (never resolve it silently)

---

## Step 4 — Produce a Structured Summary

After questions are answered, output a summary in this format:

```
## Requirement Summary

**Goal:** [one sentence]
**Actor:** [who triggers this]
**Scope:** [what is in / out]
**Inputs:** [types, constraints]
**Outputs:** [format, side effects]
**Error handling:** [expected behavior]
**Acceptance criteria:** [bullet list]
**Open questions:** [anything still unresolved — do NOT assume an answer]
```

---

## Anti-Patterns to Avoid

- Do NOT ask more than 6-8 questions in one pass — pick the most impactful
- Do NOT ask rhetorical or leading questions
- Do NOT assume a requirement is clear just because it uses technical vocabulary
- Do NOT skip the restatement step — it catches misunderstandings immediately
- Do NOT silently fill in gaps with assumed values — always ask
