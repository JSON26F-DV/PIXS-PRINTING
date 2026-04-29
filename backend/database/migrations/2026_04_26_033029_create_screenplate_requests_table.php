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
        Schema::create('screenplate_requests', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('customer_id', 20)->index();
            $table->string('product_id', 10)->nullable()->index();
            $table->string('variant_id', 30)->nullable()->index();
            $table->unsignedTinyInteger('color_count')->default(1);
            $table->enum('alignment', ['Front', 'Back-to-Back', 'Triple Logo'])->default('Front');
            $table->string('reference_image', 500)->nullable();
            $table->text('comment')->nullable();
            $table->decimal('calculated_total', 12, 2)->default(0.00);
            $table->enum('status', ['Pending', 'Approved', 'Rejected'])->default('Pending');
            $table->dateTime('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('screenplate_requests');
    }
};
