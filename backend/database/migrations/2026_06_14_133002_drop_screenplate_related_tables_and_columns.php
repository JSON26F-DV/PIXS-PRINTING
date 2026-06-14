<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Disable foreign key checks to safely drop tables and columns
        DB::statement('SET FOREIGN_KEY_CHECKS = 0;');

        // 1. Drop tables
        Schema::dropIfExists('screenplate_compatibility');
        Schema::dropIfExists('screenplate_requests');
        Schema::dropIfExists('screenplate_incompatible');
        Schema::dropIfExists('screenplates');

        // 2. Drop columns from other tables
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'is_need_screenplate')) {
                $table->dropColumn('is_need_screenplate');
            }
        });

        Schema::table('product_variants', function (Blueprint $table) {
            if (Schema::hasColumn('product_variants', 'is_need_screenplate')) {
                $table->dropColumn('is_need_screenplate');
            }
        });

        Schema::table('cart_items', function (Blueprint $table) {
            if (Schema::hasColumn('cart_items', 'screenplate_id')) {
                $table->dropColumn('screenplate_id');
            }
            if (Schema::hasColumn('cart_items', 'plate_price')) {
                $table->dropColumn('plate_price');
            }
        });

        Schema::table('order_items', function (Blueprint $table) {
            if (Schema::hasColumn('order_items', 'screenplate_id')) {
                $table->dropColumn('screenplate_id');
            }
            if (Schema::hasColumn('order_items', 'plate_price')) {
                $table->dropColumn('plate_price');
            }
        });

        Schema::table('messages', function (Blueprint $table) {
            if (Schema::hasColumn('messages', 'screenplate_request_id')) {
                $table->dropColumn('screenplate_request_id');
            }
        });

        Schema::table('payment_codes', function (Blueprint $table) {
            if (Schema::hasColumn('payment_codes', 'screenplate_request_id')) {
                $table->dropColumn('screenplate_request_id');
            }
        });

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS = 1;');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};
