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
        Schema::table('pricing_plans', function (Blueprint $table) {
            // Thay đổi features từ json thành boolean
            $table->boolean('features')->default(false)->change();
            
            // Thay đổi max_voice_clone từ boolean thành integer
            $table->integer('max_voice_clone')->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pricing_plans', function (Blueprint $table) {
            // Rollback features về json
            $table->json('features')->nullable()->change();
            
            // Rollback max_voice_clone về boolean
            $table->boolean('max_voice_clone')->default(false)->change();
        });
    }
};
