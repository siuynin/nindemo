<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Voice;

$voices = Voice::where('is_public', true)->where('provider', 'elevenlabs')->get();

echo "Total voices: " . $voices->count() . PHP_EOL;
echo "With gender: " . $voices->whereNotNull('gender')->count() . PHP_EOL;
echo "With age: " . $voices->whereNotNull('age')->count() . PHP_EOL;
echo "With category: " . $voices->whereNotNull('category')->count() . PHP_EOL;

echo "\nGender values: " . $voices->whereNotNull('gender')->pluck('gender')->unique()->implode(', ') . PHP_EOL;
echo "Age values: " . $voices->whereNotNull('age')->pluck('age')->unique()->implode(', ') . PHP_EOL;
echo "Category values: " . $voices->whereNotNull('category')->pluck('category')->unique()->implode(', ') . PHP_EOL;

echo "\nSample voices with complete data:\n";
$sampleVoices = $voices->whereNotNull('gender')->whereNotNull('age')->whereNotNull('category')->take(5);
foreach ($sampleVoices as $voice) {
    echo "- {$voice->name}: gender={$voice->gender}, age={$voice->age}, category={$voice->category}\n";
}