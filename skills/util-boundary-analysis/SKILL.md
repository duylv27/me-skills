---
name: util-boundary-analysis
description: >
  Use this skill to identify edge cases, boundary conditions, and failure modes for any
  feature, function, API, or system. Triggers include: "find edge cases", "what could go
  wrong", "boundary conditions", "what am I missing", "failure scenarios", "stress test
  ideas", "what should I test", or any request to systematically enumerate test scenarios
  before or after implementation.
---

# Boundary Analysis Skill

Systematically enumerate edge cases, boundary conditions, and failure modes across all
relevant dimensions. Produces a prioritized checklist of scenarios ready to be turned into
test cases.

## Core Principle

> The bugs that reach production are always the ones nobody thought to test.
> Structured analysis beats intuition every time.

---

## Before You Start — Ask First

If the feature or API is not fully described, **ask questions before analyzing**.
Do not invent input shapes, constraints, or behaviors. Specifically ask about:
- What inputs does the feature accept (types, formats, ranges)?
- What are the known constraints or validation rules?
- Which downstream dependencies are involved?
- Are there any known non-functional requirements (auth, rate limits, SLA)?

Only proceed with analysis once you have enough context to avoid guessing.

---

## Analysis Framework

Work through each category below. Skip categories that are clearly not applicable,
but always justify the skip with a question if unsure.

### 1. Input Boundaries
- **Null / empty / blank** — what happens with null, `""`, `" "`, empty collections?
- **Minimum and maximum values** — off-by-one at min, max, min-1, max+1
- **Type coercion** — wrong type passed (string instead of int, etc.)
- **Encoding** — unicode, special characters, emoji, multi-byte strings
- **Length limits** — exactly at limit, one over, one under
- **Format violations** — malformed email, invalid UUID, wrong date format

### 2. State & Sequence
- **Already exists** — create when record already exists
- **Does not exist** — update/delete/get when record is missing
- **Wrong state transition** — e.g. cancel an already-cancelled order
- **Concurrent modification** — two requests modifying the same record simultaneously
- **Idempotency** — duplicate requests (retries, double-clicks, replayed messages)
- **Ordering dependency** — steps executed out of order

### 3. Integration & Dependencies
- **Downstream unavailable** — DB down, external API timeout, queue full
- **Partial failure** — dependency returns 500 on the 3rd of 5 calls
- **Slow response** — dependency exceeds timeout threshold
- **Unexpected response shape** — missing fields, extra fields, wrong types in API response
- **Stale data** — cache hit returns outdated record
- **Circuit open** — what happens when circuit breaker is tripped?

### 4. Security & Authorization
- **Unauthenticated request** — no token, expired token, malformed token
- **Unauthorized access** — valid user accessing another user's resource (IDOR)
- **Privilege escalation** — non-admin calling admin-only endpoint
- **Injection** — SQL injection, command injection, path traversal in inputs
- **Mass assignment** — extra fields in request body being silently applied
- **Rate limiting** — behavior at and beyond rate limit threshold

### 5. Data Volume & Performance
- **Empty dataset** — list endpoint with zero records
- **Very large dataset** — pagination boundary, missing `limit`, unbounded query
- **High concurrency** — N simultaneous requests for the same resource
- **Large payload** — request body at and above max size

### 6. Time & Environment
- **Timezone handling** — DST transitions, UTC vs local time, date arithmetic across midnight
- **Clock skew** — token issued in the future, expiry in the past
- **Date boundaries** — end of month, leap year, year rollover

### 7. Internationalization
- **Locale-sensitive formatting** — numbers (1.000 vs 1,000), dates, currencies
- **Right-to-left text** — layout and string operations
- **Multi-byte characters** — string length calculation, truncation

---

## Output Format

Present findings as a prioritized checklist grouped by category.
For each scenario, provide:

```
- [ ] [Category] [Scenario title]
      Input: [what to send]
      Expected: [what should happen]
      Priority: HIGH / MEDIUM / LOW
```

**Priority guide:**
- **HIGH** — likely to occur in production, causes data loss or security breach
- **MEDIUM** — occurs under realistic conditions, causes degraded behavior
- **LOW** — rare or cosmetic, acceptable to defer

---

## Anti-Patterns to Avoid

- Do NOT only list happy-path variations
- Do NOT generate scenarios that are logically impossible given the system constraints
- Do NOT skip security scenarios for internal-only APIs — internal ≠ trusted
- Do NOT mark everything HIGH — force prioritization
- Do NOT assume input types, constraints, or behaviors that were not stated — ask first
