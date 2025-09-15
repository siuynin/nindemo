<?php

require_once 'bootstrap/app.php';

$app = Illuminate\Foundation\Application::configure(
    basePath: dirname(__DIR__)
)->withRouting(
    web: __DIR__.'/../routes/web.php',
    api: __DIR__.'/../routes/api.php',
    commands: __DIR__.'/../routes/console.php',
    health: '/up'
)->withMiddleware(function (Illuminate\Foundation\Configuration\Middleware $middleware) {
    //
})->withExceptions(function (Illuminate\Foundation\Configuration\Exceptions $exceptions) {
    //
})->create();

$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Voice;

echo "=== VOICE STATISTICS ===\n";
echo "Total voices in DB: " . Voice::count() . "\n";
echo "Public ElevenLab voices: " . Voice::publicElevenlab()->count() . "\n";
echo "Voices with gender: " . Voice::publicElevenlab()->whereNotNull('gender')->count() . "\n";
echo "Voices with age: " . Voice::publicElevenlab()->whereNotNull('age')->count() . "\n";
echo "\n=== CATEGORY BREAKDOWN ===\n";

$categories = Voice::publicElevenlab()->select('category')->distinct()->pluck('category');
foreach ($categories as $category) {
    $count = Voice::publicElevenlab()->where('category', $category)->count();
    echo "Category '{$category}': {$count} voices\n";
}

echo "\n=== GENDER BREAKDOWN ===\n";
$genders = Voice::publicElevenlab()->whereNotNull('gender')->select('gender')->distinct()->pluck('gender');
foreach ($genders as $gender) {
    $count = Voice::publicElevenlab()->where('gender', $gender)->count();
    echo "Gender '{$gender}': {$count} voices\n";
}

echo "\n=== AGE BREAKDOWN ===\n";
$ages = Voice::publicElevenlab()->whereNotNull('age')->select('age')->distinct()->pluck('age');
foreach ($ages as $age) {
    $count = Voice::publicElevenlab()->where('age', $age)->count();
    echo "Age '{$age}': {$count} voices\n";
}

echo "\n=== SAMPLE VOICES WITH COMPLETE DATA ===\n";
$sampleVoices = Voice::publicElevenlab()
    ->whereNotNull('gender')
    ->whereNotNull('age')
    ->limit(5)
    ->get(['id', 'name', 'category', 'gender', 'age']);

foreach ($sampleVoices as $voice) {
    echo "ID: {$voice->id}, Name: {$voice->name}, Category: {$voice->category}, Gender: {$voice->gender}, Age: {$voice->age}\n";
}