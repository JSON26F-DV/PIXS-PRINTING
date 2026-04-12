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
        Schema::create('message_reactions', function (Blueprint $table) {
            $table->increments('id');
            $table->string('message_id', 30);
            $table->string('user_id', 20);
            $table->enum('user_type', ['employee', 'customer']);
            $table->string('emoji', 10);

            $table->unique(['message_id', 'user_id'], 'uq_msg_user_reaction');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('message_reactions');
    }
};
