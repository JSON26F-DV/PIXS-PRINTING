<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (config('database.default') === 'sqlite') {
            return;
        }
        DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('UNPAID','PENDING','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUND') NOT NULL DEFAULT 'PENDING'");
    }

    public function down(): void
    {
        if (config('database.default') === 'sqlite') {
            return;
        }
        DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('UNPAID','PENDING','PROCESSING','SHIPPED','DELIVERED','CANCELLED') NOT NULL DEFAULT 'PENDING'");
    }
};
