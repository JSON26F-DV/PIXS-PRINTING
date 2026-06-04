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
        Schema::create('employee_payment_methods', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('employee_id', 20)->index('employee_id');
            $table->enum('type', ['bank', 'ewallet', 'credit_card', 'cod']);
            $table->enum('bank_name', [
                'BDO', 'BPI', 'Metrobank', 'Landbank', 'Unionbank',
                'Security Bank', 'Chinabank', 'RCBC', 'EastWest', 'PNB', 'Other',
            ])->nullable();
            $table->enum('provider', ['GCash', 'Maya', 'ShopeePay', 'Visa', 'Mastercard', 'Other'])->nullable();
            $table->string('masked_number', 30);
            $table->boolean('is_default')->default(false);
            $table->string('gateway_token', 255)->nullable();
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_payment_methods');
    }
};
