<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add 'refund' to the credit_type enum
        DB::statement("ALTER TABLE user_credits DROP CONSTRAINT user_credits_credit_type_check");
        DB::statement("ALTER TABLE user_credits ADD CONSTRAINT user_credits_credit_type_check CHECK (credit_type::text = ANY (ARRAY['free'::character varying, 'purchased'::character varying, 'bonus'::character varying, 'refund'::character varying]::text[]))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'refund' from the credit_type enum
        DB::statement("ALTER TABLE user_credits DROP CONSTRAINT user_credits_credit_type_check");
        DB::statement("ALTER TABLE user_credits ADD CONSTRAINT user_credits_credit_type_check CHECK (credit_type::text = ANY (ARRAY['free'::character varying, 'purchased'::character varying, 'bonus'::character varying]::text[]))");
    }
};
