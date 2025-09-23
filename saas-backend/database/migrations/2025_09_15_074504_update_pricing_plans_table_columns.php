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
            // Check if columns exist before dropping them
            if (Schema::hasColumn('pricing_plans', 'max_file_size')) {
                $table->dropColumn('max_file_size');
            }
            if (Schema::hasColumn('pricing_plans', 'max_files_per_month')) {
                $table->dropColumn('max_files_per_month');
            }
            
            // Add new columns only if they don't exist
            if (!Schema::hasColumn('pricing_plans', 'max_voice_clone')) {
                $table->boolean('max_voice_clone')->default(false)->comment('Maximum voice clone allowed');
            }
            if (!Schema::hasColumn('pricing_plans', 'is_premium')) {
                $table->boolean('is_premium')->default(false)->comment('Premium plan indicator');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pricing_plans', function (Blueprint $table) {
            // Reverse the changes
            $table->dropColumn(['max_voice_clone', 'is_premium']);
            $table->integer('max_file_size')->default(0)->comment('Maximum file size allowed in MB');
            $table->integer('max_files_per_month')->default(0)->comment('Maximum files per month');
        });
    }
};
