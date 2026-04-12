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
        Schema::create('customer_discounts', function (Blueprint $table) {
            $table->increments('id');
            $table->string('customer_id', 20)->index('customer_id');
            $table->string('discount_id', 20);
            $table->enum('type', ['unit', 'percentage', 'fixed']);
            $table->decimal('value', 10)->default(0);
            $table->string('product_id', 20)->nullable();
            $table->unsignedInteger('remaining_uses')->default(1);
            $table->boolean('is_one_time')->default(false);
            $table->dateTime('expires_at')->nullable();
            $table->enum('status', ['active', 'used', 'expired'])->default('active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_discounts');
    }
};
