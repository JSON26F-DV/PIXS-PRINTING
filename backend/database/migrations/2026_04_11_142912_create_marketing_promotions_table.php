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
        Schema::create('marketing_promotions', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('title', 150);
            $table->enum('discount_type', ['percentage', 'unit']);
            $table->decimal('discount_value', 10);
            $table->enum('target_type', ['all_users', 'specific_user']);
            $table->string('assigned_user_id', 50)->nullable();
            $table->string('product_id', 20)->nullable();
            $table->string('code', 50)->unique('code');
            $table->integer('max_uses')->nullable();
            $table->integer('used_count')->nullable()->default(0);
            $table->integer('minimum_quantity')->nullable();
            $table->dateTime('expires_at');
            $table->enum('status', ['active', 'inactive'])->nullable()->default('active');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrentOnUpdate()->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('marketing_promotions');
    }
};
