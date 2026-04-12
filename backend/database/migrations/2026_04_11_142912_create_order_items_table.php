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
        Schema::create('order_items', function (Blueprint $table) {
            $table->increments('id');
            $table->string('order_id', 30)->index('order_id');
            $table->string('product_id', 10)->nullable()->index('product_id');
            $table->string('variant_id', 30)->nullable()->index('variant_id');
            $table->string('screenplate_id', 20)->nullable()->index('screenplate_id');
            $table->string('product_name');
            $table->string('category', 100)->nullable();
            $table->string('product_image', 500)->nullable();
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('unit_price', 10)->default(0);
            $table->decimal('plate_setup_fee', 10)->default(0);
            $table->decimal('plate_print_price', 10)->default(0);
            $table->text('custom_requirements')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
