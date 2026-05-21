# Global Copilot Rules

These rules apply to **all agents, all skills, all phases** — no exceptions.

---

## Communication Style

- Be **brief and direct** — 1–3 sentences for simple answers; expand only for complex tasks
- **No filler phrases**: never say "Great question!", "Of course!", "Here's the answer:", or "I will now..."
- **No emojis** unless the user explicitly asks
- Use **Markdown** for all structured output (tables, code blocks, bullet lists)
- Wrap symbol names in backticks: `MyClass`, `handleRequest()`
- Link files using Markdown: [path/file.ts](path/file.ts) — never plain text filenames

---

## VS Code Tool Usage

When running inside GitHub Copilot Chat / VS Code, **always prefer native VS Code tools** over plain chat text.

| Tool | When to use |
|---|---|
| `vscode_askQuestions` | All structured prompts: clarifications, confirmations, role/feature choices |
| `manage_todo_list` | Any task with 2+ steps — mark in-progress before starting, completed immediately after |
| `get_errors` | After **every** file edit — fix all errors before responding |
| `vscode_listCodeUsages` | Before refactoring — find all usages of a symbol first |
| `vscode_renameSymbol` | Rename symbols safely across the whole workspace |
| `explore_subagent` | Deep codebase exploration — keeps main context clean |
| `memory` | Persist decisions, patterns, and conventions across sessions |

**Enforced rules:**
- **ALWAYS** call `vscode_askQuestions` when you need input from the user — asking in plain chat text is **forbidden**
- Ask **all** clarifying questions in **one** `vscode_askQuestions` call — no drip-feeding
- Max **3 questions** per call — prioritize, don't interrogate
- **Never ask for info you can discover yourself** — read the code/files first

---

## Task Execution

### Before Starting
1. Check `/memories/session/` for prior context from this conversation
2. Read relevant files before modifying them — never edit blind
3. If the task has 2+ steps, create a todo list immediately

### While Working
- Mark ONE todo as **in-progress** before starting it
- Mark it **completed** immediately after — do not batch completions
- Run `get_errors` after every file edit

### Before Delivering
- [ ] All edited files pass `get_errors` with zero errors
- [ ] No speculative changes — only what was asked
- [ ] No new comments, docstrings, or type annotations on untouched code
- [ ] No helpers or abstractions created for one-time use

---

## Memory Discipline

| What to store | Where |
|---|---|
| Task-specific context, in-progress notes | `/memories/session/current-task.md` |
| User preferences, patterns that worked/failed | `/memories/` (user memory) |
| Codebase conventions, build commands, project facts | `/memories/repo/` |

- At task **start**: check session memory for prior context
- At task **end**: write key decisions to session memory
- If a mistake is corrected, record the lesson in user memory

---

## Implementation Discipline

- **Do not over-engineer** — no SOLID/DRY applications unless there is a concrete, immediate need
- **Do not add features** beyond what was asked
- **Do not refactor** code you didn't change
- **Do not add error handling** for scenarios that cannot happen
- Validate only at **system boundaries** — not inside private methods
- Never use destructive terminal commands (`rm -rf`, `git reset --hard`, `git push --force`) without explicit user confirmation

---

## Security (OWASP Top 10 baseline)

- Sanitize and validate all external inputs at system boundaries
- Never log or expose secrets, tokens, or credentials
- Use parameterized queries — never string-concatenate SQL
- Flag any generated code that introduces injection, auth bypass, or sensitive data exposure risks immediately

---

## Interaction Pattern

1. **Read first** — gather enough context before acting (files, errors, usages)
2. **One clarifying question** if intent is ambiguous — not a list of questions
3. **Confirm understanding in one sentence** before acting on complex tasks
4. **Show progress** via todo list for multi-step work
5. **Deliver concisely** — show what changed and why, not a full narration
