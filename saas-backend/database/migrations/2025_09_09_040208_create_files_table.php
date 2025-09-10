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
        Schema::create('files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('original_name'); // Tên file gốc
            $table->string('stored_name'); // Tên file lưu trữ (unique)
            $table->string('file_path'); // Đường dẫn file
            $table->string('mime_type'); // Loại file
            $table->bigInteger('file_size'); // Kích thước file (bytes)
            $table->string('file_extension', 10); // Phần mở rộng file
            $table->enum('file_type', ['document', 'image', 'video', 'audio', 'other']); // Loại file
            $table->boolean('is_public')->default(false); // File công khai hay riêng tư
            $table->integer('download_count')->default(0); // Số lần download
            $table->json('metadata')->nullable(); // Metadata bổ sung (JSON)
            $table->string('hash', 64)->nullable(); // Hash để kiểm tra duplicate
            $table->timestamp('last_accessed_at')->nullable(); // Lần truy cập cuối
            $table->timestamps();
            
            $table->index(['user_id', 'file_type']);
            $table->index(['hash']);
            $table->index(['created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('files');
    }
};
