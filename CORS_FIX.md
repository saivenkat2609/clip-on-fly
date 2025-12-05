# Fixing CORS Error for Cloudflare R2 Uploads

## Problem
You're getting a CORS error when trying to upload files directly to Cloudflare R2 from the browser:
```
Access to fetch at 'https://...r2.cloudflarestorage.com/...' from origin 'https://reframe-ai.netlify.app' has been blocked by CORS policy
```

## Root Cause
The Cloudflare R2 bucket is not configured to allow cross-origin requests from your frontend application.

## Solution: Configure CORS on Cloudflare R2

### Step 1: Access Cloudflare R2 Dashboard
1. Log in to your Cloudflare dashboard
2. Navigate to **R2** in the sidebar
3. Select your bucket (`opus-clip-videos`)

### Step 2: Configure CORS Rules
1. Go to the **Settings** tab for your bucket
2. Scroll down to **CORS Policy**
3. Click **Edit CORS Policy**

### Step 3: Add CORS Configuration
Add the following CORS policy:

```json
[
  {
    "AllowedOrigins": [
      "https://reframe-ai.netlify.app",
      "http://localhost:5173",
      "http://localhost:3000"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

**Important Notes:**
- Replace `https://reframe-ai.netlify.app` with your actual production domain
- Keep `http://localhost:5173` and `http://localhost:3000` for local development
- If you have multiple domains (staging, production), add them all to `AllowedOrigins`

### Step 4: Alternative - Use Wildcard (Less Secure)
If you want to allow all origins (not recommended for production):

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

### Step 5: Save and Test
1. Save the CORS configuration
2. Wait 1-2 minutes for the changes to propagate
3. Try uploading a file again from your application
4. Check the browser console for detailed debugging logs

## Verification Steps

After configuring CORS, you should see these logs in the console without errors:

```
[Upload] Starting upload...
[Upload] Got pre-signed URL
[Upload] Upload URL domain: f1ff3bcad7fd44abcea85af75a286b01.r2.cloudflarestorage.com
[Upload] Current origin: https://reframe-ai.netlify.app
[Upload] Starting PUT request to storage...
[Upload] Storage response status: 200
[Upload] File uploaded to storage successfully
```

## Troubleshooting

### Still Getting CORS Error?
1. **Clear browser cache** and try again
2. **Check the origin** in console logs matches what you configured
3. **Wait a few minutes** - CORS changes can take time to propagate
4. **Verify the bucket name** is correct in your Lambda function

### Getting 403 Forbidden?
This could be:
1. **CORS preflight failing** - Double-check your CORS configuration
2. **Pre-signed URL expired** - Default is 1 hour, check if you're testing with an old URL
3. **Incorrect AWS credentials** - Verify your R2 access keys in Lambda environment variables

### Additional Debugging
The enhanced code now logs:
- File details (name, size, type)
- Pre-signed URL details (session ID, S3 key, domain)
- Current browser origin
- Full error details for storage upload failures
- Response headers from R2

Check these logs to identify exactly where the issue occurs.

## Security Considerations

1. **Don't use wildcard origins** (`*`) in production
2. **List only trusted domains** in AllowedOrigins
3. **Keep AllowedHeaders restrictive** if possible
4. **Monitor R2 access logs** for unauthorized access attempts

## References
- [Cloudflare R2 CORS Documentation](https://developers.cloudflare.com/r2/buckets/cors/)
- [AWS S3 CORS Configuration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html) (R2 is S3-compatible)
