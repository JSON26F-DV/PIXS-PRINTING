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
        Schema::create('customers', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('profile_picture', 500)->nullable();
            $table->string('email')->unique('email');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->unsignedTinyInteger('age')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('company_name')->nullable();
            $table->string('password')->nullable();
            $table->decimal('total_orders_value', 12)->default(0);
            $table->unsignedInteger('orders')->default(0);
            $table->string('google_id')->nullable()->unique('google_id');
            $table->string('facebook_id')->nullable()->unique('facebook_id');
            $table->dateTime('date_created')->useCurrent();
            $table->dateTime('last_login')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
