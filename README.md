# Subnify

Subnify is a VLSM subnet planning app with history and an AI-assisted designer.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind v4 + shadcn/ui
- Supabase (Auth + Postgres + RLS)
- OpenRouter via OpenAI SDK (AI designer)

## Features

- Subnet planner + VLSM allocation
- AI prompt → generated subnet plan
- Save, restore, and update plans in history
- PDF export + visualizer

## Run locally

```bash
pnpm install
pnpm dev
```

Other useful commands:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

OPENROUTER_API_KEY=
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free
AI_DESIGN_DAILY_LIMIT=3
```

## Setup notes

1. Create a Supabase project.
2. Run all SQL migrations in [supabase/migrations](supabase/migrations).
3. Enable auth providers you want (Email, GitHub).
4. Configure redirect URLs for local/prod auth callbacks.

## Project map

- App routes: [app](app)
- Shared UI/components: [components](components)
- Supabase clients: [lib/supabase](lib/supabase)
- Database migrations: [supabase/migrations](supabase/migrations)
