# Subagent routing: the right model for each task

Paste this into your project's `CLAUDE.md` (or your global `~/.claude/CLAUDE.md`). It keeps token costs predictable and puts the expensive models only where they matter.

## The principle

Always use the cheapest model and the lowest effort that can do the task safely. Pay more only when a mistake is expensive: security, auth, payments, hard bugs.

## Routing table

Define one agent per row in `~/.claude/agents/` (or `.claude/agents/`) with `model` and `effort` set in its frontmatter. When you delegate, pick the agent by task type and do not override its model.

| Task | Agent type | Model | Effort |
|------|-----------|-------|--------|
| Plan a feature | `feature-planner` | most capable (e.g. `opus`) | high |
| Security audit | `security-auditor` | most capable | high or higher |
| Auth and payments | `auth-payments-engineer` | most capable | high or higher |
| Hard, persistent bug | `bug-hunter` | most capable | high or higher |
| Code review | `code-reviewer` | `opus` | high |
| Frontend UI | `frontend-ui-builder` | `opus` or `sonnet` | medium |
| Build a feature | `feature-builder` | `sonnet` | medium |
| Write tests | `test-writer` | `sonnet` | low |
| Explore a codebase | `codebase-explorer` | `haiku` | low |
| Renames, boilerplate, scaffolding | `boilerplate-writer` | `haiku` | low |

If a task is not in the table, use the closest row.

## Rules

1. **Low-effort tasks always go to cheap agents.** Searching, renaming, moving files, boilerplate, and simple translations never run on your most expensive model.
2. **Match the task to the agent type, not to your habit.** One main session that does everything is the most expensive setup.
3. **Pass `model` and `effort` explicitly** when you dispatch an agent that is not predefined. Otherwise it inherits the main session's model, which is usually the most expensive one.
4. **Fan-out is expensive.** A skill that dispatches many parallel agents should run its lead on a strong model, its workers on `sonnet`, and pure web-research workers on `haiku`. Mark such skills as heavy and make them manual-only with `disable-model-invocation: true`.
5. **Every skill declares `model` and `effort` in its frontmatter.** A skill without both is unfinished.
6. **Do not duplicate research.** Before spawning an agent, check whether you already have the answer.

## Example agent definition

```markdown
---
name: codebase-explorer
description: Use for exploring or searching a codebase: finding files, understanding structure, locating where something is implemented.
model: haiku
effort: low
tools: Read, Grep, Glob, Bash
---

Explore the codebase and report what you find. Do not edit files.
```
