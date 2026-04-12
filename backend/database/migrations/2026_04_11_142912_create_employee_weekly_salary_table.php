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
        Schema::create('employee_weekly_salary', function (Blueprint $table) {
            $table->increments('id');
            $table->string('employee_id', 20);
            $table->date('week_start');
            $table->decimal('weekly_total', 12)->default(0);
            $table->decimal('weekly_hours_total', 6)->default(0);

            $table->unique(['employee_id', 'week_start'], 'uq_emp_week');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_weekly_salary');
    }
};
