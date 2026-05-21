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
        Schema::create('discounts', function (Blueprint $table) {
            $table->string('id', 30)->primary();
            $table->string('customer_id', 20)->nullable();
            $table->string('product_id', 10)->nullable();
            $table->string('code', 20)->unique();
            $table->enum('type', ['fixed', 'percentage'])->default('fixed');
            $table->decimal('value', 10, 2);
            $table->decimal('min_spend', 10, 2)->default(0);
            $table->boolean('already_used')->default(false);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('discounts');
    }
};
