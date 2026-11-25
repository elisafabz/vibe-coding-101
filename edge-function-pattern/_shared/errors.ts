// Uniform error response format across all Edge Functions.
// Always shape: { error: { code, message, details? } }

import { corsHeaders } from "./cors.ts";

export function jsonError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): Response {
  return new Response(
    JSON.stringify({ error: { code, message, details } }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

export function jsonOk<T>(body: T, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
