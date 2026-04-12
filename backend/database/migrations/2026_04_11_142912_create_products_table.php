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
        Schema::create('products', function (Blueprint $table) {
            $table->string('id', 10)->primary();
            $table->string('category_id', 10)->index('category_id');
            $table->string('name');
            $table->text('short_description')->nullable();
            $table->text('long_description')->nullable();
            $table->string('best_for', 500)->nullable();
            $table->decimal('base_price', 10)->default(0);
            $table->decimal('raw_material_cost', 10)->default(0);
            $table->unsignedInteger('current_stock')->default(0);
            $table->unsignedInteger('min_threshold')->default(0);
            $table->unsignedInteger('min_order')->default(1);
            $table->string('main_image', 500)->nullable();
            $table->string('print_method', 100)->nullable();
            $table->boolean('is_need_screenplate')->default(false);
            $table->boolean('is_need_color')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
