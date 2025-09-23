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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('phone')->nullable(); // Số điện thoại
            $table->string('avatar')->nullable(); // Ảnh đại diện
            $table->enum('role', ['user', 'admin'])->default('user'); // Vai trò
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active'); // Trạng thái
            $table->unsignedBigInteger('current_pricing_plan_id')->nullable(); // Gói hiện tại
            $table->timestamp('plan_expires_at')->nullable(); // Ngày hết hạn gói
            $table->json('preferences')->nullable(); // Tùy chọn cá nhân (JSON)
            $table->timestamp('last_login_at')->nullable(); // Lần đăng nhập cuối
            $table->string('last_login_ip')->nullable(); // IP đăng nhập cuối
            $table->rememberToken();
            $table->timestamps();
            
            $table->index(['status', 'role']);
            $table->index(['current_pricing_plan_id']);
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
