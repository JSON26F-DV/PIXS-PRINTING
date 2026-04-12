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
        Schema::create('messages', function (Blueprint $table) {
            $table->string('id', 30)->primary();
            $table->string('conversation_id', 50)->index('conversation_id');
            $table->string('sender_id', 20);
            $table->enum('sender_type', ['employee', 'customer']);
            $table->string('receiver_id', 20);
            $table->enum('receiver_type', ['employee', 'customer']);
            $table->text('message')->nullable();
            $table->string('reply_to_id', 30)->nullable()->index('reply_to_id');
            $table->boolean('is_edited')->default(false);
            $table->text('original_text')->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->boolean('is_read')->default(false);
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->useCurrentOnUpdate()->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
