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
            // Drop employee_id if it exists
            if (Schema::hasColumn('refunds', 'employee_id')) {
                $table->dropColumn('employee_id');
            }

            // Drop payment_code_id if it exists
            if (Schema::hasColumn('refunds', 'payment_code_id')) {
                $table->dropColumn('payment_code_id');
            }

            // Add payment_id if it does not exist
            if (! Schema::hasColumn('refunds', 'payment_id')) {
                $table->string('payment_id', 30)->nullable()->after('order_id');
            }
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('refunds', function (Blueprint $table) {

            if (Schema::hasColumn('refunds', 'payment_id')) {
                $table->dropColumn('payment_id');
            }

            if (! Schema::hasColumn('refunds', 'payment_code_id')) {
                $table->string('payment_code_id', 30)->nullable()->after('order_id');
            }

            if (! Schema::hasColumn('refunds', 'employee_id')) {
                $table->string('employee_id', 20)->nullable()->after('id');
            }
        });
    }
};
