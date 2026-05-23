# me-skills

Reusable **GitHub Copilot agents and skills** for Java delivery teams, built for VS Code Chat.

A specialist agent team that guides developers through the full Java SDLC — from API design to deployment — with domain-specific prompt libraries that load on demand.

---

## Quick Start

```bash
git clone https://github.com/duylv27/me-skills.git
cp -r me-skills/agents ~/.copilot/agents
cp -r me-skills/skills ~/.copilot/skills
```

Restart VS Code afterwards.

---

## Agents (9)

Agents are `.agent.md` files that act as focused specialists. Invoke them by name in GitHub Copilot Chat.

### Java Development

| Agent | Invoke | Responsibility | Example triggers |
|---|---|---|---|
| **Duke** | `@Duke` | End-to-end Java delivery — implementation, code review, testing, refactoring, Spring Boot, JPA, resilience patterns | "implement this feature", "review my Java class", "write unit tests", "check SOLID", "N+1 problem" |
| **Ada** | `@Ada` | REST API design — OpenAPI specs, resource modeling, controller skeletons, HTTP contract review | "design this API", "OpenAPI spec for X", "create endpoint" |
| **Rex** | `@Rex` | Pre-merge code review — correctness, security, quality gates, PR readiness | "review my PR", "is this ready to merge", "check my changes" |

### Discovery & Analysis

| Agent | Invoke | Responsibility | Example triggers |
|---|---|---|---|
| **Feature Discovery** | `@Feature Discovery` | Reverse-engineer codebase features into visual diagrams and documentation | "what does this code do", "map out this module", "document this feature" |
| **Ripple** | `@Ripple` | Blast-radius analysis — trace every caller, dependent, and integration point before a change | "what breaks if I change X", "who calls this method", "refactoring risk" |

### Deployment & Security

| Agent | Invoke | Responsibility | Example triggers |
|---|---|---|---|
| **Delta** | `@Delta` | Pre-deployment readiness — Azure resources, secrets checklist, environment config, go-live gates | "prepare for deployment", "release checklist", "what secrets do I need" |
| **Vault** | `@Vault` | Secrets bootstrapping — Azure Key Vault setup, managed identity, connection strings, env variables | "set up secrets", "configure Key Vault", "generate env config" |
| **Bob** | `@Bob` | Vulnerability remediation — CodeQL, Dependabot, OWASP, SAST/DAST alert triage and fixes | "fix vulnerability", "security scan", "CVE", "Dependabot alert" |

### Meta

| Agent | Invoke | Responsibility | Example triggers |
|---|---|---|---|
| **Prompt Engineer** | `@Prompt Engineer` | Prompt design and optimization — chain-of-thought, few-shot, structured output, evaluation | "optimize this prompt", "design a prompt for X", "improve AI output quality" |

### Delivery Workflow

```
Ada (design API) → Duke (implement) → Rex (review PR) → Delta (deploy)
                                    ↑
                              Ripple (impact check before refactor)
                              Bob (security scan at any stage)
```

---

## Skills (20)

Skills are reusable prompt libraries in `skills/`. Agents load them at runtime. You can also reference them directly in Copilot Chat.

### Context & Discovery

| Skill | Trigger phrases | What it does |
|---|---|---|
| [`ultra-analyst`](skills/ultra-analyst/) | *(load before any task in an existing codebase)* | Gathers full codebase context — produces a Context Brief consumed by all subsequent work. **Always load first.** |
| [`acquire-codebase-knowledge`](skills/acquire-codebase-knowledge/) | "map this codebase", "document this architecture", "onboard me to this repo" | Full codebase mapping — generates structured docs covering architecture, layers, and entry points |

### Java Development

| Skill | Trigger phrases | What it does |
|---|---|---|
| [`java-dev`](skills/java-dev/) | "implement this feature", "write the Java code for", "best practices for Java", "circuit breaker", "retry logic" | Production-quality Java — service/controller/repository layers, resilience patterns, exception handling, logging |
| [`java-dev-ut`](skills/java-dev-ut/) | "write unit tests", "generate tests for this class", "add test coverage" | Generates JUnit 5 + Mockito tests for existing Java source classes |
| [`java-ut`](skills/java-ut/) | "JUnit best practices", "data-driven tests", "parameterized test" | JUnit 5 patterns — parameterized tests, lifecycle, assertions |
| [`java-tdd`](skills/java-tdd/) | "TDD", "red-green-refactor", "test-first", "integration tests" | Test-driven development loop — write failing test → implement → refactor |

### Code Quality & Review

