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
        Schema::table('customer_payment_methods', function (Blueprint $table) {
            $table->dropColumn('bank_name');
        });
        Schema::table('customer_payment_methods', function (Blueprint $table) {
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
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_payment_methods', function (Blueprint $table) {
            $table->dropColumn('bank_name');
        });
        Schema::table('customer_payment_methods', function (Blueprint $table) {
            $table->string('bank_name', 100)->nullable();
        });
    }
};
