// Example Edge Function using createHandler().
// Copy this file as a template for new functions.
//
// Deploy:  supabase functions deploy example-hello
// Invoke:  POST /functions/v1/example-hello  body: { "name": "Ada" }

import { createHandler } from "../_shared/handler.ts";
import { parseBody, z } from "../_shared/validate.ts";
import { jsonOk } from "../_shared/errors.ts";

const BodySchema = z.object({
  name: z.string().min(1).max(100),
});

Deno.serve(
  createHandler(
    async (req, user) => {
      if (!user) {
        return new Response(
          JSON.stringify({ error: "Not authenticated" }),
          { status: 401 },
        );
      }
      const body = await parseBody(req, BodySchema);
      return jsonOk({
        message: `Hello ${body.name}, your user id is ${user.id}`,
      });
    },
    { rateLimit: { max: 10, windowSeconds: 60 } },
  ),
);
