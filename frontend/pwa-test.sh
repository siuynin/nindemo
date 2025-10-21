#!/bin/bash
# PWA Test Script for NDhubs AI

echo "🧪 PWA Testing Script for NDhubs AI"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-http://localhost:5176}"

echo "Testing URL: $BASE_URL"
echo ""

# Function to test HTTP status
test_status() {
    local url="$1"
    local description="$2"
    
    echo -n "Testing $description... "
    
    if command -v curl &> /dev/null; then
        status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
        
        if [ "$status" = "200" ]; then
            echo -e "${GREEN}✅ PASS (HTTP $status)${NC}"
            return 0
        else
            echo -e "${RED}❌ FAIL (HTTP $status)${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  curl not available, skipping${NC}"
        return 1
    fi
}

# Function to test content
test_content() {
    local url="$1"
    local description="$2"
    local expected_content="$3"
    
    echo -n "Testing $description... "
    
    if command -v curl &> /dev/null; then
        content=$(curl -s "$url")
        
        if echo "$content" | grep -q "$expected_content"; then
            echo -e "${GREEN}✅ PASS${NC}"
            return 0
        else
            echo -e "${RED}❌ FAIL - Content not found${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  curl not available, skipping${NC}"
        return 1
    fi
}

# Test basic connectivity
echo "1️⃣ Basic Connectivity Tests"
echo "-----------------------------"
test_status "$BASE_URL" "Homepage"
test_status "$BASE_URL/sw.js" "Service Worker"
test_status "$BASE_URL/manifest.json" "Web App Manifest"
test_status "$BASE_URL/simple-pwa-test.html" "PWA Test Page"
echo ""

# Test manifest content
echo "2️⃣ Manifest Content Tests"
echo "---------------------------"
if command -v curl &> /dev/null; then
    manifest_content=$(curl -s "$BASE_URL/manifest.json")
    
    echo -n "Checking manifest name... "
    if echo "$manifest_content" | grep -q '"name"'; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${RED}❌ FAIL${NC}"
    fi
    
    echo -n "Checking manifest short_name... "
    if echo "$manifest_content" | grep -q '"short_name"'; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${RED}❌ FAIL${NC}"
    fi
    
    echo -n "Checking manifest icons... "
    if echo "$manifest_content" | grep -q '"icons"'; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${RED}❌ FAIL${NC}"
    fi
fi
echo ""

# Test service worker content
echo "3️⃣ Service Worker Tests"
echo "-----------------------"
if command -v curl &> /dev/null; then
    sw_content=$(curl -s "$BASE_URL/sw.js")
    
    echo -n "Checking service worker registration... "
    if echo "$sw_content" | grep -q "self.addEventListener"; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${RED}❌ FAIL${NC}"
    fi
    
    echo -n "Checking cache implementation... "
    if echo "$sw_content" | grep -q "caches"; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${RED}❌ FAIL${NC}"
    fi
fi
echo ""

# Browser compatibility check
echo "4️⃣ Browser Compatibility"
echo "------------------------"
echo "PWA Requirements:"
echo "- HTTPS or localhost: $(echo "$BASE_URL" | grep -q 'https\|localhost\|127.0.0.1' && echo -e "${GREEN}✅ PASS${NC}" || echo -e "${RED}❌ FAIL${NC}")"
echo "- Service Worker: Manual check required"
echo "- Web App Manifest: Manual check required"
echo ""

# Security check
echo "5️⃣ Security Tests"
echo "-----------------"
if command -v curl &> /dev/null; then
    headers=$(curl -s -I "$BASE_URL" | head -10)
    
    echo -n "Content-Type header... "
    if echo "$headers" | grep -q "Content-Type.*text/html"; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${RED}❌ FAIL${NC}"
    fi
fi
echo ""

# Recommendations
echo "6️⃣ Recommendations"
echo "------------------"
if echo "$BASE_URL" | grep -q 'http://localhost\|http://127.0.0.1'; then
    echo -e "${YELLOW}⚠️  Development mode detected${NC}"
    echo "For production deployment:"
    echo "- Enable HTTPS"
    echo "- Use a proper domain name"
    echo "- Configure proper headers"
elif echo "$BASE_URL" | grep -q 'https'; then
    echo -e "${GREEN}✅ Production HTTPS detected${NC}"
else
    echo -e "${RED}❌ HTTP detected - PWA requires HTTPS${NC}"
fi

echo ""
echo "7️⃣ Manual Testing Checklist"
echo "----------------------------"
echo "□ Open in Chrome/Edge"
echo "□ Check Application tab in DevTools"
echo "□ Look for Install prompt"
echo "□ Test offline functionality"
echo "□ Test on mobile device"
echo "□ Verify app icons load correctly"
echo ""

echo "🎯 Test Summary"
echo "==============="
echo "Run this script with production URL:"
echo "./pwa-test.sh https://your-domain.com"
echo ""
echo "For detailed testing, visit:"
echo "$BASE_URL/simple-pwa-test.html"
echo ""
echo "✨ Happy testing!"