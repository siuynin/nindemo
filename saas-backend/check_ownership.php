<?php

require 'vendor/autoload.php';
require 'bootstrap/app.php';

use App\Models\Generate;

$generate11 = Generate::find(11);
if ($generate11) {
    echo "Generate 11 belongs to user: " . $generate11->user_id . PHP_EOL;
} else {
    echo "Generate 11 not found" . PHP_EOL;
}

$generate12 = Generate::find(12);
if ($generate12) {
    echo "Generate 12 belongs to user: " . $generate12->user_id . PHP_EOL;
} else {
    echo "Generate 12 not found" . PHP_EOL;
}

// List all generates with their user_id
echo "\nAll generates:\n";
$generates = Generate::all();
foreach ($generates as $generate) {
    echo "ID: {$generate->id}, User: {$generate->user_id}, Status: {$generate->status}, Result URL: {$generate->result_url}\n";
}