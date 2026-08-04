# API Server Architecture

Layered (clean) architecture. Dependencies point inward only:

```
routes  →  controllers  →  services  →  db / models
   ↑            ↑
middlewares   config, utils, lib (cross-cutting)
```

| Folder         | Responsibility                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `routes/`      | HTTP route definitions only. Bind URL + method to a controller. No logic.                                                      |
| `controllers/` | Request/response handling: validate input (Zod from `@workspace/api-zod`), call services, shape responses. No business rules.  |
| `services/`    | Business logic. Pure of HTTP concerns — no `req`/`res` here.                                                                   |
| `models/`      | Domain types and mappers. Database table definitions live in `lib/db` (shared workspace package) — re-export or map them here. |
| `db/`          | Data-access helpers (query builders, repositories) on top of `@workspace/db`.                                                  |
| `middlewares/` | Express middlewares (auth guards, error handling, request context).                                                            |
| `config/`      | Typed, validated environment/application configuration. Only place that reads `process.env`.                                   |
| `utils/`       | Small pure helpers with no domain knowledge.                                                                                   |
| `lib/`         | Infrastructure singletons (logger).                                                                                            |

## Rules

- **Contract-first:** every endpoint is defined in `lib/api-spec/openapi.yaml` first, then codegen produces Zod schemas (server) and React Query hooks (client). Never hand-write these types.
- **Validation at the edge:** controllers validate all input/output with the generated Zod schemas.
- **No `console.log`:** use `req.log` in request handlers and the `logger` singleton elsewhere.
- **Database schema** is defined once in `lib/db/src/schema/` (Drizzle ORM) and shared across the workspace.
