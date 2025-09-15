<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Voice;

// Check voices with gender and age after processing
echo "Testing processed attributes:\n";
$samples = Voice::publicElevenlab()->take(5)->get();
foreach ($samples as $voice) {
    echo "ID: {$voice->id}, Name: {$voice->name}\n";
    echo "Original - Gender: {$voice->gender}, Age: {$voice->age}\n";
    echo "Processed - Gender: {$voice->processed_gender}, Age: {$voice->processed_age}\n";
    if ($voice->fine_data) {
        $fineData = $voice->fine_data;
        echo "Fine data gender: " . ($fineData['gender'] ?? 'null') . "\n";
        echo "Fine data age: " . ($fineData['age'] ?? 'null') . "\n";
    }
    echo "---\n";
}

// Check if any voice has gender/age in fine_data
echo "\nSearching for voices with gender/age in fine_data:\n";
$voicesWithFineDataGender = Voice::publicElevenlab()
    ->whereRaw("JSON_EXTRACT(fine_data, '$.gender') IS NOT NULL")
    ->take(3)
    ->get();
    
if ($voicesWithFineDataGender->count() > 0) {
    foreach ($voicesWithFineDataGender as $voice) {
        echo "Found voice with fine_data gender: {$voice->name}\n";
        echo "Fine data: " . json_encode($voice->fine_data) . "\n";
    }
} else {
    echo "No voices found with gender in fine_data\n";
}