<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_employee_queue', function (Blueprint $table) {
            $table->id();
            $table->string('order_id', 20);
            $table->string('employee_id', 20);
            $table->timestamps();

            $table->unique(['order_id', 'employee_id']);
            $table->index('order_id');
            $table->index('employee_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_employee_queue');
    }
};
