@echo off
REM Check Lambda Environment Variables Configuration
REM This script helps verify if Firestore environment variables are set

echo ========================================
echo Checking Lambda Function Configuration
echo ========================================
echo.

REM Check if AWS CLI is installed
aws --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: AWS CLI not found!
    echo Please install AWS CLI from: https://aws.amazon.com/cli/
    echo.
    echo Alternatively, check Lambda configuration manually:
    echo 1. Go to AWS Lambda Console
    echo 2. Select function: opus-finalize
    echo 3. Click Configuration tab
    echo 4. Click Environment variables
    echo 5. Verify FIREBASE_PROJECT_ID and FIREBASE_WEB_API_KEY are set
    pause
    exit /b 1
)

echo AWS CLI found! Checking Lambda functions...
echo.

REM Function to check
set FUNCTION_NAME=opus-finalize

echo Checking function: %FUNCTION_NAME%
echo ----------------------------------------

aws lambda get-function-configuration --function-name %FUNCTION_NAME% >nul 2>&1
if errorlevel 1 (
    echo ERROR: Function '%FUNCTION_NAME%' not found or no access!
    echo.
    echo Possible issues:
    echo - Function name is different (check AWS Console)
    echo - AWS credentials not configured
    echo - Insufficient permissions
    echo.
    echo To configure AWS CLI:
    echo   aws configure
    echo.
    pause
    exit /b 1
)

REM Get environment variables
echo Fetching environment variables...
aws lambda get-function-configuration --function-name %FUNCTION_NAME% --query "Environment.Variables" > lambda-env.json 2>nul

echo.
echo Current Environment Variables:
echo ----------------------------------------
type lambda-env.json
echo.
echo.

REM Parse JSON to check for Firebase variables
findstr "FIREBASE_PROJECT_ID" lambda-env.json >nul
if errorlevel 1 (
    echo [MISSING] FIREBASE_PROJECT_ID is NOT set!
    set MISSING_VAR=1
) else (
    echo [OK] FIREBASE_PROJECT_ID is set
)

findstr "FIREBASE_WEB_API_KEY" lambda-env.json >nul
if errorlevel 1 (
    echo [MISSING] FIREBASE_WEB_API_KEY is NOT set!
    set MISSING_VAR=1
) else (
    echo [OK] FIREBASE_WEB_API_KEY is set
)

del lambda-env.json 2>nul

echo.
echo ========================================

if defined MISSING_VAR (
    echo.
    echo ACTION REQUIRED:
    echo You need to set the missing environment variables!
    echo.
    echo To fix, run this command:
    echo.
    echo aws lambda update-function-configuration --function-name %FUNCTION_NAME% --environment "Variables={FIREBASE_PROJECT_ID=reframeai-87b24,FIREBASE_WEB_API_KEY=AIzaSyDT1Q_1EsL6nOwi5bKwewf7Xxm4OCeJggU,BUCKET_NAME=opus-clip-videos}"
    echo.
    echo Or set them manually in AWS Console:
    echo 1. Go to AWS Lambda Console
    echo 2. Select function: %FUNCTION_NAME%
    echo 3. Configuration tab - Environment variables
    echo 4. Add: FIREBASE_PROJECT_ID = reframeai-87b24
    echo 5. Add: FIREBASE_WEB_API_KEY = AIzaSyDT1Q_1EsL6nOwi5bKwewf7Xxm4OCeJggU
    echo.
) else (
    echo.
    echo SUCCESS: All required environment variables are set!
    echo.
    echo If real-time updates still don't work:
    echo 1. Check CloudWatch Logs for errors
    echo 2. Verify user_id is being passed correctly
    echo 3. Check Firestore security rules
    echo.
)

echo ========================================
pause
