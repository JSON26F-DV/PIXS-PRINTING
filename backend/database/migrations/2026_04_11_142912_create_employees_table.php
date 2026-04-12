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
        Schema::create('employees', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('profile_picture', 500)->nullable();
            $table->string('email')->unique('email');
            $table->enum('role', ['admin', 'staff', 'technician', 'welder']);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->unsignedTinyInteger('age')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('company_name');
            $table->string('password');
            $table->decimal('total_orders_value', 12)->default(0);
            $table->decimal('daily_rate', 10)->default(0);
            $table->decimal('ot_rate', 10)->default(0);
            $table->dateTime('date_created')->useCurrent();
            $table->dateTime('last_login')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
