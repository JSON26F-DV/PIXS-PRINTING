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
        Schema::table('inventory_logs', function (Blueprint $table) {
            $table->string('variant_id', 30)->nullable()->after('product_id');

            $table->foreign('variant_id', 'fk_inv_log_variant')
                ->references('variant_id')
                ->on('product_variants')
                ->onDelete('set null')
                ->onUpdate('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_logs', function (Blueprint $table) {
            $table->dropForeign('fk_inv_log_variant');
            $table->dropColumn('variant_id');
        });
    }
};
