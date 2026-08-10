# Subnify

Subnify is an IPv4 VLSM planning workspace in the Miqal app ecosystem. It combines deterministic subnet calculation, live capacity diagnostics, technical result views, cloud history, and an optional AI requirements assistant.

## Stack

- Next.js 16 + React 19 + TypeScript
- `@miqal/theme` + Tailwind v4 + shadcn/ui
- Supabase (Auth + Postgres + RLS)
- OpenRouter via OpenAI SDK (AI designer)

## Product capabilities

- Strict IPv4, CIDR, network-boundary, duplicate-name, and capacity diagnostics
- Reusable office, segmented network, and homelab templates
- VLSM results synchronized across table, allocation map, and hierarchy views
- Copyable addresses and stable, Miqal-styled PDF exports
- AI requirements preview with explicit apply control; manual calculation stays authoritative
- Cloud history with search, source filters, rename, duplicate, reopen, and confirmed deletion
- Responsive Miqal product shell, light/dark themes, keyboard controls, reduced-motion support

## Overhaul comparison

| Area | Earlier app | Current app |
| --- | --- | --- |
| Visual system | Local teal styling and generic card stack | Shared `@miqal/theme`, Miqal header, compact technical workspace |
| Planning | Form followed by output | Live diagnostics, capacity pressure, templates, stale-result status |
| Results | Cards and separate visualizer | Synchronized table, allocation map, and hierarchy |
| AI | Separate designer route | Contextual requirements dialog with preview/apply boundary |
| History | View and delete | Search, filter, rename, duplicate, open, confirmed delete |
| Landing | Generic feature marketing | Product proof, real subnet data, direct workflow explanation |

Recommended future increments: IPv6 planning, import/export JSON, subnet reservations, plan comparison, and team workspaces. These remain outside current IPv4 scope.

## Run locally

```bash
pnpm install
pnpm dev
```

Other useful commands:

```bash
pnpm test
pnpm test:e2e
pnpm lint
pnpm typecheck
pnpm build
```

Playwright installs its browser once per machine:

```bash
pnpm exec playwright install chromium
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
- Planner: `/app`
- Cloud history: `/app/history`
- Technical reference: `/app/help`
- Legacy `/app/designer` links redirect into the authenticated planner assistant
- Shared UI/components: [components](components)
- Planner diagnostics and templates: [lib/planner](lib/planner)
- Supabase clients: [lib/supabase](lib/supabase)
- Database migrations: [supabase/migrations](supabase/migrations)
- Product specification: [docs/superpowers/specs/2026-08-10-subnify-miqal-overhaul-design.md](docs/superpowers/specs/2026-08-10-subnify-miqal-overhaul-design.md)
