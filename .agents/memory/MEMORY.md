# Memory Index

- [GitHub connection](github-connection.md) — repo name ends with a hyphen; gitPush callback lacks creds, push via connector token inside "use impure".
- [Mujaddidun brand identity](brand-identity.md) — name is "مجددون" (no "ال"); exact logo colors: teal-blue #0071A0 primary, coral #FF5810 secondary; never generic palettes.
- [Vite HMR ghost crashes](web-hmr-crashes.md) — runtime errors citing removed code are stale-HMR artifacts; clear .vite cache + restart instead of debugging.
- [Workspace package installs](workspace-package-installs.md) — scoped frontend dependencies must be added with the package filter, not the root-targeting package callback.
- [Laravel backend environment](laravel-backend-environment.md) — keep deployable defaults in `.env.example`; protected local `.env` files must not be edited or exposed.
