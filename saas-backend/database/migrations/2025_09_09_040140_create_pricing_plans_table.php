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
        Schema::create('pricing_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Tên gói (Basic, Pro, Enterprise)
            $table->text('description')->nullable(); // Mô tả gói
            $table->decimal('price', 10, 2); // Giá gói (0 cho free plan)
            $table->string('billing_cycle'); // monthly, yearly, lifetime
            $table->integer('credits_included'); // Số credit được cung cấp
            $table->boolean('features')->default(false); // Tính năng đặc biệt
            $table->integer('max_voice_clone')->default(0); // Số lượng giọng nói tối đa có thể clone
            $table->boolean('is_premium')->default(false); // Gói premium
            $table->boolean('is_active')->default(true); // Trạng thái kích hoạt
            $table->integer('sort_order')->default(0); // Thứ tự hiển thị
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pricing_plans');
    }
};
