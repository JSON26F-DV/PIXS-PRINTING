<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('screenplate_incompatible');
    }

    public function down(): void
    {
        Schema::create('screenplate_incompatible', function (Blueprint $table) {
            $table->id();
            $table->string('screenplate_id', 20);
            $table->string('product_id', 20);
            $table->string('variant_id', 20);
        });
    }
};
