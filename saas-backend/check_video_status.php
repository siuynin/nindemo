<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Generate;

echo "Latest video generations:\n";
echo "========================\n";

$videos = Generate::where('type', 'video')
    ->orderBy('id', 'desc')
    ->take(5)
    ->get(['id', 'task_id', 'status', 'created_at']);

foreach ($videos as $video) {
    echo "ID: {$video->id}, Task ID: {$video->task_id}, Status: {$video->status}, Created: {$video->created_at}\n";
}