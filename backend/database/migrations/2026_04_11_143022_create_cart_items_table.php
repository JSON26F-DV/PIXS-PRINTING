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
        Schema::create('cart_items', function (Blueprint $table) {
            $table->string('id', 100)->primary();
            $table->string('customer_id', 20)->index('customer_id');
            $table->string('product_id', 10)->index('product_id');
            $table->string('variant_id', 30)->index('variant_id');
            $table->string('screenplate_id', 20)->nullable()->index('screenplate_id');
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('unit_price', 10)->default(0);
            $table->decimal('plate_price', 10)->default(0);
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->useCurrentOnUpdate()->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cart_items');
    }
};
