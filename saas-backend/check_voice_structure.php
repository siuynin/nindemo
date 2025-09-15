<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Voice;

echo "Total voices: " . Voice::count() . PHP_EOL;
echo "Status = 1: " . Voice::where('status', 1)->count() . PHP_EOL;
echo "Status = true: " . Voice::where('status', true)->count() . PHP_EOL;
echo "Platforms = 'elevenlab': " . Voice::where('platforms', 'elevenlab')->count() . PHP_EOL;
echo "Platforms = 'elevenlabs': " . Voice::where('platforms', 'elevenlabs')->count() . PHP_EOL;
echo "PublicElevenlab scope: " . Voice::publicElevenlab()->count() . PHP_EOL;

// Check distinct platforms values
$platforms = Voice::distinct()->pluck('platforms')->filter();
echo "\nPlatforms found: " . $platforms->implode(', ') . PHP_EOL;

// Check distinct status values
$statuses = Voice::distinct()->pluck('status')->filter();
echo "Status values found: " . $statuses->implode(', ') . PHP_EOL;

// Check first voice with complete data
$sample = Voice::whereNotNull('gender')->whereNotNull('age')->first();
if($sample) {
    echo "\nSample voice with complete data:\n";
    echo "- Name: {$sample->name}\n";
    echo "- Platforms: {$sample->platforms}\n";
    echo "- Status: {$sample->status}\n";
    echo "- Gender: {$sample->gender}\n";
    echo "- Age: {$sample->age}\n";
    echo "- Category: {$sample->category}\n";
}