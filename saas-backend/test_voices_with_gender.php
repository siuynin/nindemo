<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Voice;

// Get voices with gender
$voices = Voice::publicElevenlab()->whereNotNull('gender')->take(3)->get();

echo "Voices with gender and age:\n";
foreach($voices as $voice) {
    $data = [
        'id' => $voice->id,
        'voice_id' => $voice->voice_id,
        'name' => $voice->name,
        'category' => $voice->category,
        'gender' => $voice->processed_gender,
        'age' => $voice->processed_age,
        'language' => $voice->processed_languages
    ];
    echo json_encode($data, JSON_PRETTY_PRINT) . "\n";
}