<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('refunds', function (Blueprint $table) {
            $table->string('id', 30)->primary();  // e.g., 'ref_abc123'
            $table->string('employee_id', 20)->nullable();
            $table->string('customer_id', 20)->nullable();
            $table->string('order_id', 30)->nullable();
            $table->string('payment_code_id', 30)->nullable();
            $table->text('message')->nullable();
            $table->decimal('amount', 10, 2)->default(0);
            $table->enum('status', ['pending', 'completed', 'cancelled'])->default('pending');
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('customer_id');
            $table->index('order_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('refunds');
    }
};
