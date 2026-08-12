---
name: Public file gating
description: Every new public-disk upload directory must get an active-reference gate in the public file controller.
---

The routed public file endpoint whitelists directories, but a whitelist alone leaks drafts/inactive content.

**Why:** Adding `content-images/` ungated let deactivated hero/CTA images stay publicly fetchable — flagged as a High security finding in review. Same applies to any future upload dir.

**How to apply:** When introducing a new upload directory, add an `*IsPublic()` check that verifies the file is referenced by a currently active/published record, with the staff bypass (`private, no-store`) and a short public TTL (max-age=300) so revocation takes effect quickly. Also: public content endpoints must strip inactive singleton sections down to `['is_active' => false]` — never present full content of deactivated sections.

Test gotcha: after an authenticated in-test request, call `$this->app['auth']->forgetGuards()` before asserting a 404 on unauthenticated file access, or the cached guard makes the request look staff-authenticated.
