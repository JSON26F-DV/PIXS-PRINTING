<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            if (DB::getDriverName() === 'sqlite') {
                try {
                    $table->dropForeign(['payment_code_id']);
                } catch (Throwable $e) {
                    // Ignore
                }
            } else {
                try {
                    $table->dropForeign('fk_message_payment_code');
                } catch (Throwable $e) {
                    // Ignore
                }
            }
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn([
                'order_id',
                'screenplate_request_id',
                'payment_code_id',
                'refund_id',
                'expenditures_id',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->string('order_id', 30)->nullable()->after('message');
            $table->string('screenplate_request_id', 20)->nullable()->after('order_id');
            $table->string('payment_code_id', 30)->nullable()->after('screenplate_request_id');
            $table->string('refund_id', 30)->nullable()->after('payment_code_id');
            $table->string('expenditures_id', 30)->nullable()->after('refund_id');
        });

        Schema::table('messages', function (Blueprint $table) {
            if (DB::getDriverName() === 'sqlite') {
                try {
                    $table->foreign('payment_code_id')
                        ->references('id')
                        ->on('payment_codes')
                        ->onDelete('set null');
                } catch (Throwable $e) {
                    // Ignore
                }
            } else {
                try {
                    $table->foreign('payment_code_id', 'fk_message_payment_code')
                        ->references('id')
                        ->on('payment_codes')
                        ->onDelete('set null');
                } catch (Throwable $e) {
                    // Ignore
                }
            }
        });
    }
};
