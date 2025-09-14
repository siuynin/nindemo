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
        Schema::create('voices', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('name');
            $table->string('voice_id')->unique();
            $table->string('language', 10);
            $table->string('category', 50);
            $table->text('preview_url')->nullable();
            $table->json('fine_data')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->enum('age', ['young', 'middle_aged', 'old'])->nullable();
            $table->text('description')->nullable();
            $table->string('platforms')->default('elevenlab');
            $table->boolean('status')->default(true);
            $table->timestamps();
            
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['voice_id', 'language']);
            $table->index(['category', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('voices');
    }
};
