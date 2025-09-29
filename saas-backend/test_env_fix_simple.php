<?php
// Test script đơn giản để tạo file HTML test environment variables

try {
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
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
        button { padding: 10px 20px; margin: 10px 5px; border: none; border-radius: 5px; cursor: pointer; }
        .btn-primary { background-color: #007bff; color: white; }
        .btn-success { background-color: #28a745; color: white; }
    </style>
</head>
<body>
    <h1>Test Environment Variables Fix</h1>
    <p>Kiểm tra xem VITE_RUNWARE_API_KEY có được đọc đúng từ file .env sau khi sửa vite.config.ts</p>
    
    <button class="btn-primary" onclick="testEnvironmentVariables()">Test Environment Variables</button>
    <button class="btn-success" onclick="testImageGeneration()">Test Image Generation (Mock)</button>
    
    <div id="results"></div>
    
    <script type="module">
        const results = document.getElementById("results");
        
        function addResult(message, type = "info") {
            const div = document.createElement("div");
            div.className = `result ${type}`;
            div.innerHTML = message;
            results.appendChild(div);
        }
        
        function clearResults() {
            results.innerHTML = "";
        }
        
        window.testEnvironmentVariables = function() {
            clearResults();
            addResult("🔍 Đang kiểm tra environment variables...", "info");
            
            // Test đọc API key từ environment
            const runwareKey = import.meta.env.VITE_RUNWARE_API_KEY;
            const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
            const elevenlabsKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
            
            addResult(`<strong>VITE_RUNWARE_API_KEY:</strong> ${runwareKey ? "✅ Có giá trị" : "❌ Không có giá trị"}`, runwareKey ? "success" : "error");
            
            if (runwareKey) {
                addResult(`📏 Key length: ${runwareKey.length} characters`, "info");
                addResult(`👀 Key preview: ${runwareKey.substring(0, 8)}...${runwareKey.substring(runwareKey.length - 4)}`, "info");
                
                // Kiểm tra key có hợp lệ không (không phải placeholder)
                if (runwareKey === "your_runware_key_here" || runwareKey === "EI6DphzfDx1lkAOHlAEsNCg5iYItYV0U") {
                    addResult("⚠️ API key có vẻ là key demo/test", "warning");
                } else {
                    addResult("✅ API key có vẻ hợp lệ", "success");
                }
            }
            
            // Test các environment variables khác
            addResult(`<strong>VITE_GEMINI_API_KEY:</strong> ${geminiKey ? "✅ Có giá trị" : "❌ Không có giá trị"}`, geminiKey ? "success" : "error");
            addResult(`<strong>VITE_OPENAI_API_KEY:</strong> ${openaiKey ? "✅ Có giá trị" : "❌ Không có giá trị"}`, openaiKey ? "success" : "error");
            addResult(`<strong>VITE_ELEVENLABS_API_KEY:</strong> ${elevenlabsKey ? "✅ Có giá trị" : "❌ Không có giá trị"}`, elevenlabsKey ? "success" : "error");
            addResult(`<strong>VITE_API_BASE_URL:</strong> ${apiBaseUrl || "❌ Không có giá trị"}`, apiBaseUrl ? "success" : "error");
            
            // Hiển thị tất cả environment variables có prefix VITE_
            const allEnvVars = Object.keys(import.meta.env).filter(key => key.startsWith("VITE_"));
            addResult(`<strong>Tất cả VITE_ variables:</strong> ${allEnvVars.join(", ")}`, "info");
        };
        
        window.testImageGeneration = function() {
            clearResults();
            addResult("🎨 Đang test logic tạo ảnh...", "info");
            
            // Mô phỏng logic trong ImageCreator.tsx
            const apiKey = import.meta.env.VITE_RUNWARE_API_KEY;
            console.log("Runware API Key configured:", !!apiKey);
            
            if (!apiKey || apiKey === "your_runware_key_here") {
                addResult("❌ Lỗi: Runware API key is not configured. Please add VITE_RUNWARE_API_KEY to your .env.local file.", "error");
                return;
            }
            
            addResult("✅ API key validation passed!", "success");
            addResult("🚀 Sẵn sàng để tạo ảnh (đây chỉ là test mock)", "success");
            
            // Mock request object
            const mockRequest = {
                taskType: "imageInference",
                taskUUID: "test-uuid-" + Date.now(),
                positivePrompt: "A beautiful sunset over mountains",
                width: 512,
                height: 512,
                model: "runware:100@1",
                numberResults: 1
            };
            
            addResult(`📝 Mock request: <pre>${JSON.stringify(mockRequest, null, 2)}</pre>`, "info");
        };
        
        // Auto-run test khi trang load
        setTimeout(() => {
            testEnvironmentVariables();
        }, 500);
    </script>
</body>
</html>';
    
    file_put_contents('../frontend/test-env-fix.html', $htmlContent);
    echo "✅ File test HTML được tạo: ../frontend/test-env-fix.html\n";
    echo "🌐 Vui lòng mở http://localhost:5175/test-env-fix.html để kiểm tra\n";
    echo "📋 Hoặc restart dev server và kiểm tra lại ImageCreator\n";
    
} catch (Exception $e) {
    echo "❌ Lỗi: " . $e->getMessage() . "\n";
    exit(1);
}
?>