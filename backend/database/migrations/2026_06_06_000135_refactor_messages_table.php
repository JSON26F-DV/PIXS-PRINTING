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
        Schema::table('messages', function (Blueprint $table) {
            // Add new columns
            $table->enum('message_type', [
                'order',
                'screenplate_request',
                'payment_code',
                'refund',
                'expenditure',
            ])->nullable()->after('reply_to_id');

            $table->string('type_id', 30)->nullable()->after('message_type');

            // Create index for faster lookups
            $table->index(['message_type', 'type_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['message_type', 'type_id']);
            $table->dropColumn(['message_type', 'type_id']);
        });
    }
};
