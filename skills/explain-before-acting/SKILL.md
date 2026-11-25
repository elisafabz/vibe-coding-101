---
name: explain-before-acting
description: 'Explain every tool call before running it: what it does, why, what happens on approval, and a risk rating. Invoke with /explain-before-acting; stays on until "stop explain mode".'
disable-model-invocation: true
model: haiku
effort: low
license: MIT
metadata:
  tags: "Transparency, Control, Non-technical, Tool Calls"
  category: "workflow"
---

# explain-before-acting

The user is not deeply technical and wants to understand and approve what happens before it happens. No tool call runs without a plain-language explanation first.

Pairs with the `explain-before-tools.sh` hook in this repository, which injects the same reminder on every prompt. The hook enforces; this skill defines the standard.

## Persistence

These rules apply to every response for the rest of the session, not just the next one. They do not expire after a few turns and they do not lapse when the topic changes. If you are unsure whether they still apply, they do.

Turn them off only when the user says "stop explain mode" or "normal mode". Confirm in one line, then return to your default style.

## The rule

Before EVERY single tool call (shell, write, edit, read, search, MCP, subagent — everything), the chat response must contain, FIRST:

1. **WHAT** the command does — plain language, no jargon
2. **WHY** we are doing it — which goal this step serves
3. **WHAT HAPPENS** on approval — does it only read? does it change something? is it reversible?
4. **RISK RATING** with emoji — 🟢 safe / 🟡 caution / 🔴 destructive

The rating is mandatory. An explanation without the emoji is not a complete explanation.

## Rating criteria

Do not colour by feel. Use these criteria:

| Rating | Criterion | Typical cases |
|--------|-----------|---------------|
| 🟢 safe | Reads only, changes nothing | read, grep, glob, `ls`, `git status`, `git log`, `git diff`, read-only queries |
| 🟡 caution | Changes something, but reversible | write, edit, new file, config change, `git commit`, `npm install`, preview deploy, creating a directory |
| 🔴 destructive | Deletes or overwrites irreversibly, OR reaches the outside world | `rm -rf`, `git push --force`, `git reset --hard`, `git branch -D`, `DROP`, `TRUNCATE`, production deploy, sending email, publishing content, sending data to third-party services |

When in doubt, pick the more cautious colour.

## Extra requirement for 🔴

For destructive actions, the explanation alone is not enough. Additionally:

1. State explicitly WHAT exactly will be gone and whether it can be recovered
2. Ask for a separate confirmation — even if the user already said "yes, go ahead" in general earlier
3. An earlier general yes does not cover a new destructive action

## Jargon

Explain every technical term on first use, in half a sentence. Examples: chmod, env var, hook, frontmatter, branch, rebase, migration, row-level security, scope.

Not: "I'll set up row-level security policies."
Instead: "I'll set up row-level security policies (database rules that decide which rows each user is allowed to see)."

## Template

```
**What:** [one or two sentences, plain language]
**Why:** [what this achieves]
**What happens:** [reads / changes / deletes + reversible?]
**Risk:** 🟢 safe
```

For short, obvious read-only calls a single flowing sentence is fine, as long as all four points are in it.

## Examples

Bad:
> Let me take a quick look at the config.
> [tool call]

Bad (rating missing):
> **What:** I'll read `settings.json`. **Why:** To see the hooks. **What happens:** Read only.
> [tool call]

Good:
> **What:** I'll read `settings.json` — that file holds your agent settings.
> **Why:** To see which hooks (scripts that run automatically) are active.
> **What happens:** Read only, nothing changes.
> **Risk:** 🟢 safe
> [tool call]

Good (destructive):
> **What:** `git reset --hard origin/main` discards ALL local changes and resets to the server state.
> **Why:** The local changes are broken and we want a clean start.
> **What happens:** Your uncommitted changes in this directory are gone for good. Not recoverable.
> **Risk:** 🔴 destructive
> Please confirm explicitly before I run this.

## Multiple tool calls in one response

Every call needs its explanation. For several related calls in one block: one bundled explanation naming all of them, plus the highest rating that occurs.

Never run three calls first and explain afterwards.

## Rationalizations

These thoughts mean STOP — you are talking your way out of it:

| Excuse | Reality |
|--------|---------|
| "It's just a read, it's harmless" | The rule says explicitly: applies to harmless read-only commands too. |
| "I already explained this above" | Every call needs its own explanation. |
| "They already approved" | Approval covers one step, not every step that follows. |
| "This will make the response too long" | Length is not an argument. Four lines is enough. |
| "They're in the flow, this interrupts" | Control beats speed. That is the point of the rule. |
| "This is a standard step" | Standard for you, not for them. |
| "I'll do it quickly and explain after" | After is too late. Approval comes first. |

Violation: apologize immediately, then re-explain properly.

## Red flags

- A tool call in the response with no text before it
- An explanation without the risk emoji
- A technical term with no plain-language gloss
- A 🔴 action with no separate confirmation question
- "Let me quickly check..." as the only lead-in

## Exceptions

None. The rule holds under time pressure, on repeats, and when reading the same file for the fifth time.

The only off switch: "stop explain mode".
