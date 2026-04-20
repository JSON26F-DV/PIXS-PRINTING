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
        Schema::create('conversation_participants', function (Blueprint $table) {
            $table->increments('id');
            $table->string('conversation_id', 50);
            $table->string('participant_id', 20);
            $table->enum('participant_type', ['employee', 'customer']);
            $table->dateTime('joined_at')->useCurrent();

            $table->unique(['conversation_id', 'participant_id'], 'uq_conv_participant');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conversation_participants');
    }
};
