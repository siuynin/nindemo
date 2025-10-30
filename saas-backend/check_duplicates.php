<?php

// Kết nối database trực tiếp
$host = 'turntable.proxy.rlwy.net';
$username = 'postgres';
$password = 'trtePDCYzGmGzszGMhZEvsduVfkwkngT';
$database = 'railway';
$port = 26837;

$conn = new mysqli($host, $username, $password, $database, $port);

if ($conn->connect_error) {
    die("Kết nối thất bại: " . $conn->connect_error);
}

echo "Kiểm tra ID trùng lặp trong bảng pricing_plans...\n\n";

// Kiểm tra các ID bị trùng
$sql = "SELECT id, COUNT(*) as count FROM pricing_plans GROUP BY id HAVING COUNT(*) > 1 ORDER BY id";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    echo "⚠️  Các ID bị trùng lặp:\n";
    while($row = $result->fetch_assoc()) {
        echo "- ID {$row['id']}: xuất hiện {$row['count']} lần\n";
    }
} else {
    echo "✅ Không có ID nào bị trùng lặp.\n";
}

echo "\nDanh sách tất cả các pricing plans:\n";
$sql2 = "SELECT id, name, price, credits, credits_included FROM pricing_plans ORDER BY id";
$result2 = $conn->query($sql2);

if ($result2->num_rows > 0) {
    while($row = $result2->fetch_assoc()) {
        echo "- ID {$row['id']}: {$row['name']} - Price: {$row['price']} - Credits: {$row['credits']} - Credits Included: {$row['credits_included']}\n";
    }
} else {
    echo "Không có dữ liệu pricing plans.\n";
}

echo "\nTổng số pricing plans: " . $result2->num_rows . "\n";

// Kiểm tra ID lớn nhất
$sql3 = "SELECT MAX(id) as max_id FROM pricing_plans";
$result3 = $conn->query($sql3);
$maxId = $result3->fetch_assoc()['max_id'];
echo "ID lớn nhất: {$maxId}\n";

// Kiểm tra AUTO_INCREMENT
$sql4 = "SHOW TABLE STATUS LIKE 'pricing_plans'";
$result4 = $conn->query($sql4);
$autoIncrement = $result4->fetch_assoc()['Auto_increment'];
echo "Giá trị AUTO_INCREMENT tiếp theo: {$autoIncrement}\n";

$conn->close();