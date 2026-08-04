# Frontend Architecture

Feature-oriented React architecture. Screens compose features; features compose shared building blocks.

```
routes  →  pages  →  layouts + features  →  components / hooks / services
                          ↑
        contexts, lib, utils, types, styles, assets (cross-cutting)
```

| Folder        | Responsibility                                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `routes/`     | Route table and navigation configuration (wouter).                                                                                           |
| `pages/`      | Route-level screens. Thin: compose layouts + features, no business logic.                                                                    |
| `layouts/`    | Shared page shells (public layout, authenticated layout, RTL/LTR direction).                                                                 |
| `features/`   | Self-contained feature modules (see `features/README.md`).                                                                                   |
| `components/` | Shared, reusable presentational components. `components/ui/` is the design-system primitives layer (shadcn).                                 |
| `hooks/`      | Shared reusable hooks.                                                                                                                       |
| `contexts/`   | React context providers (locale/direction, theme, session).                                                                                  |
| `services/`   | Data-access layer. API calls go through the generated client `@workspace/api-client-react` — never hand-write fetch calls for API endpoints. |
| `types/`      | Shared TypeScript types not covered by the generated API types.                                                                              |
| `utils/`      | Pure helper functions.                                                                                                                       |
| `lib/`        | Third-party library glue (`cn`, query client setup).                                                                                         |
| `styles/`     | Global style modules beyond `index.css` (e.g. RTL overrides, print styles).                                                                  |
| `assets/`     | Static imported assets (images, fonts, icons).                                                                                               |

## Conventions

- **Absolute imports:** use `@/…` (configured in `tsconfig.json` and `vite.config.ts`). No deep relative imports (`../../..`).
- **i18n / RTL:** the platform is bilingual (Arabic RTL default, English LTR). All user-facing strings must go through the i18n layer (to be added in a later phase); never hardcode copy in components. Use CSS logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start/end`) instead of left/right utilities so layouts mirror correctly.
- **Server state** lives in React Query via generated hooks; **UI state** lives in components/contexts. No global state library until a real need appears.
- **Environment variables:** only `VITE_`-prefixed variables are available in the client (see `.env.example`). Never put secrets in frontend env.
