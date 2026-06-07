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
        Schema::create('product_variants', function (Blueprint $table) {
            $table->string('variant_id', 30)->primary();
            $table->string('product_id', 10)->index('product_id');
            $table->string('size', 50)->nullable();
            $table->string('width', 20)->nullable();
            $table->string('height', 20)->nullable();
            $table->decimal('price', 10)->default(0);
            $table->unsignedInteger('stock')->default(0);
            $table->boolean('is_need_screenplate')->default(true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
