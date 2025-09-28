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
        // Update user_credits table to use decimal for credit amounts
        Schema::table('user_credits', function (Blueprint $table) {
            $table->decimal('total_credits', 10, 2)->default(0)->change();
            $table->decimal('used_credits', 10, 2)->default(0)->change();
            $table->decimal('remaining_credits', 10, 2)->default(0)->change();
        });

        // Update credit_transactions table to use decimal for amount
        Schema::table('credit_transactions', function (Blueprint $table) {
            $table->decimal('amount', 10, 2)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert user_credits table back to integer
        Schema::table('user_credits', function (Blueprint $table) {
            $table->integer('total_credits')->default(0)->change();
            $table->integer('used_credits')->default(0)->change();
            $table->integer('remaining_credits')->default(0)->change();
        });

        // Revert credit_transactions table back to integer
        Schema::table('credit_transactions', function (Blueprint $table) {
            $table->integer('amount')->change();
        });
    }
};