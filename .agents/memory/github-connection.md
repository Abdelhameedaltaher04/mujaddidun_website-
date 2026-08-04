---
name: GitHub connection for this project
description: How git push to GitHub works here; repo name gotcha
---
- The user's repo is `Abdelhameedaltaher04/mujaddidun_website-` (note the **trailing hyphen**); `origin` points at it over HTTPS.
- The `gitPush`/`gitPull` skill callbacks fail with NO_CREDENTIALS because the user linked GitHub via the **connector** (conn_github_...), not Replit's account-level "github-source-control" link.
- **How to apply:** to push/pull, inside a `"use impure"` block get the token via `listConnections('github')[0].settings.access_token` and run git with a `https://x-access-token:<token>@github.com/...` URL. Never log the token.
- Remote history was unrelated (docs-only) and was merged into `main` with `--allow-unrelated-histories`; local README kept.
