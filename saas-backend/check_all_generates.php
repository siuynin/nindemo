<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Generate;

echo "Latest generates (all types):\n";
echo "=============================\n";

$generates = Generate::orderBy('id', 'desc')
    ->take(10)
    ->get(['id', 'type', 'task_id', 'status', 'created_at']);

foreach ($generates as $generate) {
    echo "ID: {$generate->id}, Type: {$generate->type}, Task ID: {$generate->task_id}, Status: {$generate->status}, Created: {$generate->created_at}\n";
}