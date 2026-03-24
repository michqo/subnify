# Subnify

Code-first VLSM subnet planning app built with Next.js, Supabase Auth, and OpenRouter-powered AI design.

## What this repo contains

- Home marketing route and app shell
- Subnet calculator and allocation history
- AI Designer API endpoint (`app/api/ai-designer/route.ts`)
- Supabase-backed auth + user-scoped data via RLS policies

## Tech stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Supabase (Auth + Postgres)
- OpenRouter (through OpenAI SDK)

## Code map

- App routes: [app](app)
- Shared UI: [components](components)
- Supabase clients: [lib/supabase/client.ts](lib/supabase/client.ts), [lib/supabase/server.ts](lib/supabase/server.ts)
- Auth provider/dialog: [components/core/auth-provider.tsx](components/core/auth-provider.tsx), [components/core/auth-dialog.tsx](components/core/auth-dialog.tsx)
- Edge middleware for `/app/*`: [middleware.ts](middleware.ts)
- DB migrations: [supabase/migrations](supabase/migrations)

## Local development

```bash
pnpm install
pnpm dev
```

Useful scripts:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Self-hosting setup

### 1) Create `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

OPENROUTER_API_KEY=
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free
AI_DESIGN_DAILY_LIMIT=3
```

Environment variables used by code:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` in [lib/supabase/client.ts](lib/supabase/client.ts), [lib/supabase/server.ts](lib/supabase/server.ts), and [middleware.ts](middleware.ts)
- `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `AI_DESIGN_DAILY_LIMIT` in [app/api/ai-designer/route.ts](app/api/ai-designer/route.ts)

### 2) Supabase project + database

1. Create a Supabase project.
2. Run migrations from [supabase/migrations](supabase/migrations) against your database.
3. Confirm tables exist:
	- `calculations`
	- `ai_design_requests`
4. Keep Row Level Security enabled (migrations already create user-scoped policies).

### 3) Configure Supabase Auth

Subnify uses Supabase Auth for:

- Email/password sign-in/sign-up
- GitHub OAuth sign-in

In Supabase dashboard:

1. Enable Email provider.
2. Enable GitHub provider.
3. Add GitHub OAuth app credentials (Client ID + Client Secret).
4. Set redirect URLs for your environments.

App auth flow details:

- OAuth redirect target is `${origin}/app` (see [components/core/auth-dialog.tsx](components/core/auth-dialog.tsx)).
- Email confirmation redirect is `${origin}/app?emailConfirmed=1` (same file).

For local development this usually means allowing:

- `http://localhost:3000/app`
- `http://localhost:3000/app?emailConfirmed=1`

### 4) Configure GitHub OAuth app

In GitHub Developer Settings:

1. Create an OAuth app.
2. Set Homepage URL to your app origin (for local: `http://localhost:3000`).
3. Set Authorization callback URL to your Supabase callback URL from the provider settings.
4. Copy Client ID/Secret into the GitHub provider config in Supabase.

### 5) Configure OpenRouter

1. Create an OpenRouter API key.
2. Set `OPENROUTER_API_KEY` in `.env.local`.
3. Optionally set `OPENROUTER_MODEL`.
4. Optionally tune `AI_DESIGN_DAILY_LIMIT` for per-user 24h quota.

## Notes

- `/app/*` routes pass through Supabase session middleware in [middleware.ts](middleware.ts).
- AI Designer requests are authenticated and logged to `ai_design_requests`.
