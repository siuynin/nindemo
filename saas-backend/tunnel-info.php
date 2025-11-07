<?php
/**
 * Local Tunnel Information for Testing
 */

$localPort = 8001;
$localIP = '192.168.0.101';

// Base URLs
$baseLocal = "http://localhost:$localPort";
$baseNetwork = "http://$localIP:$localPort";

// Upload directory URLs
$uploadPath = '/uploads/runninghub-inputs/';
$uploadLocal = $baseLocal . $uploadPath;
$uploadNetwork = $baseNetwork . $uploadPath;

// Upload directory path
$uploadDir = __DIR__ . '/public/uploads/runninghub-inputs/';

echo "🚀 LOCAL TUNNEL INFORMATION\n";
echo "===========================\n\n";

echo "📍 LOCAL ACCESS:\n";
echo "   Localhost: $baseLocal\n";
echo "   Uploads:   $uploadLocal\n\n";

echo "🌐 NETWORK ACCESS (Same WiFi/LAN):\n";
echo "   Network IP: $baseNetwork\n";
echo "   Uploads:    $uploadNetwork\n\n";

echo "🔗 API ENDPOINTS:\n";
echo "   Local API:     $baseLocal/api\n";
echo "   Network API:   $baseNetwork/api\n\n";

echo "📁 UPLOAD DIRECTORY:\n";
echo "   Local Path:    $uploadDir\n";
echo "   Web Path:      $uploadPath\n\n";

echo "🧪 TEST URLS:\n";
echo "   Health Check:  $baseLocal/health\n";
echo "   API Routes:    $baseLocal/api/routes\n";
echo "   Test Upload:   $baseLocal/test-upload.html\n\n";

echo "📋 EXAMPLE USAGE:\n";
echo "   - For local testing: Use localhost URLs\n";
echo "   - For ComfyUI: Use network URLs (192.168.0.101)\n";
echo "   - Upload images will be saved to: uploads/runninghub-inputs/\n";
echo "   - Public URLs will be: http://192.168.0.101:8001/uploads/runninghub-inputs/filename.jpg\n\n";

echo "🔧 CURRENT SERVER STATUS:\n";
echo "   Port: $localPort (LISTENING)\n";
echo "   IP: $localIP\n";
echo "   Upload dir exists: " . (is_dir($uploadDir) ? '✅ YES' : '❌ NO') . "\n\n";

echo "💡 TIPS:\n";
echo "   - Make sure your firewall allows port $localPort\n";
echo "   - For external access, use ngrok: ngrok http $localPort\n";
echo "   - ComfyUI should use: http://$localIP:$localPort/uploads/runninghub-inputs/\n";
echo "   - All uploaded images will have public URLs accessible from anywhere\n";

// Create test upload directory if not exists
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
    echo "✅ Created upload directory: $uploadDir\n";
}

echo "\n🎯 QUICK START:\n";
echo "1. Server is running on: http://localhost:$localPort\n";
echo "2. ComfyUI can access images at: http://$localIP:$localPort/uploads/runninghub-inputs/\n";
echo "3. Test with: http://$localIP:$localPort/uploads/runninghub-inputs/[filename]\n";