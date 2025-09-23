<?php

require_once 'vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Database\Schema\Blueprint;

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Setup database connection
$capsule = new Capsule;
$capsule->addConnection([
    'driver' => 'pgsql',
    'host' => $_ENV['DB_HOST'],
    'database' => $_ENV['DB_DATABASE'],
    'username' => $_ENV['DB_USERNAME'],
    'password' => $_ENV['DB_PASSWORD'],
    'port' => $_ENV['DB_PORT'],
    'charset' => 'utf8',
    'prefix' => '',
    'schema' => 'public',
]);

$capsule->setAsGlobal();
$capsule->bootEloquent();

echo "=== IMPORT DATA TO POSTGRESQL ===\n\n";

// Read exported data
$jsonFile = 'sqlite_data_export.json';
if (!file_exists($jsonFile)) {
    echo "❌ Export file not found: $jsonFile\n";
    exit(1);
}

$data = json_decode(file_get_contents($jsonFile), true);
if (!$data) {
    echo "❌ Failed to parse JSON data\n";
    exit(1);
}

$totalImported = 0;
$importOrder = [
    'pricing_plans',
    'users', 
    'user_credits',
    'bills',
    'pay_pal_transactions',
    'models',
    'voices',
    'generates',
    'personal_access_tokens'
];

foreach ($importOrder as $tableName) {
    if (!isset($data[$tableName]) || empty($data[$tableName])) {
        echo "⚠️  No data for table: $tableName\n";
        continue;
    }
    
    echo "📊 Importing table: $tableName...\n";
    
    try {
        $records = $data[$tableName];
        $imported = 0;
        
        foreach ($records as $record) {
            // Handle special fields
            if (isset($record['created_at']) && $record['created_at']) {
                $record['created_at'] = date('Y-m-d H:i:s', strtotime($record['created_at']));
            }
            if (isset($record['updated_at']) && $record['updated_at']) {
                $record['updated_at'] = date('Y-m-d H:i:s', strtotime($record['updated_at']));
            }
            if (isset($record['email_verified_at']) && $record['email_verified_at']) {
                $record['email_verified_at'] = date('Y-m-d H:i:s', strtotime($record['email_verified_at']));
            }
            if (isset($record['plan_expires_at']) && $record['plan_expires_at']) {
                $record['plan_expires_at'] = date('Y-m-d H:i:s', strtotime($record['plan_expires_at']));
            }
            if (isset($record['completed_at']) && $record['completed_at']) {
                $record['completed_at'] = date('Y-m-d H:i:s', strtotime($record['completed_at']));
            }
            if (isset($record['expires_at']) && $record['expires_at']) {
                $record['expires_at'] = date('Y-m-d H:i:s', strtotime($record['expires_at']));
            }
            
            // Convert JSON fields
            if (isset($record['preferences']) && is_string($record['preferences'])) {
                $record['preferences'] = json_decode($record['preferences'], true);
            }
            if (isset($record['abilities']) && is_string($record['abilities'])) {
                $record['abilities'] = json_decode($record['abilities'], true);
            }
            
            // Insert or update record
            try {
                Capsule::table($tableName)->insert($record);
                $imported++;
            } catch (Exception $e) {
                // Try to update if insert fails (duplicate key)
                if (strpos($e->getMessage(), 'duplicate key') !== false || strpos($e->getMessage(), 'already exists') !== false) {
                    $primaryKey = 'id';
                    if (isset($record[$primaryKey])) {
                        Capsule::table($tableName)->where($primaryKey, $record[$primaryKey])->update($record);
                        $imported++;
                    }
                } else {
                    echo "⚠️  Error importing record: " . $e->getMessage() . "\n";
                }
            }
        }
        
        echo "✅ Imported $imported records to $tableName\n";
        $totalImported += $imported;
        
    } catch (Exception $e) {
        echo "❌ Error importing table $tableName: " . $e->getMessage() . "\n";
    }
}

echo "\n💾 Data import completed!\n";
echo "📈 IMPORT SUMMARY:\n";
foreach ($importOrder as $tableName) {
    if (isset($data[$tableName]) && !empty($data[$tableName])) {
        $count = count($data[$tableName]);
        echo "  - $tableName: $count records\n";
    }
}
echo "  - TOTAL: $totalImported records imported\n";

echo "\n=== IMPORT COMPLETED ===\n";