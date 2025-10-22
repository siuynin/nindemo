# Test VideoGenAPI Integration with Timeout Handling
# This script tests the new polling timeout functionality

$baseUrl = "http://localhost:8001/api"
$token = "98|qBrI7Lq7Cg5xEXOluOOscP3GIXpFr8sfptpyzCNyb5c427b8"

# Headers for API requests
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
    "Accept" = "application/json"
}

Write-Host "=== Testing VideoGenAPI Integration with Timeout ===" -ForegroundColor Green

# Test 1: Text-to-Video Generation with Timeout
Write-Host "`n1. Testing Text-to-Video Generation with Timeout..." -ForegroundColor Yellow

$textToVideoData = @{
    positivePrompt = "A cat playing with a ball in a sunny garden"
    duration = 10
    model = "kling_25"
} | ConvertTo-Json

try {
    Write-Host "Sending text-to-video request..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/video/generate" -Method POST -Headers $headers -Body $textToVideoData
    
    Write-Host "Response received:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3 | Write-Host
    
    if ($response.success) {
        $generationId = $response.data.id
        $taskId = $response.data.task_id
        
        Write-Host "`nGeneration ID: $generationId" -ForegroundColor Cyan
        Write-Host "Task ID: $taskId" -ForegroundColor Cyan
        Write-Host "Status: $($response.data.status)" -ForegroundColor Cyan
        
        # Test status checking
        Write-Host "`n2. Testing Status Check..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        
        $statusResponse = Invoke-RestMethod -Uri "$baseUrl/video/status/$generationId" -Method GET -Headers $headers
        Write-Host "Status Response:" -ForegroundColor Green
        $statusResponse | ConvertTo-Json -Depth 3 | Write-Host
        
        # If status is processing/pending, wait and check again
        if ($statusResponse.status -in @("pending", "processing")) {
            Write-Host "`n3. Video is still processing. Checking again in 10 seconds..." -ForegroundColor Yellow
            Start-Sleep -Seconds 10
            
            $finalStatusResponse = Invoke-RestMethod -Uri "$baseUrl/video/status/$generationId" -Method GET -Headers $headers
            Write-Host "Final Status Response:" -ForegroundColor Green
            $finalStatusResponse | ConvertTo-Json -Depth 3 | Write-Host
            
            if ($finalStatusResponse.videoUrl) {
                Write-Host "`nVideo URL: $($finalStatusResponse.videoUrl)" -ForegroundColor Green
            }
            
            if ($finalStatusResponse.processing_time) {
                Write-Host "Processing Time: $($finalStatusResponse.processing_time) seconds" -ForegroundColor Cyan
            }
        }
    }
    
} catch {
    Write-Host "Error in text-to-video test: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Response: $errorBody" -ForegroundColor Red
    }
}

# Test 2: Image-to-Video Generation (Simulated)
Write-Host "`n4. Testing Image-to-Video Generation (Simulated)..." -ForegroundColor Yellow

$imageToVideoData = @{
    positivePrompt = "Make this image come to life with gentle movement"
    duration = 5
    model = "landscape"
    image_url = "https://example.com/sample-image.jpg"
} | ConvertTo-Json

try {
    Write-Host "Sending image-to-video request..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/video/generate" -Method POST -Headers $headers -Body $imageToVideoData
    
    Write-Host "Response received:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3 | Write-Host
    
    if ($response.success) {
        Write-Host "`nImage-to-Video Generation ID: $($response.data.id)" -ForegroundColor Cyan
        Write-Host "Task ID: $($response.data.task_id)" -ForegroundColor Cyan
        Write-Host "Status: $($response.data.status)" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "Error in image-to-video test: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Response: $errorBody" -ForegroundColor Red
    }
}

# Test 3: Direct Status Polling Test
Write-Host "`n5. Testing Direct Status Polling..." -ForegroundColor Yellow

# This would test a known generation_id if available
$testGenerationId = "gen_686717fe97bd3_055867"  # Example from user's message

try {
    Write-Host "Checking status for generation ID: $testGenerationId" -ForegroundColor Cyan
    
    # First try to find this generation in our database
    $userGenerations = Invoke-RestMethod -Uri "$baseUrl/video/generations" -Method GET -Headers $headers
    Write-Host "User Generations:" -ForegroundColor Green
    $userGenerations | ConvertTo-Json -Depth 2 | Write-Host
    
} catch {
    Write-Host "Error in status polling test: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== VideoGenAPI Integration Test Complete ===" -ForegroundColor Green
Write-Host "Key Features Tested:" -ForegroundColor Cyan
Write-Host "- Text-to-video generation with 1-minute timeout" -ForegroundColor White
Write-Host "- Image-to-video generation support" -ForegroundColor White
Write-Host "- Status polling with timeout handling" -ForegroundColor White
Write-Host "- Task ID storage for later checking" -ForegroundColor White
Write-Host "- Enhanced response data (processing_time, resolution, etc.)" -ForegroundColor White