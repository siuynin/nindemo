<?php
// Simple PHP tunnel script
$localPort = 8001;
$publicUrl = 'http://localhost:' . $localPort;

echo "Local Tunnel for Laravel Server\n";
echo "================================\n";
echo "Local Server: $publicUrl\n";
echo "Public URLs will be generated based on this\n";
echo "\nTo test with external access:\n";
echo "1. Make sure your Laravel server is running on port $localPort\n";
echo "2. Use your computer's IP address or ngrok/cloudflared\n";
echo "3. For local testing, use: $publicUrl\n";
echo "\nUpload directory will be: $publicUrl/uploads/runninghub-inputs/\n";

// Show current network interfaces
$host = gethostname();
$localIP = gethostbyname($host);
echo "\nYour local IP: $localIP\n";
echo "Try accessing: http://$localIP:$localPort/uploads/runninghub-inputs/\n";

// Keep script running
while (true) {
    sleep(1);
}