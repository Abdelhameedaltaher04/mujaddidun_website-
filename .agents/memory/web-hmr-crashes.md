---
name: Vite HMR ghost crashes
description: Runtime errors referencing removed code after heavy edits are HMR artifacts, not real bugs
---

After heavy editing/refactors of `artifacts/web` (especially moving components between files), the preview can throw runtime errors that reference code which no longer exists (e.g. "X is not defined", "Invalid hook call", methods on stale module objects).

**Why:** Vite HMR keeps stale module graphs; the errors cite old `?t=` timestamped modules.

**How to apply:** Before debugging "crashes", check whether current source typechecks and the error stack references a stale `?t=` module. Fix = `rm -rf artifacts/web/node_modules/.vite` + restart workflow `artifacts/web: web`. Also note: automated hover verification via CDP/Playwright fails to activate CSS `:hover` on the drifting partners carousel tiles — confirm hover rules exist in compiled CSS instead of looping browser tests.
