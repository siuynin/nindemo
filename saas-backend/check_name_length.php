<?php

$data = json_decode(file_get_contents('showcase_parsed.json'), true);
$maxLength = 0;
$longNames = [];

foreach ($data as $item) {
    $length = strlen($item['name']);
    if ($length > $maxLength) {
        $maxLength = $length;
    }
    if ($length > 255) {
        $longNames[] = [
            'name' => substr($item['name'], 0, 100) . '...', 
            'length' => $length,
            'full_name' => $item['name']
        ];
    }
}

echo "Max name length: $maxLength\n";
echo "Names longer than 255 chars: " . count($longNames) . "\n";

if (count($longNames) > 0) {
    echo "\nExamples of long names:\n";
    foreach (array_slice($longNames, 0, 5) as $item) {
        echo "- Length {$item['length']}: {$item['name']}\n";
    }
}