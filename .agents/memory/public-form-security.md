---
name: Public form security invariants
description: Rules for unauthenticated public submission endpoints (volunteer, donations, contact)
---

- Unauthenticated endpoints must NEVER update an existing profile matched by email — that lets a stranger overwrite someone's PII. Keep the profile frozen and store the submission's own data as an immutable per-application snapshot exposed to admins.
- Duplicate/open-state responses must be generic and indistinguishable from success (idempotent echo of the open record), never a distinct error — otherwise the endpoint becomes an email/status enumeration oracle.
- Lookup-or-create by email must be race-safe: unique index on the email (partial `WHERE deleted_at IS NULL` on SQLite/Postgres; on MySQL a STORED generated `email_active` column + plain unique index), plus `lockForUpdate` in a transaction and a one-shot retry on `UniqueConstraintViolationException`.
- Raw-SQL migrations must branch by driver for BOTH up() and down(): MySQL needs `DROP INDEX name ON table` (no `IF EXISTS` on the bare form) and has no partial indexes.

**Why:** code review failed the public volunteer endpoint three times on exactly these points (PII overwrite, enumeration oracle, race, MySQL-incompatible migration).
**How to apply:** any new public POST endpoint or raw-SQL migration in this project.
