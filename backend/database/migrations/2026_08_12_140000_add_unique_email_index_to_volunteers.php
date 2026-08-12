<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Enforce one ACTIVE volunteer profile per email at the database level so
 * the public application endpoint's lookup-or-create cannot race into
 * duplicate profiles, while soft-deleted rows never block re-application.
 *
 * SQLite/Postgres: partial unique index (WHERE deleted_at IS NULL).
 * MySQL/MariaDB: no partial indexes — use a stored generated column that
 * is NULL for soft-deleted rows (NULLs never collide in unique indexes).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement(
                'ALTER TABLE volunteers ADD COLUMN email_active VARCHAR(255) '
                .'GENERATED ALWAYS AS (IF(deleted_at IS NULL, email, NULL)) STORED',
            );
            DB::statement(
                'CREATE UNIQUE INDEX volunteers_email_unique ON volunteers (email_active)',
            );

            return;
        }

        DB::statement(
            'CREATE UNIQUE INDEX volunteers_email_unique ON volunteers (email) WHERE deleted_at IS NULL',
        );
    }

    public function down(): void
    {
        if (in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
            // MySQL requires the table-qualified DROP INDEX form.
            DB::statement('DROP INDEX volunteers_email_unique ON volunteers');
            DB::statement('ALTER TABLE volunteers DROP COLUMN email_active');

            return;
        }

        DB::statement('DROP INDEX IF EXISTS volunteers_email_unique');
    }
};
