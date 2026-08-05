---
name: Laravel backend environment
description: Deployment configuration for the separate Laravel backend in this workspace.
---

The Laravel backend keeps its committed configuration in `.env.example`; local `.env` files are protected by the workspace and must not be edited or exposed by agents. Deployment or local setup should copy the template and provide environment-specific values there.

**Why:** The workspace prevents direct `.env` writes to protect application keys and credentials, while Laravel still needs a MySQL/Sanctum/CORS configuration at deployment time.

**How to apply:** Update `.env.example` for non-secret defaults and document required runtime values. Never print, copy, or patch the protected `.env` file.