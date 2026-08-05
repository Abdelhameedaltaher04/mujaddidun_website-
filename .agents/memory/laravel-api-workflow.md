---
name: Laravel API workflow
description: Environment constraints for serving the Laravel backend through the existing routed API artifact.
---

The existing API artifact is the browser-facing `/api` service and must serve the Laravel application, not the placeholder Express server. Laravel’s configured SQLite database must exist, be migrated, seeded with roles, and include the sessions table when the session driver is `database`.

**Why:** The frontend initially received Express 404 responses, then Laravel 500 responses from a missing SQLite database/session table. After those were fixed, Laravel’s `statefulApi()` caused 419 CSRF failures even though this project uses Sanctum bearer tokens rather than cookie-based SPA authentication.

**How to apply:** Keep the API artifact workflow pointed at `../../backend` from its artifact working directory. For this bearer-token API, do not enable `statefulApi()`; verify live requests through the routed `/api/v1` path and expect CORS headers plus JSON validation envelopes.