<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('customer_discounts');
    }

    public function down(): void
    {
        Schema::create('customer_discounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->foreignId('discount_id')->constrained()->onDelete('cascade');
            $table->string('type'); // percentage, fixed
            $table->decimal('value', 10, 2);
            $table->foreignId('product_id')->nullable()->constrained()->onDelete('set null');
            $table->integer('remaining_uses')->default(1);
            $table->boolean('is_one_time')->default(false);
            $table->timestamp('expires_at')->nullable();
            $table->enum('status', ['active', 'used', 'expired'])->default('active');
            $table->timestamps();
        });
    }
};
