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
        Schema::create('deleted_accounts', function (Blueprint $table) {
            $table->increments('id');
            $table->string('original_id', 20)->index('idx_original_id');
            $table->enum('account_type', ['employee', 'customer']);
            $table->string('email')->index('idx_email');
            $table->string('password');
            $table->string('deleted_by', 20);
            $table->enum('deleted_by_type', ['employee', 'customer'])->default('employee');
            $table->text('reason')->nullable();
            $table->dateTime('deleted_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deleted_accounts');
    }
};
