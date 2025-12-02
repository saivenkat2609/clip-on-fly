@echo off
REM Set Lambda Environment Variables for Firestore Integration
REM This script adds FIREBASE_PROJECT_ID and FIREBASE_WEB_API_KEY to opus-finalize Lambda

echo ========================================
echo Setting Lambda Environment Variables
echo ========================================
echo.

REM Check if AWS CLI is installed
aws --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: AWS CLI not found!
    echo.
    echo Please set environment variables manually in AWS Console:
    echo 1. Go to: https://console.aws.amazon.com/lambda/
    echo 2. Click on function: opus-finalize
    echo 3. Configuration tab - Environment variables
    echo 4. Click Edit
    echo 5. Add: FIREBASE_PROJECT_ID = reframeai-87b24
    echo 6. Add: FIREBASE_WEB_API_KEY = AIzaSyDT1Q_1EsL6nOwi5bKwewf7Xxm4OCeJggU
    echo 7. Click Save
    pause
    exit /b 1
)

echo AWS CLI found!
echo.

set FUNCTION_NAME=opus-finalize

echo Checking current configuration...
aws lambda get-function-configuration --function-name %FUNCTION_NAME% >nul 2>&1
if errorlevel 1 (
    echo ERROR: Function '%FUNCTION_NAME%' not found or no access!
    echo.
    echo Please check:
    echo - AWS credentials configured (run: aws configure)
    echo - Function name is correct
    echo - You have permission to access Lambda
    pause
    exit /b 1
)

echo.
echo Current environment variables:
echo ========================================
aws lambda get-function-configuration --function-name %FUNCTION_NAME% --query "Environment.Variables" --output table
echo.

REM Get current environment variables
echo Fetching current variables...
aws lambda get-function-configuration --function-name %FUNCTION_NAME% --query "Environment.Variables" --output json > current-env.json 2>nul

REM Check if BUCKET_NAME exists (to preserve it)
findstr "BUCKET_NAME" current-env.json >nul
if errorlevel 1 (
    set BUCKET_NAME=opus-clip-videos
    echo Warning: BUCKET_NAME not found, using default: opus-clip-videos
) else (
    for /f "tokens=2 delims=:" %%a in ('findstr "BUCKET_NAME" current-env.json') do set BUCKET_NAME=%%a
    set BUCKET_NAME=!BUCKET_NAME: "=!
    set BUCKET_NAME=!BUCKET_NAME:",=!
    set BUCKET_NAME=!BUCKET_NAME:"=!
    echo Found BUCKET_NAME: !BUCKET_NAME!
)

del current-env.json 2>nul

echo.
echo ========================================
echo Updating environment variables...
echo ========================================
echo.
echo This will add:
echo   FIREBASE_PROJECT_ID = reframeai-87b24
echo   FIREBASE_WEB_API_KEY = AIzaSyDT1Q_1EsL6nOwi5bKwewf7Xxm4OCeJggU
echo.
echo Press Ctrl+C to cancel, or
pause

REM Update Lambda environment variables
aws lambda update-function-configuration ^
  --function-name %FUNCTION_NAME% ^
  --environment "Variables={FIREBASE_PROJECT_ID=reframeai-87b24,FIREBASE_WEB_API_KEY=AIzaSyDT1Q_1EsL6nOwi5bKwewf7Xxm4OCeJggU,BUCKET_NAME=opus-clip-videos}"

if errorlevel 1 (
    echo.
    echo ERROR: Failed to update environment variables!
    echo.
    echo Please set them manually in AWS Console:
    echo 1. Go to: https://console.aws.amazon.com/lambda/
    echo 2. Click on: %FUNCTION_NAME%
    echo 3. Configuration - Environment variables - Edit
    echo 4. Add the Firebase variables
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! Environment Variables Set!
echo ========================================
echo.
echo Verifying update...
aws lambda get-function-configuration --function-name %FUNCTION_NAME% --query "Environment.Variables" --output table
echo.
echo ========================================
echo.
echo Next Steps:
echo 1. Upload a new video to test
echo 2. Check CloudWatch logs: /aws/lambda/opus-finalize
echo 3. Look for: [Firestore] Successfully updated video ...
echo 4. Dashboard should auto-update to "completed"!
echo.
echo To check logs:
echo   aws logs tail /aws/lambda/opus-finalize --follow
echo.
pause
