<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Checking database sequences...\n";
echo "Max Bill ID: " . \App\Models\Bill::max('id') . "\n";
echo "Max Token ID: " . \DB::table('personal_access_tokens')->max('id') . "\n";

// Check current sequences
$billSequence = \DB::select("SELECT last_value FROM bills_id_seq")[0]->last_value ?? 'N/A';
$tokenSequence = \DB::select("SELECT last_value FROM personal_access_tokens_id_seq")[0]->last_value ?? 'N/A';

echo "Bill sequence current value: " . $billSequence . "\n";
echo "Token sequence current value: " . $tokenSequence . "\n";