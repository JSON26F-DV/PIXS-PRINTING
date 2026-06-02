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
        try {
            Schema::table('message_attachments', function (Blueprint $table) {
                $table->foreign('message_id', 'fk_attachments_message')
                    ->references('id')
                    ->on('messages')
                    ->onDelete('cascade');
            });
        } catch (Exception $e) {
            // Constraint might already exist
        }

        try {
            Schema::table('message_reactions', function (Blueprint $table) {
                $table->foreign('message_id', 'fk_reactions_message')
                    ->references('id')
                    ->on('messages')
                    ->onDelete('cascade');
            });
        } catch (Exception $e) {
            // Constraint might already exist
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        try {
            Schema::table('message_attachments', function (Blueprint $table) {
                $table->dropForeign('fk_attachments_message');
            });
        } catch (Exception $e) {
            // Ignored
        }

        try {
            Schema::table('message_reactions', function (Blueprint $table) {
                $table->dropForeign('fk_reactions_message');
            });
        } catch (Exception $e) {
            // Ignored
        }
    }
};
