---
name: Workspace package installs
description: The reliable way to add dependencies to a package in this pnpm workspace.
---

Install dependencies from the workspace root with the target package filter, for example `pnpm --filter @workspace/web add <package>`. The generic package-install callback may target the workspace root and fail with the root-check guard.

**Why:** The web package needs its dependency recorded in its own package manifest and lockfile, not in the monorepo root.

**How to apply:** When a frontend dependency is needed, use the scoped pnpm filter and then rerun the affected package typecheck and workflow.