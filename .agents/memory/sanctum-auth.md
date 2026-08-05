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

Password-reset notifications must point to the React `/reset-password` route,
not a server-rendered Laravel page.

**Why:** The Vite application owns the authentication screens while Laravel
only exposes the password-reset API.

**How to apply:** Configure the backend `FRONTEND_URL` per environment and keep
the reset page reading `token` and `email` from its query string.

Registration creates an unverified user and sends Laravel's native verification
notification before any bearer token is issued; login is blocked until the
signed verification link is accepted.

**Why:** Email verification is a security prerequisite for the separate React
frontend's Sanctum token flow.

**How to apply:** Preserve the `email_verified_at` check in login, use signed
verification URLs with the configured expiry, and keep resend requests
throttled.