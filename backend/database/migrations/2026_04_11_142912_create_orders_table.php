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
        Schema::create('orders', function (Blueprint $table) {
            $table->string('id', 30)->primary();
            $table->string('customer_id', 20)->index('customer_id');
            $table->string('discount_id', 20)->nullable();
            $table->decimal('total_amount', 12)->default(0);
            $table->decimal('total_discount_amount', 12)->default(0);
            $table->enum('status', ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])->default('PENDING');
            $table->string('delivery_method', 100)->nullable();
            $table->text('feedback')->nullable();
            $table->text('complaint')->nullable();
            $table->unsignedTinyInteger('rating')->default(0);
            $table->text('admin_comment')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->useCurrentOnUpdate()->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
