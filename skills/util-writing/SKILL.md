---
name: util-writing
description: >
  Use this skill to correct grammar, improve clarity, and proofread any written content
  in a software development context. Triggers include: "fix grammar", "correct this",
  "improve writing", "proofread", "make this clearer", "rewrite this", or any request
  to review commit messages, pull request descriptions, Javadoc, code comments, README
  files, ticket descriptions, or technical documentation.
---

# Writing & Grammar Skill

Help developers produce clear, professional, and accurate written content without changing
the technical meaning. Covers grammar correction, clarity improvement, and tone adjustment.

## Core Principle

> Good writing is invisible — the reader focuses on the message, not the words.
> Never change technical meaning while fixing grammar.

---

## Step 1 — Identify the Content Type

Adjust style expectations based on context:

| Content Type         | Tone         | Key Rules |
|----------------------|--------------|-----------|
| Commit message       | Imperative   | ≤72 chars subject, present tense verb ("Add", "Fix", "Remove") |
| PR description       | Professional | Clear summary, bullet list of changes, link to ticket |
| Code comment         | Concise      | Explains *why*, not *what*; no redundant restatements of code |
| Javadoc              | Formal       | Complete sentences, `@param`/`@return`/`@throws` populated |
| README / docs        | Friendly     | Scannable, headers, examples |
| Ticket / user story  | Clear        | Actor + action + outcome; acceptance criteria bulleted |

---

## Step 2 — Apply Grammar & Clarity Rules

### Grammar
- Fix subject-verb agreement, tense consistency, article usage (a/an/the)
- Correct punctuation: commas, periods, semicolons, apostrophes
- Fix spelling errors; preserve intentional technical spellings (e.g. `null`, `boolean`, `getBySomeId`)

### Clarity
- Replace vague words: "thing", "stuff", "it", "some" → specific nouns
- Eliminate redundancy: "completely finished" → "finished"
- Prefer active voice: "The service processes the request" over "The request is processed by the service"
- Shorten sentences over 25 words by splitting at conjunctions

### Tone
- Remove overly casual language in technical docs ("basically", "just", "kinda", "super easy")
- Remove filler phrases: "As you can see", "It is worth noting that", "Please be advised"
- Avoid hedging in commit messages and PR titles: "maybe fix", "try to improve" → "Fix", "Improve"

---

## Step 3 — Preserve Technical Content

**Never alter:**
- Code identifiers (`camelCase`, `snake_case`, `UPPER_CASE`)
- Library/framework names (`Spring Boot`, `JUnit`, `Kafka`)
- Acronyms and domain terms agreed upon by the team
- URLs, version numbers, configuration keys

When unsure whether a term is a typo or a technical name — flag it rather than changing it.

---

## Step 4 — Output Format

Provide two blocks:

```
### Rewritten
[corrected version here]

### Changes Made
- [brief description of each change, e.g. "Fixed subject-verb agreement in sentence 2"]
- [...]
```

For commit messages or short text (≤2 sentences), skip the "Changes Made" list and just output the rewritten version with a one-line explanation.

---

## Commit Message Format (Reference)

```
<type>(<scope>): <short summary>

<optional body — what and why, not how>

<optional footer — ticket reference, breaking change note>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `style`

Example:
```
fix(auth): return 401 instead of 500 on expired token

Token expiry was caught too late in the filter chain, causing an
unhandled exception. Now validated before reaching the service layer.

Closes #342
```

---

## Anti-Patterns to Avoid

- Do NOT paraphrase so heavily that the original meaning shifts
- Do NOT apply casual blog tone to formal technical docs, or vice versa
- Do NOT "improve" code — only prose around it
- Do NOT remove technical details to make text shorter
