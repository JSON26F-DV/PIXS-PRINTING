<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->string('id', 20)->primary();
            $table->string('user_id', 20)->nullable();
            $table->string('user_type', 20)->nullable();
            $table->string('action', 100);
            $table->string('entity_type', 100);
            $table->string('entity_id', 30)->nullable();
            $table->text('details')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            
            $table->string('error_code', 10)->nullable();
            $table->string('error_type', 50)->nullable();
            $table->string('severity', 20)->default('info');
            $table->text('error_message')->nullable();
            $table->text('stack_trace')->nullable();
            $table->text('request_payload')->nullable();
            $table->string('endpoint', 255)->nullable();
            $table->string('request_method', 10)->nullable();
            $table->boolean('is_resolved')->default(false);
            $table->string('resolved_by', 20)->nullable();
            $table->timestamp('resolved_at')->nullable();

            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'created_at']);
            $table->index(['entity_type', 'entity_id']);
            $table->index(['action', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
