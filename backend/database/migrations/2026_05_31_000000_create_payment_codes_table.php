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
        if (! Schema::hasTable('payment_codes')) {
            Schema::create('payment_codes', function (Blueprint $table) {
                $table->string('id', 30)->primary();
                $table->string('code', 20)->unique();
                $table->tinyInteger('is_used')->default(0);
                $table->dateTime('used_at')->nullable();
                $table->dateTime('created_at')->useCurrent();
            });
        }

        if (! Schema::hasColumn('orders', 'payment_code_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->string('payment_code_id', 30)->nullable()->after('delivery_method_id');
            });
        }

        if (! Schema::hasColumn('messages', 'payment_code_id')) {
            Schema::table('messages', function (Blueprint $table) {
                $table->string('payment_code_id', 30)->nullable()->after('screenplate_request_id');
            });
        }

        // Separate check/application of foreign key to be extremely safe
        try {
            Schema::table('messages', function (Blueprint $table) {
                // Check if FK already exists or try to add it. We wrap it in a try-catch for maximum safety.
                $table->foreign('payment_code_id', 'fk_message_payment_code')
                    ->references('id')
                    ->on('payment_codes')
                    ->onDelete('set null');
            });
        } catch (Throwable $e) {
            // Silently ignore if FK already exists
        }

        if (! Schema::hasColumn('messages', 'is_pinned')) {
            Schema::table('messages', function (Blueprint $table) {
                $table->dateTime('is_pinned')->nullable()->after('payment_code_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        try {
            if (Schema::hasColumn('messages', 'payment_code_id')) {
                Schema::table('messages', function (Blueprint $table) {
                    $table->dropForeign('fk_message_payment_code');
                });
            }
        } catch (Throwable $e) {
        }

        if (Schema::hasColumn('messages', 'payment_code_id')) {
            Schema::table('messages', function (Blueprint $table) {
                $table->dropColumn('payment_code_id');
            });
        }

        if (Schema::hasColumn('messages', 'is_pinned')) {
            Schema::table('messages', function (Blueprint $table) {
                $table->dropColumn('is_pinned');
            });
        }

        if (Schema::hasColumn('orders', 'payment_code_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropColumn('payment_code_id');
            });
        }

        Schema::dropIfExists('payment_codes');
    }
};
