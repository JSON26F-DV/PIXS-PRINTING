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
        Schema::create('order_item_colors', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('order_item_id');
            $table->string('color_name', 100);
            $table->string('color_hex', 7);
            $table->enum('channel_label', ['Primary', 'Secondary', 'Accent'])->default('Primary');
            $table->unsignedTinyInteger('channel_order')->default(0);

            $table->unique(['order_item_id', 'channel_order'], 'uq_order_item_channel');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_item_colors');
    }
};
