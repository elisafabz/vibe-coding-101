# The edge function pattern

**Rule: your frontend never talks to the database directly for anything that matters.**

## Why?

Everything in your frontend is public. Anyone can open the browser dev tools and see your code, your requests, and any keys you shipped. If your business logic lives in the frontend, anyone can skip it: change prices, bypass limits, read other people's data.

The fix: business logic lives in a small server function (here: a Supabase Edge Function). The frontend calls the function, the function checks who you are, validates the input, and only then touches the database - with the privileged key that only exists on the server.

```
Browser ──(publishable key)──▶ Edge Function ──(service_role key)──▶ Database
                                   │
                                   ├─ checks auth (who is calling?)
                                   ├─ validates input (is the data sane?)
                                   ├─ rate limits (is someone hammering us?)
                                   └─ runs the actual logic, atomically
```

Two keys, two worlds:

- **Publishable/anon key** - safe to ship in the frontend. Can only do what your Row Level Security policies allow.
- **`service_role` key** - full database access, bypasses all policies. Lives ONLY in the edge function environment. If this key ever appears in frontend code, treat it as leaked and rotate it.

## What's in this folder

| File | Purpose |
|------|---------|
| `_shared/handler.ts` | Wraps every function: CORS, error handling, JSON responses in one place |
| `_shared/auth.ts` | Verifies the caller's JWT - who is making this request? |
| `_shared/validate.ts` | Input validation with Zod - never trust request bodies |
| `_shared/cors.ts` | CORS headers, locked to your allowed origins |
| `_shared/rate-limit.ts` | Simple rate limiting so one caller can't hammer you |
| `_shared/errors.ts` | Consistent error types and responses |
| `example-hello/index.ts` | A minimal function using all of the above - copy it as your starting point |

## Use it

Copy `_shared/` into your `supabase/functions/` directory, then copy `example-hello/` and rename it for each new function. Deploy with `supabase functions deploy <name>`.
