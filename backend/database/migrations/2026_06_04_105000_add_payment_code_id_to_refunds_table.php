<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('refunds', function (Blueprint $table) {
            if (!Schema::hasColumn('refunds', 'payment_code_id')) {
                $table->string('payment_code_id', 30)->nullable()->after('payment_id');
            }
        });

        try {
            Schema::table('refunds', function (Blueprint $table) {
                $table->foreign('payment_code_id')
                    ->references('id')
                    ->on('payment_codes')
                    ->onDelete('restrict')
                    ->onUpdate('restrict');
            });
        } catch (\Throwable $e) {
            // Silently ignore if constraint already exists
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('refunds', function (Blueprint $table) {
            try {
                $table->dropForeign(['payment_code_id']);
            } catch (\Throwable $e) {
            }

            if (Schema::hasColumn('refunds', 'payment_code_id')) {
                $table->dropColumn('payment_code_id');
            }
        });
    }
};
