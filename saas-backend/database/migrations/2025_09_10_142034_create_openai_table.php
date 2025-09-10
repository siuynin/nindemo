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
        Schema::create('openai', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('user_id')->nullable();
            $table->string('title', 191);
            $table->text('description');
            $table->string('slug', 191)->nullable();
            $table->boolean('active')->default(true);
            $table->text('questions')->nullable();
            $table->text('image')->nullable();
            $table->boolean('premium')->default(false);
            $table->string('type', 191)->default('text');
            $table->text('prompt')->nullable();
            $table->boolean('custom_template')->default(false);
            $table->boolean('tone_of_voice')->default(false);
            $table->string('color', 191)->nullable();
            $table->text('filters')->nullable();
            $table->text('package')->nullable();
            $table->timestamps();
            
            $table->index(['active', 'type']);
            $table->index(['user_id']);
            $table->index(['slug']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('openai');
    }
};
