---
name: Storage seed files not in git
description: backend/storage/app/public is gitignored; DB references to files there can silently break on clean checkout/deploy.
---
The live SQLite DB (tracked in git) stores image paths under `backend/storage/app/public/**`, but that directory is gitignored (`*` in its .gitignore). A DB row can reference a file that no longer exists on a fresh checkout — this caused the broken Website Settings logo.

**Why:** DB is versioned, binary uploads are not; the two drift.

**How to apply:** Branding files under `site-branding/` are now force-tracked via a gitignore exception. Other seeded imagery (news-covers, gallery, partner-logos) remains untracked — if a clean deploy shows broken images, check disk existence vs DB path first. All images must be served via the routed `/api/v1/files/...` endpoint (PublicFileController whitelist), never `Storage::url()` absolute `/storage` URLs (proxy can't reach them).

## Branding files (site-branding/)
- Aug 2026: the "broken settings logo" recurred because an e2e cleanup deleted `site-branding/mujaddidun-logo.png` from `backend/storage/app/public/` while `site.general`/`site.branding` DB rows still referenced it. Navbar/Footer silently fall back to the bundled asset on img error, masking the breakage.
- Rule: after any test that uploads/restores branding, verify every `*_path` in `website_settings` resolves 200 via `/api/v1/files/...`. The bundled frontend asset `artifacts/web/src/assets/mujaddidun-logo.png` is the canonical source to restore the primary logo file.
