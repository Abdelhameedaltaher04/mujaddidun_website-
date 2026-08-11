---
name: SQLite test safety fuse
description: The live SQLite DB was wiped during a test session; guards now prevent recurrence
---

- The app's only datastore is `backend/database/database.sqlite` (gitignored — no git recovery, no backups). On 2026-08-10 it was wiped mid-session; forensic evidence pointed to a schema rebuild from the repo's migrations (RefreshDatabase-style) even though phpunit.xml sets `DB_DATABASE=:memory:`.
- Guards now in place: phpunit.xml env overrides use `force="true"`, and `backend/tests/TestCase.php::setUp` fails hard if the resolved database is not `:memory:`. Do not remove either guard.
- If data disappears again: check users/roles counts via tinker first, compare the file's `migrations` table against the repo migration list to date the wipe, and recreate seed data (roles + news-category seeders, then admin/moderator/user accounts).

**Why:** real user accounts were lost and had to be recreated with temporary passwords.
**How to apply:** before any test-suite or migration work on the backend, confirm the fuse is intact; never run `migrate:fresh`/`db:wipe` outside tests.

Update 2026-08-11: a second wipe was proven to happen BETWEEN sessions, not from tests (controlled canary run showed tests never touch the file). Root cause: the sqlite file was gitignored (`backend/database/.gitignore` had `*.sqlite*`), and untracked files don't survive environment checkpoint/reprovisioning. Fix: the ignore line was removed and `database.sqlite` is now git-tracked — keep it tracked. Uploaded files under `backend/storage/app/public` remain gitignored and are still vulnerable. At session start, sanity-check `User::count()` before trusting the DB; recreate via RoleSeeder+NewsCategorySeeder+db:seed and the four accounts (admin/moderator known passwords, gmail accounts get ChangeMe!2026).
