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
            $table->string('address_id', 50)->nullable();
            $table->string('payment_method_id', 50)->nullable();
            $table->string('delivery_method_id', 50)->nullable();
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->text('production_notes')->nullable();
            $table->enum('status', ['UNPAID', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])->default('PENDING');
            $table->text('feedback')->nullable();
            $table->text('complaint')->nullable();
            $table->unsignedTinyInteger('rating')->default(0);
            $table->text('admin_comment')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->foreign('delivery_method_id')->references('id')->on('delivery_methods')->nullOnDelete();
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
