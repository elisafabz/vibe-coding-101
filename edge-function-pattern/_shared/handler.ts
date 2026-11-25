// createHandler() - wraps Edge Function boilerplate into a single function.
//
// For edge cases where createHandler doesn't fit (streaming, WebSockets),
// use the individual helpers directly:
//   import { handlePreflight } from "./cors.ts";
//   import { requireUser } from "./auth.ts";
//   import { enforceRateLimit } from "./rate-limit.ts";
//   import { parseBody, z } from "./validate.ts";
//   import { jsonOk, jsonError } from "./errors.ts";

import { handlePreflight } from "./cors.ts";
import { requireUser, authErrorResponse, type AuthedUser } from "./auth.ts";
import { enforceRateLimit, rateLimitErrorResponse } from "./rate-limit.ts";
import { validationErrorResponse } from "./validate.ts";
import { jsonError } from "./errors.ts";

type HandlerOptions = {
  /** Skip authentication. Default: false (requires auth). */
  public?: boolean;
  /** Allowed HTTP methods. Default: ["POST"]. */
  methods?: string[];
  /** Rate limiting config. Omit to disable. */
  rateLimit?: {
    max: number;
    windowSeconds: number;
    /** Override the auto-generated key prefix. Default: function name from URL path. */
    keyPrefix?: string;
  };
};

/**
 * Returns a request handler function. Call with Deno.serve():
 *
 *   Deno.serve(createHandler(async (req, user) => {
 *     const body = await parseBody(req, MySchema);
 *     return jsonOk({ message: "ok" });
 *   }));
 *
 * Validation is NOT automatic - call parseBody() inside your handler.
 * The catch block handles thrown ValidationError automatically.
 */
export function createHandler(
  fn: (req: Request, user: AuthedUser | null) => Promise<Response>,
  options?: HandlerOptions,
): (req: Request) => Promise<Response> {
  const methods = options?.methods ?? ["POST"];
  const isPublic = options?.public ?? false;

  return async (req: Request): Promise<Response> => {
    // 1. CORS preflight
    const preflight = handlePreflight(req, methods);
    if (preflight) return preflight;

    // 2. Method check
    if (!methods.includes(req.method)) {
      return jsonError(405, "method_not_allowed", `Use ${methods.join(", ")}`);
    }

    try {
      // 3. Auth (skip if public)
      let user: AuthedUser | null = null;
      if (!isPublic) {
        user = await requireUser(req);
      }

      // 4. Rate limiting (if configured)
      if (options?.rateLimit) {
        const prefix =
          options.rateLimit.keyPrefix ?? getFunctionName(req.url);
        const key = user
          ? `${prefix}:${user.id}`
          : `${prefix}:${getClientIp(req)}`;
        await enforceRateLimit(key, {
          max: options.rateLimit.max,
          windowSeconds: options.rateLimit.windowSeconds,
        });
      }

      // 5. Run handler
      return await fn(req, user);
    } catch (err) {
      return (
        authErrorResponse(err) ??
        rateLimitErrorResponse(err) ??
        validationErrorResponse(err) ??
        jsonError(500, "internal_error", "Unexpected server error")
      );
    }
  };
}

/** Extract function name from Supabase Edge Function URL path. */
function getFunctionName(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    // Supabase URL: /functions/v1/<function-name>
    const segments = pathname.split("/").filter(Boolean);
    return segments[segments.length - 1] ?? "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Extract client IP from request headers (first IP from x-forwarded-for).
 * Returns "unknown" if no IP headers are present. In that case, all
 * headerless requests share one rate-limit bucket. Acceptable for
 * prototypes; production ventures should ensure their proxy sets
 * x-forwarded-for or use authenticated endpoints instead.
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can be comma-separated; first = client
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}
