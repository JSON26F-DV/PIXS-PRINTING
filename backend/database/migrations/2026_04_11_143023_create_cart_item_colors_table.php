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
        Schema::create('cart_item_colors', function (Blueprint $table) {
            $table->increments('id');
            $table->string('cart_item_id', 100);
            $table->string('color_id', 10)->index('color_id');
            $table->enum('channel_label', ['Primary', 'Secondary', 'Accent'])->default('Primary');
            $table->unsignedTinyInteger('channel_order')->default(0);

            $table->unique(['cart_item_id', 'channel_order'], 'uq_cart_channel');
            $table->unique(['cart_item_id', 'color_id'], 'uq_cart_color');

            $table->foreign('cart_item_id')->references('id')->on('cart_items')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cart_item_colors');
    }
};
