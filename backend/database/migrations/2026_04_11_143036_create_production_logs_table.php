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
        Schema::create('production_logs', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('employee_id', 20)->index('employee_id');
            $table->string('order_id', 20);
            $table->string('product_name');
            $table->unsignedInteger('quantity')->default(0);
            $table->dateTime('completed_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_logs');
    }
};
