---
name: gh-cli
description: >
  GitHub CLI expert skill. Use for any gh CLI task: switch GitHub account, login, logout,
  check auth status, manage PRs (create, review, merge, comment, list), manage issues
  (create, close, assign, label, list), repo operations (clone, fork, view, list),
  and any other gh command. Triggers include: "switch to {username} account", "gh auth switch",
  "gh login", "check which account is active", "create a PR", "merge this PR",
  "open an issue", "list my PRs", "clone this repo", "fork", or any request involving
  the gh CLI tool.
argument-hint: 'Describe what you want to do (e.g. "switch GitHub account", "create a PR for this branch")'
---

# GitHub CLI (gh)

## Auth & Account Management

### Check active account
```bash
gh auth status
```
Shows which account is active per host, token scopes, and expiry.

### Switch to a different account
```bash
# List all authenticated accounts
gh auth status

# Switch active account (interactive — pick from the list)
gh auth switch

# Switch to a specific user directly
gh auth switch --user <username>
```
> If the account is not in the list, log in first (see below).

### Add / log in to another account
```bash
gh auth login
# Follow prompts: choose GitHub.com or GHE, select auth method (browser recommended)
```

### Log out of an account
```bash
gh auth logout
# or target a specific user:
gh auth logout --user <username>
```

### Set the active account for a single command
```bash
GH_USER=<username> gh pr list
```
> Use `vscode_askQuestions` to ask the user which GitHub account to use before running this command — do not hardcode a username.

---

## PR Management

### List PRs
```bash
gh pr list                        # open PRs in current repo
gh pr list --state all            # all states
gh pr list --author @me           # only yours
gh pr list --label bug            # by label
```

### Create a PR
```bash
gh pr create --title "feat(TICKET-123): my feature" --body "Description" --base main
gh pr create --title "fix(TICKET-456): correct null handling" --body "Description" --base main
# Interactive (prompts for title, body, reviewers):
gh pr create
```

### View a PR
```bash
gh pr view 123
gh pr view 123 --web              # open in browser
```

### Review a PR
```bash
gh pr review 123 --approve
gh pr review 123 --request-changes --body "Please fix X"
gh pr review 123 --comment --body "Looks good overall"
```

### Add a comment
```bash
gh pr comment 123 --body "LGTM"
```

### Merge a PR
```bash
gh pr merge 123                   # interactive
gh pr merge 123 --squash
gh pr merge 123 --rebase
gh pr merge 123 --merge
```

### Checkout a PR locally
```bash
gh pr checkout 123
```

---

## Issue Management

### List issues
```bash
gh issue list                     # open issues
gh issue list --state closed
gh issue list --assignee @me
gh issue list --label "bug"
```

### Create an issue
```bash
gh issue create --title "Bug: X crashes on Y" --body "Steps to reproduce..."
# Interactive:
gh issue create
```

### View an issue
```bash
gh issue view 456
gh issue view 456 --web
```

### Close / reopen
```bash
gh issue close 456
gh issue reopen 456
```

### Comment on an issue
```bash
gh issue comment 456 --body "Fixed in #789"
```

### Assign / label
```bash
gh issue edit 456 --add-assignee @me
gh issue edit 456 --add-label bug --remove-label wontfix
```

---

## Repo Operations

### View current repo
```bash
gh repo view
gh repo view --web
```

### Clone a repo
```bash
gh repo clone owner/repo
gh repo clone owner/repo -- --depth 1   # shallow clone
```

### Fork a repo
```bash
gh repo fork owner/repo
gh repo fork owner/repo --clone          # fork and clone in one step
```

### List repos
```bash
gh repo list                             # your repos
gh repo list org-name                    # org repos
```

### Create a repo
```bash
gh repo create my-new-repo --public
gh repo create my-new-repo --private --source=. --push
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Active account | `gh auth status` |
| Switch account | `gh auth switch --user <username>` |
| Add account | `gh auth login` |
| List PRs | `gh pr list` |
| Create PR | `gh pr create` |
| Merge PR | `gh pr merge <number>` |
| List issues | `gh issue list` |
| Create issue | `gh issue create` |
| Clone repo | `gh repo clone owner/repo` |
| Fork repo | `gh repo fork owner/repo` |
| View in browser | `gh pr view <number> --web` |
