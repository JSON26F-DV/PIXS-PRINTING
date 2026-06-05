<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('production_logs', function (Blueprint $table) {
            $table->string('task_status')->nullable()->after('order_id');
            $table->dateTime('requested_at')->nullable()->after('task_status');
            $table->string('product_name')->nullable()->change();
            $table->unsignedInteger('quantity')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('production_logs', function (Blueprint $table) {
            $table->dropColumn(['task_status', 'requested_at']);
            $table->string('product_name')->nullable(false)->change();
            $table->unsignedInteger('quantity')->nullable(false)->default(0)->change();
        });
    }
};
