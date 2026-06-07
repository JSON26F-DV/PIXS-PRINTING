<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Rename the misnamed 'an_email' column back to 'is_email'.
     * The column was added by 2026_06_01_060258_add_refund_columns_to_messages_table
     * but was stored in the database as 'an_email' due to a schema corruption.
     */
    public function up(): void
    {
        // Only rename if the bad column exists and the correct one does not
        if (Schema::hasColumn('messages', 'an_email') && ! Schema::hasColumn('messages', 'is_email')) {
            if (DB::getDriverName() === 'sqlite') {
                Schema::table('messages', function (Blueprint $table) {
                    $table->renameColumn('an_email', 'is_email');
                });
            } else {
                DB::statement('ALTER TABLE messages CHANGE an_email is_email TINYINT(1) NOT NULL DEFAULT 0');
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('messages', 'is_email') && ! Schema::hasColumn('messages', 'an_email')) {
            if (DB::getDriverName() === 'sqlite') {
                Schema::table('messages', function (Blueprint $table) {
                    $table->renameColumn('is_email', 'an_email');
                });
            } else {
                DB::statement('ALTER TABLE messages CHANGE is_email an_email TINYINT(1) NOT NULL DEFAULT 0');
            }
        }
    }
};
