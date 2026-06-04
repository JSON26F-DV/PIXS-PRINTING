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
        if (!Schema::hasTable('screenplate_requests')) {
            Schema::create('screenplate_requests', function (Blueprint $table) {
                $table->string('id', 20)->primary();
                $table->string('customer_id', 20)->index('customer_id');
                $table->string('product_id', 10)->nullable()->index('product_id');
                $table->string('variant_id', 30)->nullable()->index('variant_id');
                $table->unsignedTinyInteger('color_count')->default(1);
                $table->enum('alignment', ['Front', 'Back-to-Back', 'Triple Logo'])->default('Front');
                $table->string('reference_image', 500)->nullable();
                $table->text('comment')->nullable();
                $table->decimal('calculated_total', 12)->default(0);
                $table->enum('status', ['Pending', 'Approved', 'Rejected'])->default('Pending');
                $table->dateTime('created_at')->useCurrent();
                $table->dateTime('updated_at')->useCurrentOnUpdate()->useCurrent();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('screenplate_requests');
    }
};
