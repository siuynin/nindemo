<?php
require_once 'vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Database connection
$host = $_ENV['DB_HOST'] ?? 'localhost';
$dbname = $_ENV['DB_DATABASE'] ?? 'railway';
$username = $_ENV['DB_USERNAME'] ?? 'postgres';
$password = $_ENV['DB_PASSWORD'] ?? '';
$port = $_ENV['DB_PORT'] ?? '5432';

try {
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== Kiểm tra result_url trong bảng generates ===\n\n";
    
    // Lấy các bản ghi có result_url không null và type = 'image'
    $stmt = $pdo->prepare("
        SELECT id, type, result_url, created_at 
        FROM generates 
        WHERE result_url IS NOT NULL 
        AND type = 'image' 
        ORDER BY created_at DESC 
        LIMIT 10
    ");
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Tìm thấy " . count($results) . " bản ghi image có result_url:\n\n";
    
    foreach ($results as $row) {
        echo "ID: " . $row['id'] . "\n";
        echo "Type: " . $row['type'] . "\n";
        echo "Created: " . $row['created_at'] . "\n";
        echo "Result URL: " . $row['result_url'] . "\n";
        
        // Thử parse JSON để xem có seed không
        $resultData = json_decode($row['result_url'], true);
        if (json_last_error() === JSON_ERROR_NONE) {
            echo "JSON Parse: SUCCESS\n";
            if (is_array($resultData)) {
                if (isset($resultData[0])) {
                    // Mảng các object
                    echo "Format: Array of objects\n";
                    foreach ($resultData as $index => $item) {
                        echo "  Item $index:\n";
                        if (isset($item['seed'])) {
                            echo "    Seed: " . $item['seed'] . "\n";
                        }
                        if (isset($item['url'])) {
                            echo "    URL: " . substr($item['url'], 0, 50) . "...\n";
                        }
                    }
                } else {
                    // Object đơn lẻ
                    echo "Format: Single object\n";
                    if (isset($resultData['seed'])) {
                        echo "  Seed: " . $resultData['seed'] . "\n";
                    }
                    if (isset($resultData['url'])) {
                        echo "  URL: " . substr($resultData['url'], 0, 50) . "...\n";
                    }
                }
            }
        } else {
            echo "JSON Parse: FAILED - " . json_last_error_msg() . "\n";
            echo "Raw content (first 100 chars): " . substr($row['result_url'], 0, 100) . "\n";
        }
        
        echo "----------------------------------------\n\n";
    }
    
    // Kiểm tra thống kê
    echo "=== Thống kê result_url ===\n";
    
    $stmt = $pdo->prepare("
        SELECT 
            type,
            COUNT(*) as total,
            COUNT(result_url) as has_result_url,
            COUNT(CASE WHEN result_url IS NOT NULL AND result_url::text ~ '^\\{.*\\}$|^\\[.*\\]$' THEN 1 END) as valid_json
        FROM generates 
        GROUP BY type
    ");
    $stmt->execute();
    $stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($stats as $stat) {
        echo "Type: " . $stat['type'] . "\n";
        echo "  Total records: " . $stat['total'] . "\n";
        echo "  Has result_url: " . $stat['has_result_url'] . "\n";
        echo "  Valid JSON: " . $stat['valid_json'] . "\n\n";
    }
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>