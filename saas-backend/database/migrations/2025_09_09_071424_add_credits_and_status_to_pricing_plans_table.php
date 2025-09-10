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
            $table->integer('credits')->nullable()->after('price'); // Số credit
            $table->enum('status', ['active', 'inactive'])->default('active')->after('is_active'); // Trạng thái
            $table->boolean('is_popular')->default(false)->after('status'); // Gói phổ biến
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pricing_plans', function (Blueprint $table) {
            $table->dropColumn(['credits', 'status', 'is_popular']);
        });
    }
};
