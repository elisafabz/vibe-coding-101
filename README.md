# vibe-coding-101

**Learn the basics. Safely.**

Guardrails for people who are new to AI-assisted coding ("vibe coding") with [Claude Code](https://claude.com/claude-code). When you let an AI write and run code for you, two things go wrong most often:

1. **Secrets leak.** An API key ends up in your source code, gets committed, gets pushed - and now it's public.
2. **You approve things you don't understand.** The AI asks "run this command?" and you click yes without knowing what it does.

These two hooks fix exactly that. Two optional skills (below) build on them.

## Hooks

Hooks are small shell scripts that Claude Code runs automatically around tool calls. They live in `~/.claude/hooks/` and are wired up in `~/.claude/settings.json`.

| Hook | Event | What it does |
|------|-------|--------------|
| `secret-scanner.sh` | PreToolUse | Blocks any tool call whose input contains secret-looking patterns (API keys, JWTs, private keys, tokens from 20+ providers). Secrets never land in source code, heredocs, or MCP calls - the AI is forced to use a `.env` file instead. |
| `explain-before-tools.sh` | UserPromptSubmit | Makes the agent explain every tool call in plain language BEFORE running it: what it does, why, what happens if you approve, and a risk rating (🟢 safe / 🟡 caution / 🔴 destructive). You always know what you're saying yes to. |

## Install

```bash
mkdir -p ~/.claude/hooks
cp hooks/*.sh ~/.claude/hooks/
chmod +x ~/.claude/hooks/*.sh
```

Then register them in `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit|Bash",
        "hooks": [
          { "type": "command", "command": "~/.claude/hooks/secret-scanner.sh" }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          { "type": "command", "command": "~/.claude/hooks/explain-before-tools.sh" }
        ]
      }
    ]
  }
}
```

Requires `jq` (`brew install jq`).

## Templates

Safe starting files for your first deployed app - copy them into a new project:

| File | What it does |
|------|--------------|
| `templates/.gitignore` | Keeps secrets and junk out of git: `.env` files, credentials, MCP config, editor and test artifacts. Add this BEFORE your first commit. |
| `templates/.env.example` | The pattern the secret-scanner enforces: real keys go in `.env` (gitignored), the `.env.example` documents which variables exist - with empty values. |
| `templates/_headers` | Security headers for Netlify (HSTS, CSP, X-Frame-Options, and more) so your first deployed app isn't wide open. |
| `templates/subagent-routing.md` | A routing table and rules for your `CLAUDE.md`: which agent type and model for which task, so cheap tasks run on cheap models and expensive models are reserved for security, auth, and hard bugs. |

## The edge function pattern

`edge-function-pattern/` shows why business logic never belongs in the frontend, and gives you a copy-paste starting point: a Supabase Edge Function skeleton with auth, input validation, CORS, and rate limiting built in. Read its [README](edge-function-pattern/README.md) - it's the single most important architecture habit for beginners.

## The 6 rules of safe vibe coding

1. **Secrets never go in code.** API keys and passwords live in a `.env` file that git ignores. The secret-scanner hook enforces this automatically.
2. **Understand before you approve.** Never say yes to a command you can't explain in one sentence. The explain-before-tools hook makes the agent explain first.
3. **Business logic behind an API.** The frontend never touches the database directly with privileged keys - see the edge function pattern.
4. **Destructive actions need a second look.** `git push --force`, `rm -rf`, `DROP TABLE`: always stop, read, confirm explicitly - even if you said "yes" to something earlier.
5. **Small scope, small blast radius.** Ask the AI for one change at a time. Review what changed before asking for the next one.
6. **Cheapest model that safely does the job.** Route tasks to agent types by difficulty: exploration and boilerplate on `haiku`, building on `sonnet`, security, auth, and hard bugs on your strongest model. See `templates/subagent-routing.md`.

## Skills

| Skill | What it does |
|-------|--------------|
| `skills/commit` | A `/commit` command that creates thoughtful git commits: reviews the changes, matches your commit style, stages specific files (never blind `git add .`), and writes a message that explains the why. |
| `skills/explain-before-acting` | An `/explain-before-acting` mode that stays on for the session: before every tool call the agent says what it does, why, what happens on approval, and a risk rating. Turn it off with "stop explain mode". Pairs with the `explain-before-tools.sh` hook. |

Install:

```bash
cp -R skills/commit ~/.claude/skills/
cp -R skills/explain-before-acting ~/.claude/skills/
```

Both skills only run when you invoke them (`disable-model-invocation: true`) and are set to the cheapest model (`haiku`, low effort).

## Ready to build? Start from a safe base

The [react-supabase-boilerplate](https://github.com/elisafabz/react-supabase-boilerplate) is a React, Vite, Tailwind, shadcn/ui and Supabase starter that applies these rules from the first commit: business logic in Edge Functions, security headers, tests, CI, and a launch checklist.

## Why hooks and not just prompts?

You could ask the AI nicely to "never write secrets into code" - but prompts get forgotten, and one bad moment is enough. Hooks are enforced by the harness itself, on every single tool call, no exceptions. That's the difference between a habit and a guardrail.

## License

MIT
