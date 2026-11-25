#!/bin/bash
# UserPromptSubmit hook: injects a reminder into every prompt asking the agent to
# explain each tool call in plain language BEFORE running it.
# Great for non-deep-technical users who want to understand and approve what is happening.
# Tip: adjust the language and wording below to your needs.

cat <<'EOF'
{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":"🚨 REMINDER: Before EVERY tool call (Bash/Write/Edit/etc.) you MUST first explain in the chat response, in simple plain language: (1) WHAT the command does, (2) WHY we are doing it, (3) WHAT HAPPENS if the user approves (read? change? reversible?), (4) RISK RATING with emoji 🟢 safe / 🟡 caution / 🔴 destructive. This also applies to harmless read-only commands. NO exceptions. The user is not deeply technical."}}
EOF
exit 0
