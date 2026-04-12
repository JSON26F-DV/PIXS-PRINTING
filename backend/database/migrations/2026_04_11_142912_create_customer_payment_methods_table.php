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
        Schema::create('customer_payment_methods', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('customer_id', 20)->index('customer_id');
            $table->enum('type', ['bank', 'ewallet', 'credit_card', 'cod']);
            $table->string('bank_name', 100)->nullable();
            $table->string('provider', 100)->nullable();
            $table->string('masked_number', 30);
            $table->boolean('is_default')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_payment_methods');
    }
};
