// Auth helper: extracts and verifies the Supabase user from the request JWT.
// Use this at the top of every Edge Function that requires authentication.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonError } from "./errors.ts";

export type AuthedUser = {
  id: string;
  email: string | null;
};

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function requireUser(req: Request): Promise<AuthedUser> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Missing bearer token");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) {
    throw new AuthError("Server misconfigured: missing Supabase env", 500);
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new AuthError("Invalid or expired token");
  }

  return { id: data.user.id, email: data.user.email ?? null };
}

export function authErrorResponse(err: unknown): Response | null {
  if (err instanceof AuthError) {
    return jsonError(err.status, "unauthorized", err.message);
  }
  return null;
}
