<?php
// Test script để kiểm tra việc sửa lỗi environment variables
require_once 'config/database.php';

try {
    // Tìm người dùng có vai trò 'user'
    $stmt = $pdo->prepare("SELECT id, email FROM users WHERE role = 'user' LIMIT 1");
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo "Không tìm thấy người dùng có vai trò 'user'\n";
        exit(1);
    }
    
    echo "Tìm thấy người dùng: {$user['email']} (ID: {$user['id']})\n";
    
    // Tạo token cho người dùng
    $plainTextToken = bin2hex(random_bytes(32));
    $hashedToken = hash('sha256', $plainTextToken);
    
    $stmt = $pdo->prepare("INSERT INTO personal_access_tokens (tokenable_type, tokenable_id, name, token, abilities, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())");
    $stmt->execute(['App\\Models\\User', $user['id'], 'test-token', $hashedToken, '["*"]']);
    
    echo "Token được tạo: $plainTextToken\n";
    
    // Tạo file HTML test để kiểm tra việc đọc API key
    $htmlContent = '<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Environment Variables</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .result { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .success { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .error { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .info { background-color: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
    </style>
</head>
<body>
    <h1>Test Environment Variables</h1>
    <div id="results"></div>
    
    <script type="module">
        const results = document.getElementById("results");
        
        function addResult(message, type = "info") {
            const div = document.createElement("div");
            div.className = `result ${type}`;
            div.textContent = message;
            results.appendChild(div);
        }
        
        // Test đọc API key từ environment
        const runwareKey = import.meta.env.VITE_RUNWARE_API_KEY;
        
        addResult(`VITE_RUNWARE_API_KEY: ${runwareKey ? "✓ Có giá trị" : "✗ Không có giá trị"}`, runwareKey ? "success" : "error");
        
        if (runwareKey) {
            addResult(`Key length: ${runwareKey.length} characters`, "info");
            addResult(`Key preview: ${runwareKey.substring(0, 8)}...`, "info");
        }
        
        // Test các environment variables khác
        const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        
        addResult(`VITE_GEMINI_API_KEY: ${geminiKey ? "✓ Có giá trị" : "✗ Không có giá trị"}`, geminiKey ? "success" : "error");
        addResult(`VITE_OPENAI_API_KEY: ${openaiKey ? "✓ Có giá trị" : "✗ Không có giá trị"}`, openaiKey ? "success" : "error");
        addResult(`VITE_API_BASE_URL: ${apiBaseUrl || "Không có giá trị"}`, apiBaseUrl ? "success" : "error");
        
        // Test gọi API credit để đảm bảo backend vẫn hoạt động
        const token = "' . $plainTextToken . '";
        
        fetch("/api/user/credits", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        })
        .then(response => {
            addResult(`API /user/credits status: ${response.status}`, response.ok ? "success" : "error");
            return response.json();
        })
        .then(data => {
            if (data.success) {
                addResult(`Total credits: ${data.data.total_remaining}`, "success");
            } else {
                addResult(`API error: ${data.message}`, "error");
            }
        })
        .catch(error => {
            addResult(`Network error: ${error.message}`, "error");
        });
    </script>
</body>
</html>';
    
    file_put_contents('../frontend/test-env-fix.html', $htmlContent);
    echo "File test HTML được tạo: ../frontend/test-env-fix.html\n";
    
    // Dọn dẹp token
    $stmt = $pdo->prepare("DELETE FROM personal_access_tokens WHERE token = ?");
    $stmt->execute([$hashedToken]);
    
    echo "✓ Test script hoàn thành. Vui lòng mở http://localhost:5175/test-env-fix.html để kiểm tra\n";
    
} catch (Exception $e) {
    echo "Lỗi: " . $e->getMessage() . "\n";
    exit(1);
}
?>