| Skill | Trigger phrases | What it does |
|---|---|---|
| [`java-code-review`](skills/java-code-review/) | "review this code", "check this PR", "code quality" | Structured Java code review with CRITICAL / MAJOR / MINOR severity ratings |
| [`api-contract-review`](skills/api-contract-review/) | "review API", "check REST endpoints", "HTTP status codes", "OpenAPI" | REST API design review — correctness, versioning, validation, error responses |
| [`concurrency-review`](skills/concurrency-review/) | "check thread safety", "concurrency review", "is this thread safe", "@Async" | Reviews synchronized, volatile, Lock, CompletableFuture, Virtual Threads |
| [`performance-smell-detection`](skills/performance-smell-detection/) | "check performance", "find slow code", "optimize this", "regex in loop" | Detects streams, boxing, regex, collection, and I/O-in-transaction smells. Measure before fixing. |
| [`solid-principles`](skills/solid-principles/) | "check SOLID", "single responsibility", "this class does too much" | Detects SRP/OCP/LSP/ISP/DIP violations and guides refactoring |
| [`design-patterns`](skills/design-patterns/) | "use factory pattern", "implement strategy", "what pattern fits here" | When to apply (and when NOT to apply) common Java design patterns |
| [`spring-boot-patterns`](skills/spring-boot-patterns/) | "create controller", "Spring Boot help", "handle exceptions in Spring" | Spring Boot project structure, DTO patterns, exception handling, configuration |

### Architecture

| Skill | Trigger phrases | What it does |
|---|---|---|
| [`solution-architect`](skills/solution-architect/) | "design an architecture", "C4 diagram", "microservices", "evaluate technology options" | System architecture diagrams, technology evaluation, migration strategy, ADRs |

### Git & GitHub

| Skill | Trigger phrases | What it does |
|---|---|---|
| [`git-commit-push`](skills/git-commit-push/) | "commit my changes", "git push", "write a commit message", "conventional commit" | Full git workflow — stage, commit, push, branch, rebase, conflict resolution |
| [`gh-cli`](skills/gh-cli/) | "create a PR", "merge this PR", "gh auth switch", "list my issues" | GitHub CLI — auth, PRs, issues, repo operations |

### Utility

| Skill | Trigger phrases | What it does |
|---|---|---|
| [`util-requirements`](skills/util-requirements/) | "clarify this ticket", "what are the acceptance criteria", "this requirement is vague" | Breaks down and clarifies ambiguous tickets and user stories before implementation |
| [`util-boundary-analysis`](skills/util-boundary-analysis/) | "find edge cases", "what could go wrong", "boundary conditions", "failure scenarios" | Systematically enumerates edge cases, failure modes, and test scenarios |
| [`util-critical-thinking`](skills/util-critical-thinking/) | "poke holes in this", "devil's advocate", "analyse trade-offs", "what am I missing" | Structured critique of designs, architectures, requirements, and implementations |
| [`util-writing`](skills/util-writing/) | "fix grammar", "improve writing", "proofread", "rewrite this commit message" | Grammar correction, clarity improvements, proofreading for technical content |

---

## Repository Structure

```
me-skills/
├── agents/                        # Agent definitions (.agent.md)
│   ├── duke.agent.md              # Java developer
│   ├── api-designer.agent.md      # API designer (Ada)
│   ├── pr-reviewer.agent.md       # PR reviewer (Rex)
│   ├── impact-analyzer.agent.md   # Impact analyzer (Ripple)
│   ├── feature-discovery.agent.md # Feature discovery
│   ├── deployment-checklist.agent.md  # Deployment checklist (Delta)
│   ├── secrets-bootstrapper.agent.md  # Secrets setup (Vault)
│   ├── vuln-fixer.agent.md        # Security guard (Bob)
│   └── prompt-engineer.agent.md   # Prompt engineer
├── skills/                        # Reusable skill libraries (SKILL.md)
│   ├── ultra-analyst/             # Context gathering (always load first)
│   ├── java-dev/                  # Java implementation
│   ├── java-dev-ut/               # Unit test generation
│   ├── java-ut/                   # JUnit 5 best practices
│   ├── java-tdd/                  # TDD workflow
│   ├── java-code-review/          # Code review
│   ├── api-contract-review/       # REST API review
│   ├── concurrency-review/        # Thread safety review
│   ├── performance-smell-detection/  # Performance smells
│   ├── solid-principles/          # SOLID violation detection
│   ├── design-patterns/           # Design pattern guidance
│   ├── spring-boot-patterns/      # Spring Boot patterns
│   ├── acquire-codebase-knowledge/   # Codebase mapping
│   ├── solution-architect/        # Architecture design
│   ├── git-commit-push/           # Git workflow
│   ├── gh-cli/                    # GitHub CLI
│   ├── util-requirements/         # Requirements clarification
│   ├── util-boundary-analysis/    # Edge case enumeration
│   ├── util-critical-thinking/    # Critical thinking
│   └── util-writing/              # Writing & proofreading
├── bin/
│   └── cli.js                     # npm install CLI
└── package.json
```

---

## Requirements

- VS Code with [GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat) extension
- Java 11+ projects (Java 17+ recommended)
- Git for version control

---

## Author

**duylv27** — [github.com/duylv27](https://github.com/duylv27)
