---
name: git-commit-push
description: "Git expert skill. Use for any git or GitHub workflow: staging, committing, pushing, branching, rebasing, cherry-picking, resolving conflicts, managing remotes, creating PRs, reviewing diffs, undoing mistakes, and more. Triggers include: 'commit my changes', 'push to remote', 'git commit', 'git push', 'commit and push', 'stage and commit', 'write a commit message', 'conventional commit', 'open a PR', 'create pull request', 'rebase', 'cherry-pick', 'undo last commit', 'resolve conflict', 'git log', 'git stash', or any git/GitHub CLI task."
argument-hint: "Describe the git task or what you changed. Leave blank to inspect git status and suggest next steps."
---

# Git Expert Skill

Act as a **git expert**. Use `git`, `gh` (GitHub CLI), or any relevant tool to accomplish the task. Inspect the repo state first, then execute the right commands — don't just suggest, **run them**.

## Toolbox

| Tool | Purpose |
|------|---------|
| `git` | All core VCS operations |
| `gh` | GitHub CLI — PRs, issues, releases, repo management |
| `git-delta` / `diff-so-fancy` | Enhanced diffs (if available) |

Always prefer running commands directly over explaining how to run them.

## When to Use
- Committing finished work or a logical unit of change
- Generating a conventional commit message from a diff
- Pushing a branch and opening a PR
- Rebasing, cherry-picking, or resolving merge conflicts
- Undoing commits, resets, or recovering lost work
- Inspecting history, blame, bisect, log
- Managing remotes, tags, and releases
- Pre-commit sanity checks (lint, tests, secrets scan)

---

## Procedure

### 1. Inspect Current State

```bash
git status
git diff --stat
```

- Identify **untracked**, **modified**, and **deleted** files.
- Note the current branch name — confirm it is NOT `main` / `master` unless explicitly intended.

### 2. Review the Diff

```bash
git diff          # unstaged changes
git diff --cached # already staged changes
```

- Understand what changed before writing a message.
- Flag any accidental debug code, secrets, or generated files (`.env`, `*.log`, build output).

### 3. Stage Changes

Stage only the files belonging to this logical unit of work:

```bash
# Stage specific files (preferred)
git add <file1> <file2>

# Stage all tracked changes
git add -u

# Stage everything including untracked (use carefully)
git add .
```

> **Do NOT blindly `git add .`** if the repo has no `.gitignore` or if sensitive files are present.

### 4. Write the Commit Message

Use **Conventional Commits** format with the **ticket number as the scope**:

```
<type>(<ticket-number>): <short summary>

[optional body — explain WHY, not WHAT]

[optional footer: BREAKING CHANGE, closes #issue]
```

> The `(<ticket-number>)` scope is **mandatory**. Ask the user for it if it cannot be inferred from the branch name (e.g. `feature/PROJ-123-...` → scope is `PROJ-123`).

**Types:**

| Type | When |
|------|------|
| `feat` | New feature visible to users |
| `fix` | Bug fix |
| `refactor` | Code restructure, no behavior change |
| `test` | Add or fix tests |
| `chore` | Build scripts, CI, dependencies |
| `docs` | Documentation only |
| `style` | Formatting, whitespace |
| `perf` | Performance improvement |

**Rules:**
- **Scope = ticket number** (e.g. `PROJ-123`, `GH-42`, `ISSUE-7`) — always required
- Infer ticket from branch name if possible: `feature/PROJ-123-login` → `PROJ-123`
- If no ticket exists, use a short context word (e.g. `deps`, `ci`) and note the absence
- Summary line ≤ 72 characters, imperative mood ("add", not "added")
- Body wrapped at 72 characters
- Reference issue numbers in footer: `Closes #42`

**Example:**
```
feat(PROJ-87): add JWT refresh token endpoint

Adds POST /auth/refresh that issues a new access token from a valid
refresh token. Refresh tokens are stored in HttpOnly cookies.

Closes #87
```

### 5. Commit

```bash
git commit -m "<type>(<ticket-number>): <summary>"

# Or open editor for multi-line message:
git commit
```

### 6. Pre-Push Checks

Before pushing, confirm:

- [ ] Build passes locally (if applicable)
- [ ] Tests pass: `mvn test` / `npm test` / `pytest` etc.
- [ ] No secrets or credentials in the diff (`git diff HEAD~1`)
- [ ] Branch is up to date: `git fetch && git status`

If the branch has diverged from remote:

```bash
git pull --rebase origin <branch>
```

### 7. Push

```bash
# First push of a new branch:
git push -u origin <branch>

# Subsequent pushes:
git push

# Push and open a pull request (GitHub CLI):
gh pr create --fill

# Push and immediately open PR with title + body:
gh pr create --title "feat: my feature" --body "Closes #42"
```

> **Never force-push to shared branches** (`main`, `develop`, release branches) without explicit team agreement.

---

## Common Git Expert Operations

### Undo
```bash
git reset --soft HEAD~1      # undo last commit, keep changes staged
git reset HEAD~1             # undo last commit, keep changes unstaged
git restore <file>           # discard unstaged changes in a file
git revert <sha>             # safe undo via a new commit
```

### Stash
```bash
git stash push -m "WIP: description"
git stash list
git stash pop
```

### Rebase
```bash
git fetch origin
git rebase origin/main
git rebase -i HEAD~3         # interactive: squash, reword, drop commits
```

### Cherry-pick
```bash
git cherry-pick <sha>
git cherry-pick <sha1>..<sha2>   # range
```

### History & Blame
```bash
git log --oneline --graph --decorate --all
git blame <file>
git log -S "search term" --oneline   # find when a string was added/removed
git bisect start && git bisect bad && git bisect good <sha>
```

### GitHub CLI (gh)
```bash
gh pr create --fill                  # open PR from current branch
gh pr checkout <number>              # checkout a PR locally
gh pr merge --squash --delete-branch # merge and clean up
gh issue create --title "..."        # create an issue
gh release create v1.0.0             # tag and publish a release
gh repo clone <owner>/<repo>         # clone
```

---

## Decision Points

| Situation | Action |
|-----------|--------|
| On `main` directly | Ask user to confirm or switch to a feature branch |
| Unrelated files staged | Unstage them; suggest a separate commit |
| Merge conflicts after pull | Resolve conflicts, then `git add` + `git rebase --continue` |
| Secret accidentally staged | `git reset HEAD <file>`, add to `.gitignore`, rotate the secret |
| Large binary file | Add to `.gitignore` or use Git LFS |

---

## Quality Criteria for "Done"

- [ ] Commit message follows Conventional Commits
- [ ] Only intentional files are staged
- [ ] All tests pass
- [ ] Remote branch is up to date
- [ ] PR/MR opened if working in a team workflow
