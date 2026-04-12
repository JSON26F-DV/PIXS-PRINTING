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
        Schema::create('employee_attendance', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('weekly_salary_id')->index('weekly_salary_id');
            $table->string('employee_id', 20);
            $table->date('date');
            $table->enum('status', ['full', 'half', 'absent'])->default('full');
            $table->decimal('overtime_hours', 4)->default(0);
            $table->unsignedInteger('late_minutes')->default(0);
            $table->decimal('hours_worked', 4)->default(0);
            $table->decimal('computed_salary', 10)->default(0);
            $table->boolean('is_holiday')->default(false);

            $table->unique(['employee_id', 'date'], 'uq_emp_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_attendance');
    }
};
