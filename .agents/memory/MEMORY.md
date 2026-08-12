# Memory Index

- [Public form security invariants](public-form-security.md) — never overwrite profiles from unauthenticated email matches; generic idempotent duplicate responses; race-safe unique email; driver-branched raw-SQL migrations.

- [SQLite test safety fuse](sqlite-test-safety.md) — live DB was wiped once; TestCase aborts unless DB is :memory:, keep the guard and never migrate:fresh outside tests.
- [GitHub connection](github-connection.md) — repo name ends with a hyphen; gitPush callback lacks creds, push via connector token inside "use impure".
- [Mujaddidun brand identity](brand-identity.md) — name is "مجددون" (no "ال"); exact logo colors: teal-blue #0071A0 primary, coral #FF5810 secondary; never generic palettes.
- [Vite HMR ghost crashes](web-hmr-crashes.md) — runtime errors citing removed code are stale-HMR artifacts; clear .vite cache + restart instead of debugging.
- [Workspace package installs](workspace-package-installs.md) — scoped frontend dependencies must be added with the package filter, not the root-targeting package callback.
- [Laravel backend environment](laravel-backend-environment.md) — keep deployable defaults in `.env.example`; protected local `.env` files must not be edited or exposed.
- [Laravel Sanctum auth](sanctum-auth.md) — validated confirmation fields and bearer-token revocation need explicit handling in API auth flows.
- [Laravel API workflow](laravel-api-workflow.md) — the routed API artifact must serve Laravel; bearer-token APIs must not enable stateful CSRF middleware.
- [Tiptap v3 editor](tiptap-editor.md) — StarterKit bundles Link (no separate extension) and setContent takes an options object, not a boolean.
- [Authentication UI validation](authentication-ui-validation.md) — auth failures render inline field/form feedback; success states remain dialogs and shared controls own loading/disabled behavior.
- [Gallery cover invariant](gallery-cover-invariant.md) — album cover is custom file OR one is_cover image, never both; every cover mutation must preserve this.
- [Laravel feature test gotchas](laravel-feature-tests.md) — guard caching between in-test requests, SQLite LIKE needs explicit ESCAPE, timestamps aren't fillable.
- [Lenient list filters](lenient-list-filters.md) — date filters must ignore mid-typing/inverted values from native date inputs, never 422; keep enums strict.
- [Storage seed files not in git](storage-seed-files.md) — public storage dir is gitignored while DB (tracked) references files there; broken images = check disk vs DB path; always use routed /api/v1/files URLs.
- [Public file gating](public-file-gating.md) — new upload dirs need an active-reference gate in the public file controller; inactive content must not leak via /public endpoints or file URLs.
- [getApiError fields are strings](api-error-fields.md) — server field errors are pre-joined strings; `fields[key][0]` renders one character, assign the whole string.
- [Responsive duplicate test ids](responsive-testids.md) — desktop table and mobile card action buttons need distinct data-testids (suffix mobile with `-mobile`) or UI tests stall.
