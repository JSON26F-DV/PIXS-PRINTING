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
        Schema::table('refunds', function (Blueprint $table) {
            if (config('database.default') !== 'sqlite') {
                // Drop foreign key constraint referencing customer_payment_methods
                $table->dropForeign('refunds_payment_id_foreign');
            }
        });

        Schema::dropIfExists('customer_payment_methods');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('customer_payment_methods', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('customer_id', 20)->index('customer_id');
            $table->enum('type', ['bank', 'ewallet', 'credit_card', 'cod']);
            $table->enum('bank_name', [
                'BDO',
                'BPI',
                'Metrobank',
                'Landbank',
                'Unionbank',
                'Security Bank',
                'Chinabank',
                'RCBC',
                'EastWest',
                'PNB',
                'Other',
            ])->nullable();
            $table->enum('provider', ['GCash', 'Maya', 'ShopeePay', 'Visa', 'Mastercard', 'Other'])->nullable();
            $table->string('masked_number', 30);
            $table->string('gateway_token', 255)->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        Schema::table('refunds', function (Blueprint $table) {
            $table->foreign('payment_id')
                ->references('id')
                ->on('customer_payment_methods')
                ->onDelete('restrict')
                ->onUpdate('restrict');
        });
    }
};
