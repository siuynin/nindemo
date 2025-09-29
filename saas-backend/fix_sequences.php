<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Fixing database sequences...\n";

// Fix bills sequence
$maxBillId = \DB::table('bills')->max('id') ?? 0;
$newBillSeq = $maxBillId + 1;
\DB::statement("SELECT setval('bills_id_seq', $newBillSeq)");
echo "Bills sequence fixed: set to $newBillSeq\n";

// Fix personal_access_tokens sequence  
$maxTokenId = \DB::table('personal_access_tokens')->max('id') ?? 0;
$newTokenSeq = $maxTokenId + 1;
\DB::statement("SELECT setval('personal_access_tokens_id_seq', $newTokenSeq)");
echo "Personal access tokens sequence fixed: set to $newTokenSeq\n";

echo "Database sequences fixed successfully!\n";