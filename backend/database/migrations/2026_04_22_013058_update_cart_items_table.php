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
        Schema::table('cart_items', function (Blueprint $table) {
            $table->decimal('total_cart_price', 10, 2)->after('plate_price')->default(0);
            $table->boolean('selected')->after('total_cart_price')->default(false);
            if (Schema::hasColumn('cart_items', 'updated_at')) {
                $table->dropColumn('updated_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropColumn(['total_cart_price', 'selected']);
            $table->dateTime('updated_at')->useCurrentOnUpdate()->useCurrent();
        });
    }
};
