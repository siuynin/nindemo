<?php

require_once 'vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as Capsule;

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Setup database connection
$capsule = new Capsule;
$capsule->addConnection([
    'driver' => 'pgsql',
    'host' => $_ENV['DB_HOST'] ?? 'localhost',
    'database' => $_ENV['DB_DATABASE'] ?? 'aiapp',
    'username' => $_ENV['DB_USERNAME'] ?? 'postgres',
    'password' => $_ENV['DB_PASSWORD'] ?? 'admin',
    'charset' => 'utf8',
    'prefix' => '',
    'schema' => 'public',
]);

$capsule->setAsGlobal();
$capsule->bootEloquent();

try {
    echo "Checking generates table structure:\n";
    echo "=====================================\n";
    
    $columns = Capsule::select("
        SELECT column_name, data_type, character_maximum_length, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'generates' 
        AND table_schema = 'public' 
        ORDER BY ordinal_position
    ");
    
    foreach ($columns as $column) {
        $maxLength = $column->character_maximum_length ?? 'NULL';
        echo sprintf("%-20s | %-15s | %-10s | %s\n", 
            $column->column_name, 
            $column->data_type, 
            $maxLength,
            $column->is_nullable
        );
    }
    
    echo "\nFocusing on problematic columns:\n";
    echo "================================\n";
    
    $problemColumns = Capsule::select("
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'generates' 
        AND table_schema = 'public' 
        AND column_name IN ('result_url', 'file_patch')
        ORDER BY column_name
    ");
    
    foreach ($problemColumns as $column) {
        $maxLength = $column->character_maximum_length ?? 'UNLIMITED';
        echo sprintf("%-15s | %-15s | %s\n", 
            $column->column_name, 
            $column->data_type, 
            $maxLength
        );
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}