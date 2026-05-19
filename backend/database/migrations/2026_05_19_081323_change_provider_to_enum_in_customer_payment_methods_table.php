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
            $table->dropColumn('provider');
        });
        Schema::table('customer_payment_methods', function (Blueprint $table) {
            $table->enum('provider', ['GCash', 'Maya', 'ShopeePay', 'Visa', 'Mastercard', 'Other'])->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_payment_methods', function (Blueprint $table) {
            $table->dropColumn('provider');
        });
        Schema::table('customer_payment_methods', function (Blueprint $table) {
            $table->string('provider', 100)->nullable();
        });
    }
};
