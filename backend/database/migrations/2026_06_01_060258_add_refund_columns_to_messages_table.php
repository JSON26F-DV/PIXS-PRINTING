<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->string('refund_id', 30)->nullable()->after('payment_code_id');
            $table->string('expenditures_id', 30)->nullable()->after('refund_id');
            $table->boolean('product_concern')->default(false)->after('is_read');
            $table->boolean('is_email')->default(false)->after('product_concern');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['refund_id', 'expenditures_id', 'product_concern', 'is_email']);
        });
    }
};
