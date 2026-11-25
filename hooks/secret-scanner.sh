#!/bin/bash
# PreToolUse hook: blocks tool calls if any string in the input contains secret-looking patterns.
# Covers Write, Edit, MultiEdit, Bash (heredocs/echo/tee), and MCP tool inputs.

input=$(cat)
# Recursively extract all string values from the JSON input
all_strings=$(echo "$input" | jq -r '[.. | strings] | join("\n")' 2>/dev/null)

# Pattern catalog:
# - OpenAI: sk-... / sk-ant-... / sess-...
# - Google: AIza... / ya29...
# - GitHub: ghp_/gho_/ghu_/ghs_/ghr_
# - Slack: xoxb/xoxp/xoxa/xoxr/xoxs
# - AWS: AKIA[0-9A-Z]{16}
# - JWT: eyJ.eyJ.sig (Supabase service_role + others)
# - Stripe: sk_live_ / rk_live_ / pk_live_
# - Notion: secret_[A-Za-z0-9]{40,}
# - Firecrawl: fc-[A-Za-z0-9]{20,}
# - Private keys: -----BEGIN ... PRIVATE KEY-----
# - Mailgun: key-[a-z0-9]{32}
# - Twilio: SK[a-f0-9]{32} / AC[a-f0-9]{32}
# - Meta/Facebook: EAA[A-Za-z0-9]{20,}
# - Supabase Access Token: sbp_[a-f0-9]{30,}
# - Apify: apify_api_[A-Za-z0-9]{20,}
# - Figma: figd_[A-Za-z0-9]{20,}
# - Google OAuth refresh: 1//[A-Za-z0-9_-]{20,}
# - GOCSPX (Google Client Secret): GOCSPX-[A-Za-z0-9_-]{20,}
# - PostHog: phx_[A-Za-z0-9]{20,}
# - Telegram Bot Token: [0-9]{8,}:[A-Za-z0-9_-]{35}

if echo "$all_strings" | grep -qE '(sk-[a-zA-Z0-9_-]{20,}|sess-[a-zA-Z0-9]{20,}|AIza[0-9A-Za-z_-]{35}|ya29\.[a-zA-Z0-9_-]{20,}|gh[pousr]_[a-zA-Z0-9]{30,}|xox[baprs]-[a-zA-Z0-9-]{10,}|AKIA[0-9A-Z]{16}|eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}|sk_live_[a-zA-Z0-9]{20,}|rk_live_[a-zA-Z0-9]{20,}|pk_live_[a-zA-Z0-9]{20,}|secret_[A-Za-z0-9]{40,}|fc-[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|key-[a-f0-9]{32}|SK[a-f0-9]{32}|AC[a-f0-9]{32}|EAA[A-Za-z0-9]{20,}|sbp_[a-f0-9]{30,}|apify_api_[A-Za-z0-9]{20,}|figd_[A-Za-z0-9]{20,}|1//[A-Za-z0-9_-]{20,}|GOCSPX-[A-Za-z0-9_-]{20,}|phx_[A-Za-z0-9]{20,}|[0-9]{8,}:[A-Za-z0-9_-]{35})'; then
  cat <<'EOF'
{"decision":"block","reason":"🔴 SECRET DETECTED! The input looks like it contains an API key, token, JWT, or private key. Never write secrets into source code, Bash heredocs, or MCP calls - put them in a .env file and reference them via process.env.NAME. Please fix and retry."}
EOF
  exit 0
fi

exit 0
