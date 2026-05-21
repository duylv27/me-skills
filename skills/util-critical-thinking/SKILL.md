---
name: util-critical-thinking
description: >
  Use this skill to apply structured critical thinking before, during, or after any software
  decision. Triggers include: "think critically about this", "challenge this", "what am I missing",
  "devil's advocate", "poke holes in this", "analyse trade-offs", "question this design",
  "what are the risks", "is this the right approach", "critique this solution", "what assumptions
  am I making", or any request to rigorously examine a requirement, architecture, ticket, PR,
  or implementation plan before committing to it.
argument-hint: "Paste the requirement, design decision, ticket, or plan you want critically evaluated."
---

# Critical Thinking Skill

Apply structured critical thinking to any software artefact — requirement, ticket, design decision,
architecture proposal, or implementation plan. Produces three outputs: a questions/gaps list,
a risk/assumption matrix, and a written critique with recommendations.

> **Principle**: Never accept the first framing of a problem. Every assumption is a potential bug.

---

## Phase 1 — Restate & Frame

Restate the input in your own words in 2–3 sentences.
- If your restatement changes the meaning, that gap is the first finding.
- Identify the **type** of artefact: requirement | design | plan | code | other.
- Identify the **primary stakeholder**: user | developer | business | system.

---

## Phase 2 — Challenge Assumptions

Work through these lenses systematically. Not every lens applies — skip and note why.

### 2.1 Requirements & Intent
- What problem is this *actually* solving? Is that the right problem?
- What is the stated goal vs. the real goal?
- Who benefits, and who might be harmed or inconvenienced?
- What would happen if this feature/change did NOT exist?

### 2.2 Scope & Boundaries
- What is explicitly in scope? What is conspicuously absent?
- Does this change affect systems, services, or users not mentioned?
- Is there hidden coupling — things that must change together but aren't listed?
- What does "done" actually mean here? Is there a measurable exit criterion?

### 2.3 Assumptions & Preconditions
- What must be true for this to work? List every silent assumption.
- Which assumptions have been validated? Which are untested?
- What happens when each assumption is false?

### 2.4 Edge Cases & Failure Modes
- What are the boundary conditions (empty, null, max, concurrent, network failure)?
- What is the worst-case failure? Is it recoverable?
- What if the input is malicious or malformed?
- What happens under load, clock skew, or partial failure?

### 2.5 Trade-offs & Alternatives
- What alternative approaches were considered? Why were they rejected?
- What does this solution optimise for (speed, simplicity, correctness, cost)?
- What does it sacrifice? Is that trade-off explicit and accepted?
- Is there a simpler solution that achieves 80% of the value?

### 2.6 Second-order Effects
- What will break downstream when this ships?
- Does this create technical debt? If so, is it budgeted?
- Could this decision constrain future options?
- Who else needs to know about this change?

---

## Phase 3 — Produce the Three Outputs

### Output A — Questions & Gaps

A prioritised list of unresolved questions that must be answered before proceeding.

```
## Questions & Gaps

| Priority | Category | Question | Owner |
|----------|----------|----------|-------|
| 🔴 Must answer | Scope | Is the payment service in or out of scope for this change? | PM |
| 🟡 Should answer | Assumption | We assume the user is always authenticated — is that true for API consumers? | Tech Lead |
| 🔵 Nice to know | Trade-off | Why was eventual consistency chosen over strong consistency here? | Architect |
```

### Output B — Risk / Assumption Matrix

```
## Risk & Assumption Matrix

| # | Assumption / Risk | Validated? | Likelihood | Impact | Mitigation |
|---|-------------------|------------|------------|--------|------------|
| 1 | Users always have network access | ❌ No | High | High | Add offline fallback |
| 2 | DB can handle 10× write throughput | ⚠️ Partial | Medium | High | Load test before release |
| 3 | Legacy clients send ISO date format | ✅ Yes | Low | Medium | Parser already handles it |
```

Scoring:
- **Likelihood**: High · Medium · Low
- **Impact**: High (blocks release / data loss) · Medium (degraded UX) · Low (cosmetic)

### Output C — Written Critique & Recommendations

```
## Critical Assessment

### Verdict
<One of: ✅ Proceed | ⚠️ Proceed with caution | 🔴 Stop — resolve blockers first>

### Strengths
- <What is well thought-out>

### Concerns
- <Ordered by severity — most critical first>

### Recommendations
1. <Concrete action to take before proceeding>
2. <Concrete action to take before proceeding>

### Open Questions (must resolve)
- <Questions from Output A that are blockers>
```

---

## Completion Criteria

The output is complete when:
- [ ] All three outputs (A, B, C) are present
- [ ] At least one finding per phase (or a documented "no issues found" with reasoning)
- [ ] Every 🔴 question in Output A has a named owner
- [ ] The verdict in Output C is explicit — never omit or hedge it
