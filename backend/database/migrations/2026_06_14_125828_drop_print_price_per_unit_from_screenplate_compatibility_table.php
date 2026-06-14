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
        Schema::table('screenplate_compatibility', function (Blueprint $table) {
            $table->dropColumn('print_price_per_unit');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('screenplate_compatibility', function (Blueprint $table) {
            $table->decimal('print_price_per_unit', 10)->default(0);
        });
    }
};
