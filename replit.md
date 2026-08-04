# Mujaddidun Charity Platform

Production-quality bilingual (Arabic RTL / English LTR) web platform for the Mujaddidun Charity and Development Association. Developed incrementally — currently at Phase 0 (architecture initialization only).

## Run & Operate

- Frontend workflow: `artifacts/web: web` — React + Vite app at `/`
- API workflow: `artifacts/api-server: API Server` — Express at `/api`
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run lint` / `pnpm run format` — ESLint / Prettier (monorepo-wide, root configs)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind v4 + wouter (artifacts/web)
- API: Express 5 (artifacts/api-server)
- DB: PostgreSQL + Drizzle ORM (lib/db)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in lib/api-spec)
- Auth (planned): Replit Auth

## Where things live

- Frontend architecture doc: `artifacts/web/src/ARCHITECTURE.md` (feature-module structure, i18n/RTL rules)
- Backend architecture doc: `artifacts/api-server/src/ARCHITECTURE.md` (routes → controllers → services layering)
- API contract source of truth: `lib/api-spec/openapi.yaml`
- DB schema source of truth: `lib/db/src/schema/`
- Backend env access: only via `artifacts/api-server/src/config/`
- ESLint flat config + Prettier config at repo root

## Architecture decisions

- Clean layered backend: routes → controllers → services → db; controllers validate with generated Zod schemas
- Frontend is feature-modular: `src/features/<name>/` with explicit public API; no cross-feature imports
- Contract-first: OpenAPI spec gates all API work; never hand-write API types
- Bilingual by design: Arabic (RTL) is the default locale; use CSS logical properties, never left/right utilities

## Product

Phase 0 only: initialized architecture, tooling, and conventions. No pages, APIs, DB schema, sample data, or auth yet.

## User preferences

- Develop incrementally: NEVER build features that were not explicitly requested; stop after each requested phase
- Professional engineering practices and clean architecture are hard requirements
- The user originally wanted Next.js + Laravel; agreed to the supported equivalent (React+Vite / Express / PostgreSQL / Replit Auth)

## Gotchas

- Empty scaffold folders are kept with `.gitkeep` files
- `artifacts/web/src/index.css` still has placeholder theme values (`red`) from the scaffold — the design phase will replace them
- Run codegen after every OpenAPI spec change before touching generated types
