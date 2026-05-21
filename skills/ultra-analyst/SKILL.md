---
name: ultra-analyst
description: >
  Universal context-gathering skill. Load BEFORE any other skill or action when working in
  an existing codebase. Triggers include: any implementation, review, test-writing, or planning
  task where the agent must understand existing code before acting. This skill must run first
  whenever the codebase is unfamiliar, the task touches existing code, or a prior skill would
  otherwise start from zero. Output is a Context Brief consumed by all subsequent work.
argument-hint: "Describe the task or area you need context for (e.g., 'PaymentService feature', 'order processing module', 'user authentication flow')."
---

# Ultra-Analyst Skill

Proactively gather all available context — from the codebase, memory, config, tests, and history
— before any code is written, reviewed, or planned. Produces a **Context Brief** that subsequent
skills consume instead of guessing.

> **Prime Directive**: Never act on incomplete context. A minute of research prevents an hour of rework.
> Every answer you can find via tools is an answer you don't need to ask the user.

---

## Execution Protocol

Run all phases **before** producing any output or asking any question. Phases 1–4 can run in
parallel where tool availability allows. Phase 5 (Synthesis) blocks on all prior phases.

---

## Phase 1 — Codebase Reconnaissance

**Goal**: Locate all code directly relevant to the task.

1. **Identify entry points**: Search for the class, method, feature, or concept named in the task.
   Use both exact name search and semantic variations (e.g., `payment`, `Payment`, `PaymentService`).
2. **Read primary files**: Read the 1–5 most relevant files in full (not just signatures).
   Prefer: service classes → controllers → repositories → DTOs/models → configs.
3. **Find analogous implementations**: Search for similar features already built in the codebase
   (e.g., if adding an invoice service, find the order service as a template).
4. **Scan test files**: Read the test class for any primary class you read. Tests reveal expected
   behavior, edge cases, and invariants the production code may not make explicit.
5. **Check configuration**: Scan `application.yml`, `application.properties`, or env-specific
   configs for feature flags, timeouts, URLs, or constraints relevant to the task.

**Bounds**: Max 5 source files + 3 test files + 1 config file. Do not crawl recursively.

---

## Phase 2 — Memory Audit

**Goal**: Recover prior decisions so they are not re-litigated.

Check all three memory scopes in order:

1. `/memories/repo/` — codebase conventions, build commands, architectural decisions, verified facts
2. `/memories/session/` — decisions made earlier in this conversation (plan, trade-offs, scope)
3. `/memories/` (user memory) — user preferences, recurring patterns, tools they prefer

For each memory hit, note: **what was decided** and **when** (session vs. persistent).

If no memory exists for this task area, note that explicitly — it signals a decision the user
may want to persist after this session.

---

## Phase 3 — Pattern Extraction

**Goal**: Extract the conventions the codebase already uses so generated code matches exactly.

Extract and record all of the following from the files read in Phase 1:

| Dimension | What to Extract |
|---|---|
| **Package structure** | Root package, layer packages (`service`, `controller`, `repository`, `dto`) |
| **Naming conventions** | Class suffixes (`Service`, `Controller`, `Repository`, `Handler`), method verb patterns (`find`, `get`, `create`, `process`) |
| **Error handling** | Exception types used, where they're thrown, how they're caught at boundaries |
| **Logging style** | Logger declaration, log levels used, structured param style |
| **Dependency injection** | Constructor injection vs. field injection, `@Autowired` usage |
| **Testing patterns** | Test base classes, annotation sets (`@SpringBootTest` vs. `@ExtendWith`), mock strategy |
| **API conventions** | Response wrappers, status codes used, error response shape |
| **Null safety** | Use of `Optional`, `requireNonNull`, `@NonNull` annotations |

If a dimension is not applicable to the task, skip it and note why.

---

## Phase 4 — Dependency & Impact Mapping

**Goal**: Understand what the target code depends on and what depends on it.

1. **Inbound**: Who calls the target class/method? (callers, controllers, other services)
2. **Outbound**: What does the target call? (repositories, external APIs, queues, caches)
3. **Shared state**: Does the code share mutable state (static fields, caches, thread locals)?
4. **External contracts**: Are there API contracts, message schemas, or DB schemas that constrain the implementation?
5. **Test coverage gap**: Are there areas of the target code with no test coverage? Flag them.

---

## Phase 5 — Knowledge Synthesis (Context Brief)

**Goal**: Compile all findings into a single structured Context Brief.

Produce the Context Brief in this exact format:

```
## Context Brief: {task or feature name}

### What exists
- {Primary files read, with one-line description of each}

### Patterns to follow
- Package: {root package and relevant sub-packages}
- Naming: {class and method naming pattern to use}
- Error handling: {exception type, where thrown, boundary pattern}
- Logging: {style and levels}
- Testing: {test annotation set and mock strategy}

### Analogous implementation
- {File name} — use as template for {aspect}: {what to replicate from it}

### Prior decisions (from memory)
- {Decision} — source: {repo memory | session | user preference}
- (none found) if no relevant memory exists

### Dependencies
- Inbound: {who calls the target}
- Outbound: {what the target calls}

### Open questions (tools could not answer)
- {Question} — needed to resolve: {what action is blocked}
```

---

## Phase 6 — Question Gate

**Goal**: Ask only what is genuinely unanswerable via tools.

Before raising any question, verify all four checks pass:
- [ ] Searched the codebase for this answer
- [ ] Read the relevant files
- [ ] Checked all memory scopes
- [ ] Checked tests and configs

Only questions that pass all four checks may be surfaced to the user.

**Format**: Group into a single `vscode/askQuestions` call — never drip-feed one question at a
time. Max 3 questions per gate. If more than 3 remain, prioritize the ones that block the most work.

**Never ask about** (always self-resolve via tools):
- Naming conventions → extract from existing classes
- Package structure → visible in the codebase
- Tech stack / framework → read `pom.xml`, `build.gradle`, `package.json`, or imports
- Error handling style → visible in existing service classes
- Test patterns → visible in existing test classes
- Logger setup → visible in any existing class

---

## Handoff

After producing the Context Brief, immediately proceed to the next skill or action.
Do not wait for user confirmation unless the Question Gate surfaced open questions.

State exactly: *"Context gathered. Proceeding with [next skill/action]."*
