// Restrictive CORS helper for Supabase Edge Functions.
// Set ALLOWED_ORIGIN as a Function secret per environment, e.g.
//   supabase secrets set ALLOWED_ORIGIN=https://your-venture.at
// Never use "*" in production.

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "http://localhost:5173";

// Optional: regex pattern for deploy-preview URLs (Netlify, Vercel).
// Set as env var, e.g.: CORS_PREVIEW_PATTERN=^https:\/\/[a-z0-9-]+--myapp\.netlify\.app$
const previewPattern = Deno.env.get("CORS_PREVIEW_PATTERN");

const defaultMethods = "POST, GET, OPTIONS";

/**
 * Returns CORS headers only if the request's Origin matches the allowed origin
 * or the optional deploy-preview pattern.
 * Without a request, returns static headers (backward-compatible fallback).
 */
export function getCorsHeaders(
  methods?: string[],
  req?: Request,
): Record<string, string> {
  const allowMethods = methods
    ? [...new Set([...methods, "OPTIONS"])].join(", ")
    : defaultMethods;

  // If a request is provided, validate its Origin header.
  if (req) {
    const origin = req.headers.get("Origin");
    const isExactMatch = origin === allowedOrigin;
    const isPreviewMatch = previewPattern && origin
      ? new RegExp(previewPattern).test(origin)
      : false;

    if (!isExactMatch && !isPreviewMatch) {
      // Origin doesn't match — return only Vary header, no CORS access.
      return { Vary: "Origin" };
    }

    // Echo the matched origin (required for non-wildcard CORS)
    return {
      "Access-Control-Allow-Origin": origin!,
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": allowMethods,
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    };
  }

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": allowMethods,
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

// Backwards-compatible static headers (used by errors.ts, jsonOk, etc.)
export const corsHeaders = getCorsHeaders();

export function handlePreflight(
  req: Request,
  methods?: string[],
): Response | null {
  if (req.method === "OPTIONS") {
    const headers = getCorsHeaders(methods, req);
    // If origin didn't match, respond 403 instead of granting access.
    if (!headers["Access-Control-Allow-Origin"]) {
      return new Response("Forbidden", { status: 403, headers });
    }
    return new Response(null, { status: 204, headers });
  }
  return null;
}
