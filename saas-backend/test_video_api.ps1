# Test Video Generation API with RunningHub
$baseUrl = "http://localhost:8001/api"
$token = "98|qBrI7Lq7Cg5xEXOluOOscP3GIXpFr8sfptpyzCNyb5c427b8"

# Test Text-to-Video
Write-Host "Testing Text-to-Video Generation..." -ForegroundColor Green

$textToVideoData = @{
    positivePrompt = "A beautiful sunset over the ocean with waves gently crashing on the shore"
    duration = 10
    model = "portrait"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/video/generate" -Method POST -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
        "Accept" = "application/json"
    } -Body $textToVideoData

    Write-Host "Text-to-Video Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 10 | Write-Host
} catch {
    Write-Host "Text-to-Video Error:" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Response: $errorBody"
    } else {
        Write-Host "No response body available"
    }
}

Write-Host "`n" + "="*50 + "`n"

# Test Image-to-Video (without actual image file for now)
Write-Host "Testing Image-to-Video Generation..." -ForegroundColor Green

$imageToVideoData = @{
    positivePrompt = "Transform this image into a dynamic video with smooth camera movement"
    duration = 15
    model = "landscape-hd"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/video/generate" -Method POST -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
        "Accept" = "application/json"
    } -Body $imageToVideoData

    Write-Host "Image-to-Video Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 10 | Write-Host
} catch {
    Write-Host "Image-to-Video Error:" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Response: $errorBody"
    } else {
        Write-Host "No response body available"
    }
}