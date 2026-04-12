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
        Schema::create('inventory_logs', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('employee_id', 20)->index('employee_id');
            $table->string('product_id', 10)->nullable()->index('product_id');
            $table->string('product_name');
            $table->integer('qty_added')->default(0);
            $table->decimal('cost', 12)->default(0);
            $table->enum('type', ['RESTOCK', 'MISC', 'ADJUSTMENT', 'DAMAGE'])->default('RESTOCK');
            $table->text('notes')->nullable();
            $table->dateTime('date')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_logs');
    }
};
