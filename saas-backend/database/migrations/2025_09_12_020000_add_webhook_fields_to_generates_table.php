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
        Schema::table('generates', function (Blueprint $table) {
            $table->string('result_url')->nullable()->after('task_id');
            $table->text('error_message')->nullable()->after('result_url');
            $table->timestamp('completed_at')->nullable()->after('error_message');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('generates', function (Blueprint $table) {
            $table->dropColumn(['result_url', 'error_message', 'completed_at']);
        });
    }
};