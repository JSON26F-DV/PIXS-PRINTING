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
        Schema::create('screenplate_compatibility', function (Blueprint $table) {
            $table->increments('id');
            $table->string('screenplate_id', 20);
            $table->string('product_id', 10)->index('product_id');
            $table->string('variant_id', 30)->nullable()->index('variant_id');
            $table->decimal('print_price_per_unit', 10)->default(0);

            $table->unique(['screenplate_id', 'product_id', 'variant_id'], 'uq_sp_compat');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('screenplate_compatibility');
    }
};
