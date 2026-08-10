---
name: Laravel feature test gotchas
description: Recurring pitfalls when writing Laravel API feature tests in this backend
---

- The auth guard caches the resolved user across requests within one test; call `$this->app['auth']->forgetGuards()` between requests that use different bearer tokens.
- Tests run on in-memory SQLite, which has NO default LIKE escape character — backslash-escaped `%`/`_` only work with an explicit `ESCAPE '\'` clause (MySQL treats backslash as default). Production code must add the ESCAPE clause to be portable.
- `email_verified_at` (and other timestamp columns) are intentionally not in `User::$fillable`; use `forceFill(...)->save()` in tests/seeding.

**Why:** all three caused silent wrong-behavior test failures (403s, filters matching everything/nothing) that looked like app bugs.
**How to apply:** whenever writing feature tests hitting `/api/v1` with multiple actors or LIKE-based search.
