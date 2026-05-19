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
        Schema::table('customer_payment_methods', function (Blueprint $table) {
            $table->string('gateway_token', 255)->nullable()->after('masked_number');
            $table->timestamps(); // Adds created_at and updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_payment_methods', function (Blueprint $table) {
            $table->dropColumn(['gateway_token', 'created_at', 'updated_at']);
        });
    }
};
