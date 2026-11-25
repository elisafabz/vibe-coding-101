// Zod-based input validation for Edge Functions.
// Always validate request bodies at the API boundary.

import { z, ZodSchema } from "https://esm.sh/zod@4.3.6";
import { jsonError } from "./errors.ts";

export class ValidationError extends Error {
  issues: z.ZodIssue[];
  constructor(issues: z.ZodIssue[]) {
    super("Validation failed");
    this.issues = issues;
  }
}

export async function parseBody<T>(
  req: Request,
  schema: ZodSchema<T>,
): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ValidationError([
      { code: "custom", path: [], message: "Invalid JSON body" } as z.ZodIssue,
    ]);
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ValidationError(result.error.issues);
  }
  return result.data;
}

export function validationErrorResponse(err: unknown): Response | null {
  if (err instanceof ValidationError) {
    // SECURITY: never leak Zod validation details (field names, schemas) to the
    // client. Log them server-side for debugging, return only a generic message.
    console.error("Validation failed:", err.issues);
    return jsonError(400, "validation_failed", "Request body is invalid");
  }
  return null;
}

export { z };
