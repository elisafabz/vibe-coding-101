// DB-backed rate limiter using atomic upsert.
// Requires a Postgres function + table (run once per project):
//
//   create table if not exists public.rate_limits (
//     key text primary key,
//     window_start timestamptz not null default now(),
//     count integer not null default 1
//   );
//   alter table public.rate_limits enable row level security;
//
//   create or replace function public.check_rate_limit(
//     p_key text,
//     p_max integer,
//     p_window_seconds integer
//   ) returns integer as $$
//   declare
//     v_count integer;
//   begin
//     insert into public.rate_limits (key, window_start, count)
//     values (p_key, now(), 1)
//     on conflict (key) do update set
//       count = case
//         when rate_limits.window_start + (p_window_seconds || ' seconds')::interval < now()
//         then 1
//         else rate_limits.count + 1
//       end,
//       window_start = case
//         when rate_limits.window_start + (p_window_seconds || ' seconds')::interval < now()
//         then now()
//         else rate_limits.window_start
//       end
//     returning count into v_count;
//
//     return v_count;
//   end;
//   $$ language plpgsql;
//
// Usage in an Edge Function:
//   await enforceRateLimit(`hello:${user.id}`, { max: 10, windowSeconds: 60 });

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonError } from "./errors.ts";

export class RateLimitError extends Error {
  retryAfter: number;
  constructor(retryAfter: number) {
    super("Rate limit exceeded");
    this.retryAfter = retryAfter;
  }
}

function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    throw new Error(
      "Server misconfigured: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function enforceRateLimit(
  key: string,
  opts: { max: number; windowSeconds: number },
): Promise<void> {
  const supabase = serviceClient();

  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_max: opts.max,
    p_window_seconds: opts.windowSeconds,
  });

  if (error) {
    // Log but don't block requests if rate limiting itself fails.
    // This prevents a missing table from silently disabling rate limits
    // while also not breaking the API if the table isn't set up yet.
    console.error("Rate limit check failed:", error.message);
    console.warn(
      "⚠️ RATE LIMITING DISABLED: rate_limits table or check_rate_limit function missing. " +
      "Run the migration in supabase/migrations/ to enable rate limiting."
    );
    return;
  }

  if (data > opts.max) {
    throw new RateLimitError(opts.windowSeconds);
  }
}

export function rateLimitErrorResponse(err: unknown): Response | null {
  if (err instanceof RateLimitError) {
    const res = jsonError(429, "rate_limited", "Too many requests");
    res.headers.set("Retry-After", String(err.retryAfter));
    return res;
  }
  return null;
}
