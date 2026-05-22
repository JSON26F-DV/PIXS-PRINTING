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
        Schema::create('screenplate_incompatible', function (Blueprint $table) {
            $table->increments('id');
            $table->string('screenplate_id', 20);
            $table->string('product_id', 10)->index('product_id');
            $table->string('variant_id', 30)->nullable()->index('variant_id');

            $table->unique(['screenplate_id', 'product_id', 'variant_id'], 'uq_sp_incompat');

            $table->foreign('screenplate_id')->references('id')->on('screenplates')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('screenplate_incompatible');
    }
};
