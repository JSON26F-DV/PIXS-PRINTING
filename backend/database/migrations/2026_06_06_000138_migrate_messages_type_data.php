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
        // Migrate order_id
        DB::table('messages')
            ->whereNotNull('order_id')
            ->update([
                'message_type' => 'order',
                'type_id' => DB::raw('order_id')
            ]);

        // Migrate screenplate_request_id
        DB::table('messages')
            ->whereNotNull('screenplate_request_id')
            ->update([
                'message_type' => 'screenplate_request',
                'type_id' => DB::raw('screenplate_request_id')
            ]);

        // Migrate payment_code_id
        DB::table('messages')
            ->whereNotNull('payment_code_id')
            ->update([
                'message_type' => 'payment_code',
                'type_id' => DB::raw('payment_code_id')
            ]);

        // Migrate refund_id
        DB::table('messages')
            ->whereNotNull('refund_id')
            ->update([
                'message_type' => 'refund',
                'type_id' => DB::raw('refund_id')
            ]);

        // Migrate expenditures_id
        DB::table('messages')
            ->whereNotNull('expenditures_id')
            ->update([
                'message_type' => 'expenditure',
                'type_id' => DB::raw('expenditures_id')
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rollback logic would restore data to old columns if needed,
        // but for now we leave it empty.
    }
};
