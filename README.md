# me-skills

A curated collection of GitHub Copilot **agents** and **skills** for Java delivery teams, built for VS Code Chat.

---

## Overview

This repository contains custom Copilot agent definitions and reusable skill prompts that plug into the VS Code GitHub Copilot Chat extension. Together they form a **specialist agent team** that guides developers through the full Java SDLC — from API design to deployment.

---

## Agents

Agents are `.agent.md` files in the `agents/` directory. Each agent is a focused specialist that handles a narrow domain.

| Agent | File | Purpose |
|---|---|---|
| **Cod Leader (Orchestrator)** | [agents/orchestrator.agent.md](agents/orchestrator.agent.md) | Central coordinator — routes tasks to the right specialist and manages handoffs |
| **Duke (Java Dev)** | [agents/duke.agent.md](agents/duke.agent.md) | Java implementation, TDD, code review, Spring Boot, unit testing |
| **Ada (API Designer)** | [agents/api-designer.agent.md](agents/api-designer.agent.md) | REST API design, OpenAPI specs, controller skeletons |
| **Rex (PR Reviewer)** | [agents/pr-reviewer.agent.md](agents/pr-reviewer.agent.md) | Pre-merge code review, quality gates |
| **Ripple (Impact Analyzer)** | [agents/impact-analyzer.agent.md](agents/impact-analyzer.agent.md) | Blast-radius analysis, refactoring risk, dependency mapping |
| **Feature Discovery** | [agents/feature-discovery.agent.md](agents/feature-discovery.agent.md) | Codebase exploration and feature documentation |
| **Delta (Deployment Checklist)** | [agents/deployment-checklist.agent.md](agents/deployment-checklist.agent.md) | Pre-deploy readiness, Azure resources, secrets, environment config |
| **Vault (Secrets Bootstrapper)** | [agents/secrets-bootstrapper.agent.md](agents/secrets-bootstrapper.agent.md) | Azure Key Vault setup, managed identity, env variable generation |
| **Bob (Security Guard)** | [agents/vuln-fixer.agent.md](agents/vuln-fixer.agent.md) | Vulnerability remediation — CodeQL, Dependabot, OWASP, SAST alerts |

### Typical Workflow

```
Ada (design) → Duke (implement) → Rex (review) → Delta (deploy)
```

The **Orchestrator** manages this flow automatically — invoke it when you're unsure which agent to use.

---

## Skills

Skills are reusable prompt libraries in `skills/`. Agents load them at runtime via `read_file`.

| Skill | Directory | When to use |
|---|---|---|
| `ultra-analyst` | [skills/ultra-analyst/](skills/ultra-analyst/) | **Always first** — gathers full codebase context before any action |
| `java-dev` | [skills/java-dev/](skills/java-dev/) | Production Java code — Spring Boot, service/controller/repository layers |
| `java-dev-ut` | [skills/java-dev-ut/](skills/java-dev-ut/) | Unit tests for existing Java classes (JUnit 5 + Mockito) |
| `java-ut` | [skills/java-ut/](skills/java-ut/) | JUnit 5 best practices, data-driven tests |
| `java-tdd` | [skills/java-tdd/](skills/java-tdd/) | Test-first development — red-green-refactor loop |
| `java-code-review` | [skills/java-code-review/](skills/java-code-review/) | Structured Java code review with severity ratings |
| `acquire-codebase-knowledge` | [skills/acquire-codebase-knowledge/](skills/acquire-codebase-knowledge/) | Full codebase mapping — generates 7 docs in `docs/codebase/` |
| `solution-architect` | [skills/solution-architect/](skills/solution-architect/) | System architecture, C4 diagrams, technology evaluation |
| `gh-cli` | [skills/gh-cli/](skills/gh-cli/) | GitHub CLI — auth, PRs, issues, repos |
| `git-commit-push` | [skills/git-commit-push/](skills/git-commit-push/) | Git workflow — stage, commit, push, branch management |
| `util-boundary-analysis` | [skills/util-boundary-analysis/](skills/util-boundary-analysis/) | Edge cases, boundary conditions, failure mode enumeration |
| `util-critical-thinking` | [skills/util-critical-thinking/](skills/util-critical-thinking/) | Structured critique of designs, requirements, and implementations |
| `util-requirements` | [skills/util-requirements/](skills/util-requirements/) | Clarify ambiguous tickets and acceptance criteria |
| `util-writing` | [skills/util-writing/](skills/util-writing/) | Grammar, clarity, and proofreading for technical content |

---

## Getting Started

### Install via GitHub Packages

**1. Authenticate** — add your [GitHub PAT](https://github.com/settings/tokens) (with `read:packages` scope) to `~/.npmrc`:

```
//npm.pkg.github.com/:_authToken=YOUR_TOKEN
```

**2. Install and run:**

```bash
npm install -g @duylv27/javme-skills
javme-skills install
```

This copies all skills and agents into `~/.copilot/skills/` and `~/.copilot/agents/`. Restart VS Code afterwards.

### Manual install

```bash
git clone https://github.com/duylv27/me-skills.git
cp -r me-skills/skills ~/.copilot/skills
cp -r me-skills/agents ~/.copilot/agents
```

---

Once installed, invoke any agent from the Copilot Chat panel:
- `@Cod Leader` — let the orchestrator route your request
- `@Duke` — jump straight to Java development
- `@Bob` — fix a security alert

---

## Repository Structure

```
me-skills/
├── agents/          # Agent definition files (.agent.md)
├── skills/          # Reusable skill libraries (SKILL.md + assets)
│   ├── ultra-analyst/
│   ├── java-dev/
│   ├── java-dev-ut/
│   ├── java-tdd/
│   ├── java-ut/
│   ├── java-code-review/
│   ├── acquire-codebase-knowledge/
│   ├── solution-architect/
│   ├── gh-cli/
│   ├── git-commit-push/
│   ├── util-boundary-analysis/
│   ├── util-critical-thinking/
│   ├── util-requirements/
│   └── util-writing/
└── docs/            # Generated documentation (codebase maps, discovery outputs)
```

---

## Author

**duylv27** — [github.com/duylv27](https://github.com/duylv27)
