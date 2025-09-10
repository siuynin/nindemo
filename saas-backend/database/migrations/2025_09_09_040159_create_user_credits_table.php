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
        Schema::create('user_credits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('pricing_plan_id')->nullable()->constrained()->onDelete('set null');
            $table->integer('total_credits')->default(0); // Tổng credit hiện có
            $table->integer('used_credits')->default(0); // Credit đã sử dụng
            $table->integer('remaining_credits')->default(0); // Credit còn lại
            $table->date('expires_at')->nullable(); // Ngày hết hạn credit
            $table->enum('credit_type', ['free', 'purchased', 'bonus'])->default('free');
            $table->text('notes')->nullable(); // Ghi chú
            $table->timestamps();
            
            $table->index(['user_id', 'expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_credits');
    }
};
