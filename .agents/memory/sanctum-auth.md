---
name: Laravel Sanctum authentication
description: Durable conventions for the Laravel API's bearer-token authentication and password reset flows.
---

Laravel API authentication uses Sanctum personal access tokens with `auth:sanctum`
on protected routes. Registration assigns the single primary `user` role; frontend
authentication remains a separate integration phase.

**Why:** The backend uses one-role-per-user authorization and token-based API
requests, while the public React app is intentionally not coupled to this phase.

**How to apply:** Keep auth responses under the shared `{success, message, data}`
contract, revoke only the presented bearer token on logout, and use Laravel's
password broker for reset links and reset-token validation. Any confirmation field
needed by service code must have its own validation rule so it survives
`validated()` filtering.