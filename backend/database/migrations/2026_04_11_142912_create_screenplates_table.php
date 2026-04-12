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
        Schema::create('screenplates', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('owner_id', 20)->index('owner_id');
            $table->string('plate_name');
            $table->decimal('base_setup_fee', 10)->default(0);
            $table->boolean('is_flatscreen')->default(false);
            $table->unsignedInteger('channels')->default(1);
            $table->enum('alignment', ['Front', 'Back-to-Back', 'Triple Logo'])->default('Front');
            $table->set('supported_alignments', ['Front', 'Back-to-Back', 'Triple Logo'])->default('Front');
            $table->string('dimensions', 50)->nullable();
            $table->text('technical_info')->nullable();
            $table->string('image', 500)->nullable();
            $table->text('comment')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('screenplates');
    }
};
