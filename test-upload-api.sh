#!/bin/bash

# Test script for upload API endpoints
# Run this after configuring API Gateway

API_ENDPOINT="https://g78mc4ok92.execute-api.us-east-1.amazonaws.com/prod"

echo "Testing Upload API Endpoints..."
echo "================================"
echo ""

# Test 1: OPTIONS request (CORS preflight)
echo "Test 1: CORS Preflight (OPTIONS)"
echo "URL: $API_ENDPOINT/upload/generate-url"
curl -X OPTIONS "$API_ENDPOINT/upload/generate-url" \
  -H "Origin: http://localhost:8080" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v 2>&1 | grep -i "access-control"
echo ""
echo "Expected: Should see Access-Control-Allow-Origin header"
echo ""
echo "---"
echo ""

# Test 2: Generate Upload URL
echo "Test 2: Generate Upload URL (POST)"
echo "URL: $API_ENDPOINT/upload/generate-url"
curl -X POST "$API_ENDPOINT/upload/generate-url" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8080" \
  -d '{
    "user_id": "test-user",
    "user_email": "test@example.com",
    "fileName": "test-video.mp4",
    "fileSize": 10000000,
    "contentType": "video/mp4",
    "videoTitle": "Test Video",
    "videoDescription": "Test Description"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.'
echo ""
echo "Expected: HTTP 200 with session_id and uploadUrl"
echo ""
echo "---"
echo ""

# Test 3: Test with invalid data (should return 400)
echo "Test 3: Invalid Request (missing required fields)"
echo "URL: $API_ENDPOINT/upload/generate-url"
curl -X POST "$API_ENDPOINT/upload/generate-url" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.'
echo ""
echo "Expected: HTTP 400 with error message"
echo ""
echo "================================"
echo "Testing complete!"
