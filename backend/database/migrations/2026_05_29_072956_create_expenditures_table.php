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
        if (! Schema::hasTable('expenditures')) {
            Schema::create('expenditures', function (Blueprint $table) {
                $table->increments('id');
                $table->string('variant_id', 30)->nullable();
                $table->enum('category', [
                    'Employee Salaries',
                    'Raw Materials / Products',
                    'Utilities',
                    'Office / Operational Expenses',
                    'Extra / Miscellaneous Expenses',
                    'Others',
                ]);
                $table->decimal('amount', 12, 2)->default(0);
                $table->text('description')->nullable();
                $table->timestamp('created_at')->useCurrent();

                // Add indexes as observed in the database
                $table->index('category', 'idx_category');
                $table->index('created_at', 'idx_created_at');
                $table->index('variant_id', 'idx_variant');

                $table->foreign('variant_id', 'fk_exp_variant')
                    ->references('variant_id')
                    ->on('product_variants')
                    ->onDelete('set null')
                    ->onUpdate('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenditures');
    }
};
