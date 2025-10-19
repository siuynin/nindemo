$headers = @{
    "Authorization" = "Bearer 67|44HQVPacQeODLAY2qeLdpwuPDiMvYWUPthD0LHOR3bcb7cf3"
    "Content-Type" = "application/json"
    "Accept" = "application/json"
}

$body = @{
    prompt = "A beautiful sunset over mountains"
    model = "nano-banana"
    width = 864
    height = 1152
    num_images = 1
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8001/api/images/create-image" -Method POST -Headers $headers -Body $body
    Write-Host "Status Code: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}