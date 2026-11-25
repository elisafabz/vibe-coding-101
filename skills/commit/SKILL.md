---
name: commit
description: Create a git commit with a thoughtful message
disable-model-invocation: true
model: haiku
effort: low
---

Create a git commit for the current changes:

1. Run `git status` to see all untracked and modified files (never use -uall flag)
2. Run `git diff` to see both staged and unstaged changes
3. Run `git log --oneline -5` to match existing commit message style
4. Analyze the changes and draft a concise commit message that focuses on the "why" rather than the "what"
5. Stage the relevant files (prefer specific files over `git add .`)
6. Create the commit
7. Run `git status` after to confirm success

$ARGUMENTS
