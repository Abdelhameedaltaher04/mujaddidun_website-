# Mujaddidun Charity and Development Association — Web Platform

A production-quality, bilingual (Arabic RTL / English LTR) web platform for the Mujaddidun Charity and Development Association. The project is developed **incrementally** — this repository currently contains the initialized architecture only; features are added phase by phase.

## Tech Stack

| Layer          | Technology                                              |
| -------------- | ------------------------------------------------------- |
| Frontend       | React 18, Vite, TypeScript, Tailwind CSS v4, wouter     |
| Backend        | Express 5, TypeScript                                   |
| Database       | PostgreSQL, Drizzle ORM                                 |
| API contract   | OpenAPI 3.1 → generated Zod schemas + React Query hooks |
| Authentication | Replit Auth (to be integrated in a later phase)         |
| Tooling        | pnpm workspaces, ESLint (flat config), Prettier         |

## Repository Structure

This is a pnpm monorepo:

```
├── artifacts/
│   ├── web/                 # Frontend (React + Vite)
│   │   ├── public/          # Static public assets
│   │   └── src/
│   │       ├── components/  # Shared reusable components (ui/ = primitives)
│   │       ├── features/    # Self-contained feature modules
│   │       ├── layouts/     # Page shells (RTL/LTR aware)
│   │       ├── pages/       # Route-level screens
│   │       ├── hooks/       # Shared hooks
│   │       ├── contexts/    # React context providers
│   │       ├── services/    # Data-access layer (generated API client)
│   │       ├── routes/      # Route table
│   │       ├── assets/      # Imported static assets
│   │       ├── styles/      # Global styles beyond index.css
│   │       ├── types/       # Shared TS types
│   │       ├── utils/       # Pure helpers
│   │       └── lib/         # Library glue (cn, query client)
│   │
│   └── api-server/          # Backend (Express)
│       └── src/
│           ├── routes/      # HTTP route definitions
│           ├── controllers/ # Request/response handling + validation
│           ├── services/    # Business logic
│           ├── models/      # Domain types & mappers
│           ├── db/          # Data-access helpers
│           ├── middlewares/ # Express middlewares
│           ├── config/      # Typed environment configuration
│           └── utils/       # Pure helpers
│
├── lib/                     # Shared workspace libraries
│   ├── api-spec/            # OpenAPI spec (single source of truth for the API)
│   ├── api-zod/             # Generated Zod schemas (server validation)
│   ├── api-client-react/    # Generated React Query hooks (frontend)
│   └── db/                  # Drizzle ORM schema & database client
│
├── eslint.config.js         # ESLint flat config (monorepo-wide)
├── .prettierrc.json         # Prettier configuration
└── pnpm-workspace.yaml      # Workspace definition
```

Architecture details: see `artifacts/web/src/ARCHITECTURE.md` and `artifacts/api-server/src/ARCHITECTURE.md`.

## Key Principles

- **Clean architecture** — strict layering; dependencies point inward (routes → controllers → services → data).
- **Contract-first API** — every endpoint is defined in `lib/api-spec/openapi.yaml` first; codegen produces server validation schemas and typed client hooks.
- **Feature modularity** — frontend features are isolated modules with an explicit public API.
- **Bilingual by design** — Arabic (RTL, default) and English (LTR); use CSS logical properties so layouts mirror correctly.
- **No hand-written API types** — all API types flow from the OpenAPI spec.

## Installation

```bash
pnpm install
```

## Development

The frontend and API run as managed workflows in this environment (they inject `PORT`, `BASE_PATH`, and `DATABASE_URL` automatically).

Common commands:

```bash
pnpm run typecheck      # full monorepo typecheck
pnpm run lint           # ESLint across the monorepo
pnpm run format         # Prettier write
pnpm run build          # typecheck + build all packages

# API codegen (after editing lib/api-spec/openapi.yaml)
pnpm --filter @workspace/api-spec run codegen

# Push DB schema changes (dev only, after editing lib/db/src/schema/)
pnpm --filter @workspace/db run push
```

### Environment variables

- `artifacts/web/.env.example` — frontend variables (all `VITE_`-prefixed; never secrets)
- `artifacts/api-server/.env.example` — backend variables (`PORT`, `DATABASE_URL`, and secrets are platform-managed)

## Project Status

**Phase 0 — Initialization (current):** architecture, tooling, and conventions only. No pages, APIs, database schema, or authentication logic yet. Features are developed incrementally in subsequent phases.

# mujaddidun_website-
