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
            $table->string('employee_id', 20);
            $table->date('date');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->time('break_start')->nullable();
            $table->time('break_end')->nullable();
            $table->enum('status', ['pending', 'full', 'half', 'present', 'absent', 'holiday'])->default('pending');
            $table->decimal('overtime', 4, 2)->default(0.00);
            $table->unsignedInteger('late')->default(0);
            $table->decimal('hours_worked', 4, 2)->default(0.00);
            $table->decimal('total_earnings', 10, 2)->default(0.00);
            $table->decimal('holiday_pay', 10, 2)->default(0.00);
            $table->boolean('is_paid')->default(false);
            $table->enum('holiday_type', ['none', 'regular', 'special_work', 'non_working'])->default('none');

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
