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
        Schema::create('delivery_methods', function (Blueprint $table) {
            $table->string('id', 50)->primary();
            $table->string('name');
            $table->enum('type', ['courier', 'pickup']);
            $table->decimal('fee', 10, 2)->default(0);
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('delivery_methods');
    }
};
