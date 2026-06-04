<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tables that are currently using latin1_swedish_ci and need conversion.
     * Tables already on utf8mb4 (conversations, conversation_participants,
     * messages, message_attachments, message_reactions) are excluded.
     */
    private array $latin1Tables = [
        'cart_items',
        'cart_item_colors',
        'categories',
        'colors',
        'customers',
        'customer_addresses',
        'customer_contact_numbers',
        'customer_discounts',
        'customer_payment_methods',
        'deleted_accounts',
        'employees',
        'employee_addresses',
        'employee_attendance',
        'employee_contact_numbers',
        'employee_weekly_salary',
        'inventory_logs',
        'marketing_promotions',
        'orders',
        'order_items',
        'order_item_colors',
        'production_logs',
        'products',
        'product_gallery',
        'product_tags',
        'product_variants',
        'screenplates',
        'screenplate_compatibility',
        'screenplate_requests',
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (config('database.default') === 'sqlite') {
            return;
        }

        $database = config('database.connections.'.config('database.default').'.database');

        // ─── Step 1: Convert the DATABASE default charset ───
        DB::statement("ALTER DATABASE `{$database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

        // ─── Step 2: Drop ALL foreign keys, convert tables, then re-add FKs ───
        // MariaDB error 1833 prevents charset conversion on FK columns, even
        // with FOREIGN_KEY_CHECKS=0. We must drop FKs first.

        $foreignKeys = $this->getAllForeignKeys($database);

        // Drop all foreign keys
        foreach ($foreignKeys as $fk) {
            DB::statement("ALTER TABLE `{$fk->TABLE_NAME}` DROP FOREIGN KEY `{$fk->CONSTRAINT_NAME}`");
        }

        // Convert all latin1 tables to utf8mb4
        foreach ($this->latin1Tables as $table) {
            if (Schema::hasTable($table)) {
                DB::statement("ALTER TABLE `{$table}` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            }
        }

        // Re-add all foreign keys
        foreach ($foreignKeys as $fk) {
            DB::statement(
                "ALTER TABLE `{$fk->TABLE_NAME}` ADD CONSTRAINT `{$fk->CONSTRAINT_NAME}` ".
                "FOREIGN KEY (`{$fk->COLUMN_NAME}`) REFERENCES `{$fk->REFERENCED_TABLE_NAME}` (`{$fk->REFERENCED_COLUMN_NAME}`) ".
                "ON DELETE {$fk->DELETE_RULE} ON UPDATE {$fk->UPDATE_RULE}"
            );
        }

        // ─── Step 3: Ensure password columns are VARCHAR(255) ───
        if (Schema::hasTable('customers')) {
            DB::statement('ALTER TABLE `customers` MODIFY `password` VARCHAR(255) NULL');
        }
        if (Schema::hasTable('employees')) {
            DB::statement('ALTER TABLE `employees` MODIFY `password` VARCHAR(255) NOT NULL');
        }
        if (Schema::hasTable('deleted_accounts')) {
            DB::statement('ALTER TABLE `deleted_accounts` MODIFY `password` VARCHAR(255) NOT NULL');
        }

        // ─── Step 4: Re-hash ALL passwords to Bcrypt("password123") ───
        $bcryptPassword = Hash::make('password123');

        DB::table('customers')->update(['password' => $bcryptPassword]);
        DB::table('employees')->update(['password' => $bcryptPassword]);
        DB::table('deleted_accounts')->update(['password' => $bcryptPassword]);
    }

    /**
     * Reverse the migrations.
     *
     * NOTE: This will NOT restore original SHA-256 passwords.
     * It only reverts the collation changes.
     */
    public function down(): void
    {
        if (config('database.default') === 'sqlite') {
            return;
        }

        $database = config('database.connections.'.config('database.default').'.database');

        $foreignKeys = $this->getAllForeignKeys($database);

        // Drop all foreign keys
        foreach ($foreignKeys as $fk) {
            DB::statement("ALTER TABLE `{$fk->TABLE_NAME}` DROP FOREIGN KEY `{$fk->CONSTRAINT_NAME}`");
        }

        // Revert each table back to latin1
        foreach ($this->latin1Tables as $table) {
            if (Schema::hasTable($table)) {
                DB::statement("ALTER TABLE `{$table}` CONVERT TO CHARACTER SET latin1 COLLATE latin1_swedish_ci");
            }
        }

        // Re-add all foreign keys
        foreach ($foreignKeys as $fk) {
            DB::statement(
                "ALTER TABLE `{$fk->TABLE_NAME}` ADD CONSTRAINT `{$fk->CONSTRAINT_NAME}` ".
                "FOREIGN KEY (`{$fk->COLUMN_NAME}`) REFERENCES `{$fk->REFERENCED_TABLE_NAME}` (`{$fk->REFERENCED_COLUMN_NAME}`) ".
                "ON DELETE {$fk->DELETE_RULE} ON UPDATE {$fk->UPDATE_RULE}"
            );
        }

        // Revert database default
        DB::statement("ALTER DATABASE `{$database}` CHARACTER SET latin1 COLLATE latin1_swedish_ci");
    }

    /**
     * Get all foreign key constraints for the database.
     */
    private function getAllForeignKeys(string $database): array
    {
        return DB::select('
            SELECT
                rc.TABLE_NAME,
                rc.CONSTRAINT_NAME,
                kcu.COLUMN_NAME,
                kcu.REFERENCED_TABLE_NAME,
                kcu.REFERENCED_COLUMN_NAME,
                rc.DELETE_RULE,
                rc.UPDATE_RULE
            FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
            JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
                ON rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
                AND rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
            WHERE rc.CONSTRAINT_SCHEMA = ?
            ORDER BY rc.TABLE_NAME, rc.CONSTRAINT_NAME
        ', [$database]);
    }
};
