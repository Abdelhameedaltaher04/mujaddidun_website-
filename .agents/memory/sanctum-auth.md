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

Disabling an account must invalidate access immediately: login returns 403
`account_disabled` when the password is correct but status isn't active, and an
`active` middleware after `auth:sanctum` rejects and revokes pre-existing tokens.

**Why:** A code-review round caught that suspended users' previously issued
bearer tokens kept working on all protected endpoints — a serious authorization
gap. The 403 only fires after a correct password, so it isn't an
account-existence oracle.

**How to apply:** Keep `['auth:sanctum', 'active']` on every protected group.
Rate-limited auth routes (`throttle:` middleware) require the `cache`/`cache_locks`
tables when the cache store is `database` — the migration must exist or throttled
routes 500. In feature tests, flush guards (`$this->app['auth']->forgetGuards()`)
before re-asserting auth state within one test.