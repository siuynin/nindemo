# PWA Test Script for NDhubs AI (PowerShell Version)

param(
    [string]$BaseUrl = "http://localhost:5176"
)

Write-Host "🧪 PWA Testing Script for NDhubs AI" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

Write-Host "Testing URL: $BaseUrl" -ForegroundColor Yellow
Write-Host ""

# Function to test HTTP status
function Test-Status {
    param(
        [string]$Url,
        [string]$Description
    )
    
    Write-Host "Testing $Description... " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ PASS (HTTP $($response.StatusCode))" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ FAIL (HTTP $($response.StatusCode))" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ FAIL (Error: $($_.Exception.Message))" -ForegroundColor Red
        return $false
    }
}

# Function to test content
function Test-Content {
    param(
        [string]$Url,
        [string]$Description,
        [string]$ExpectedContent
    )
    
    Write-Host "Testing $Description... " -NoNewline
    
    try {
        $content = Invoke-WebRequest -Uri $Url -UseBasicParsing -ErrorAction Stop
        
        if ($content.Content -match $ExpectedContent) {
            Write-Host "✅ PASS" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ FAIL - Content not found" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Test basic connectivity
Write-Host "1️⃣ Basic Connectivity Tests" -ForegroundColor Cyan
Write-Host "-----------------------------" -ForegroundColor Cyan
$results = @{
    homepage = Test-Status "$BaseUrl" "Homepage"
    serviceWorker = Test-Status "$BaseUrl/sw.js" "Service Worker"
    manifest = Test-Status "$BaseUrl/manifest.json" "Web App Manifest"
    testPage = Test-Status "$BaseUrl/simple-pwa-test.html" "PWA Test Page"
}
Write-Host ""

# Test manifest content
Write-Host "2️⃣ Manifest Content Tests" -ForegroundColor Cyan
Write-Host "---------------------------" -ForegroundColor Cyan
try {
    $manifestContent = (Invoke-WebRequest -Uri "$BaseUrl/manifest.json" -UseBasicParsing).Content
    
    Write-Host "Checking manifest name... " -NoNewline
    if ($manifestContent -match '"name"') {
        Write-Host "✅ PASS" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red
    }
    
    Write-Host "Checking manifest short_name... " -NoNewline
    if ($manifestContent -match '"short_name"') {
        Write-Host "✅ PASS" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red
    }
    
    Write-Host "Checking manifest icons... " -NoNewline
    if ($manifestContent -match '"icons"') {
        Write-Host "✅ PASS" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Error reading manifest: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test service worker content
Write-Host "3️⃣ Service Worker Tests" -ForegroundColor Cyan
Write-Host "-----------------------" -ForegroundColor Cyan
try {
    $swContent = (Invoke-WebRequest -Uri "$BaseUrl/sw.js" -UseBasicParsing).Content
    
    Write-Host "Checking service worker registration... " -NoNewline
    if ($swContent -match "self\.addEventListener") {
        Write-Host "✅ PASS" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red
    }
    
    Write-Host "Checking cache implementation... " -NoNewline
    if ($swContent -match "caches") {
        Write-Host "✅ PASS" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Error reading service worker: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Security check
Write-Host "4️⃣ Security Tests" -ForegroundColor Cyan
Write-Host "-----------------" -ForegroundColor Cyan
if ($BaseUrl -match 'https://|localhost|127\.0\.0\.1') {
    Write-Host "✅ HTTPS/Localhost detected" -ForegroundColor Green
} else {
    Write-Host "⚠️  HTTP detected - PWA requires HTTPS for production" -ForegroundColor Yellow
}
Write-Host ""

# Recommendations
Write-Host "5️⃣ Recommendations" -ForegroundColor Cyan
Write-Host "------------------" -ForegroundColor Cyan
if ($BaseUrl -match 'http://localhost|http://127\.0\.0\.1') {
    Write-Host "⚠️  Development mode detected" -ForegroundColor Yellow
    Write-Host "For production deployment:" -ForegroundColor Yellow
    Write-Host "- Enable HTTPS" -ForegroundColor Yellow
    Write-Host "- Use a proper domain name" -ForegroundColor Yellow
    Write-Host "- Configure proper headers" -ForegroundColor Yellow
} elseif ($BaseUrl -match 'https') {
    Write-Host "✅ Production HTTPS detected" -ForegroundColor Green
} else {
    Write-Host "❌ HTTP detected - PWA requires HTTPS" -ForegroundColor Red
}
Write-Host ""

# Manual testing checklist
Write-Host "6️⃣ Manual Testing Checklist" -ForegroundColor Cyan
Write-Host "----------------------------" -ForegroundColor Cyan
Write-Host "□ Open in Chrome/Edge" -ForegroundColor White
Write-Host "□ Check Application tab in DevTools" -ForegroundColor White
Write-Host "□ Look for Install prompt" -ForegroundColor White
Write-Host "□ Test offline functionality" -ForegroundColor White
Write-Host "□ Test on mobile device" -ForegroundColor White
Write-Host "□ Verify app icons load correctly" -ForegroundColor White
Write-Host ""

# Summary
Write-Host "🎯 Test Summary" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host "Run this script with production URL:" -ForegroundColor Yellow
Write-Host ".\pwa-test.ps1 https://your-domain.com" -ForegroundColor White
Write-Host ""
Write-Host "For detailed testing, visit:" -ForegroundColor Yellow
Write-Host "$BaseUrl/simple-pwa-test.html" -ForegroundColor White
Write-Host ""
Write-Host "✨ Happy testing!" -ForegroundColor Cyan