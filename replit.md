# LeadHunter Pro

## Overview

Full-stack lead generation and CRM tool. Searches Google Places for local businesses, scores them, and tracks them through a sales pipeline.

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 + Drizzle ORM + PostgreSQL
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- **Frontend**: React + Vite + wouter + TanStack Query + shadcn/ui + Recharts
- **Build**: esbuild (CJS bundle for API server)

## Artifacts

| Artifact | Path | Port | Purpose |
|---|---|---|---|
| `artifacts/api-server` | `/api` | 8080 | Express REST API |
| `artifacts/leadhunter-pro` | `/` | 22067 | React frontend |

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — build composite lib declarations (run this first if DB/API types are stale)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
  - After codegen, overwrite `lib/api-zod/src/index.ts` to only export `from "./generated/api"` (NOT `"./generated/types"`)
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Architecture

### Database (`lib/db`)
- `leadsTable` — all saved leads with scoring, stage, notes, AI qualification
- `searchesTable` — search history with metadata

### API Routes (`artifacts/api-server/src/routes/`)
- `leads.ts` — CRUD, bulk-update, AI qualify, outreach template generation
- `searches.ts` — search history CRUD
- `analytics.ts` — summary, stage breakdown, score distribution, followups
- `maps-proxy.ts` — proxies Google Places/Geocode API calls (server-side key security)

### Frontend Pages (`artifacts/leadhunter-pro/src/pages/`)
- `dashboard.tsx` — analytics stats, charts, follow-up queue
- `leads.tsx` — sortable table, bulk actions, stage filter, lead detail sheet
- `pipeline.tsx` — drag-and-drop kanban by stage
- `followups.tsx` — overdue/upcoming call queue
- `searches.tsx` — search history with delete
- `search.tsx` — Google Places search flow with progress log, AI scoring, bulk save

### Shared Components
- `lead-score-badge.tsx` — color-coded score badge (green ≥70, amber ≥40, red <40)
- `lead-detail-sheet.tsx` — full side panel: stage, AI qualify, outreach templates, notes

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned)
- `VITE_GOOGLE_API_KEY` — Google Places + Geocoding API key (set in env secrets for search to work)
- `SESSION_SECRET` — session signing secret

## Important Notes

- `lib/api-zod/src/index.ts` must only export `from "./generated/api"`. Codegen regenerates this file; after any codegen run, immediately fix the export to avoid TS conflicts.
- Express route order matters: `/leads/bulk-action` must be registered BEFORE `/leads/:id`.
- AI qualification and outreach templates use rule-based logic (no external LLM required).
- Dark-only theme with electric green primary (`142 71% 45%`).
