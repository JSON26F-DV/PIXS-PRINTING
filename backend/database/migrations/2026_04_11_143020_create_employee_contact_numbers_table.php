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
        Schema::create('employee_contact_numbers', function (Blueprint $table) {
            $table->increments('id');
            $table->string('employee_id', 20)->index('employee_id');
            $table->string('number', 30);
            $table->boolean('is_default')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_contact_numbers');
    }
};
