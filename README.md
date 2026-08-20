# Lofte

> *Norsk for "lift"*

A mobile-first training tracker built for Olympic weightlifters. Set a programme, load the bar, and work through each rep one at a time — Lofte calculates your weights from your personal bests and keeps a clean record of every session.

---

## Features

- **Programmes** — create named training blocks with sessions per week, length in weeks, and per-session exercise prescriptions (movement · sets · reps · % of PB)
- **Live workout screen** — one rep at a time, weight calculated automatically; override the load on any set without losing the prescription
- **Miss handling** — retry or move on; misses are logged, not hidden
- **Personal bests** — stored per athlete (Snatch, Clean & Jerk, Back Squat, Front Squat); weight rounding increment configurable
- **History** — full session log with completed/missed/attempted counts and a per-set breakdown
- **Profile** — athlete name + four PBs, updated whenever you beat one

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite 7, Tailwind CSS v4 |
| Backend | Express 5, Node.js 24 |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod v4, drizzle-zod |
| API contract | OpenAPI 3 spec → Orval codegen (React Query hooks + Zod schemas) |
| Monorepo | pnpm workspaces, TypeScript 5.9 |

---

## Repo structure

```
.
├── artifacts/
│   ├── lift-log/          # React + Vite frontend
│   └── api-server/        # Express API server
├── lib/
│   ├── api-spec/          # OpenAPI spec + Orval config (source of truth for the API contract)
│   ├── api-client-react/  # Generated React Query hooks (do not edit by hand)
│   ├── api-zod/           # Generated Zod schemas (do not edit by hand)
│   └── db/                # Drizzle schema, migrations, and DB client
└── scripts/               # Workspace-level tooling
```

---

## Getting started

### Prerequisites

- Node.js 24+
- pnpm 9+
- A PostgreSQL database

### Setup

```bash
# Install dependencies
pnpm install

# Set your database connection string
# (add to .env or your environment)
DATABASE_URL=postgresql://user:password@host:5432/lofte

# Push the schema to your database
pnpm --filter @workspace/db run push

# Start both servers (in separate terminals)
pnpm --filter @workspace/api-server run dev   # API on :8080
pnpm --filter @workspace/lift-log run dev     # Frontend on :5173
```

---

## Development

### Common tasks

```bash
# Full typecheck across all packages
pnpm run typecheck

# Build everything
pnpm run build

# Regenerate API hooks and Zod schemas after editing the OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Push DB schema changes (dev only — use migrations in production)
pnpm --filter @workspace/db run push

# Run end-to-end tests
pnpm --filter @workspace/lift-log run test:e2e
```

### After changing the API

Edit `lib/api-spec/openapi.yaml`, then run codegen. Do **not** edit the files under `lib/api-client-react/src/generated/` or `lib/api-zod/src/generated/` directly — they are overwritten on every codegen run.

### Design system

Navigate to `/design` in the running frontend for a full showcase of colour tokens, typography utilities, and every component variant. The source lives in `artifacts/lift-log/src/pages/design-system.tsx`.

---

## Design

Dark-only. Strava/Nike athletic aesthetic — strong, focused, minimal.

| Token | Value | Role |
|---|---|---|
| `--background` | `#111315` | Base canvas |
| `--card` | `#1B1E22` | Raised surface |
| `--elevated` | `#262A2F` | Workout cards |
| `--primary` | `#D84B32` | Lofte red — brand, CTAs |
| `--secondary` | `#C99A2E` | Achievement gold — PBs |
| `--foreground` | `#F4F5F7` | Primary text |

Font: [Geist](https://fonts.google.com/specimen/Geist) (variable, 100–900).

---

## Architecture notes

- **No auth.** Single-athlete. The database holds one profile row.
- **Weight calculation** is done server-side at workout creation time: `PB × percentage`, rounded to the athlete's configured increment.
- **Orval config requires `version: 3`** in `orval.config.ts` to resolve the Zod v3/v4 mismatch in generated schemas.
- **`updatedAt` on athlete profile** is nullable — a profile that has never been saved has no timestamp.
- **BottomSheet** (`artifacts/lift-log/src/components/sheet.tsx`) is the canonical overlay pattern across the app. Raw fixed-position modals are not used.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `SESSION_SECRET` | ✅ | Secret for signed sessions |
| `PORT` | — | API listen port (default `8080`) |
