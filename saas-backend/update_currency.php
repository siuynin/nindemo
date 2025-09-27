<?php

use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

DB::table('pricing_plans')->update(['currency' => 'VND']);

echo "Updated currency for all pricing plans to VND\n";