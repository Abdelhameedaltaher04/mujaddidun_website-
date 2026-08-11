---
name: Laravel API workflow
description: Serving the routed API artifact, bearer-token CSRF rule, multipart PUT quirk, role slugs.
---

- The routed API artifact must serve Laravel (`php artisan serve` bound to $PORT).
- Bearer-token APIs must not enable stateful CSRF middleware.
- **PHP cannot parse multipart PUT bodies.** For file-upload sections, the frontend must send `POST` with `_method=PUT` in the FormData (method spoofing); JSON-only sections can use real PUT. **Why:** multipart parsing only happens for POST in PHP; a real multipart PUT arrives with empty input silently. **How to apply:** any admin form mixing files + PUT semantics.
- Role slugs seeded by RoleSeeder are `admin`, `moderator`, `volunteer`, `user` — there is no `member` slug.
- Rich-text (HTML) input from admin editors is still untrusted: sanitize server-side (symfony/html-sanitizer strict allowlist in `App\Support\ReplyHtmlSanitizer`) before both mailing and persisting.
