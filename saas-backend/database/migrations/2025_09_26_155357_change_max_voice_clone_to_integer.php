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
            // Change max_voice_clone from boolean to integer
            $table->integer('max_voice_clone')->default(0)->comment('Maximum voice clone allowed')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pricing_plans', function (Blueprint $table) {
            // Change max_voice_clone back to boolean
            $table->boolean('max_voice_clone')->default(false)->comment('Maximum voice clone allowed')->change();
        });
    }
};
