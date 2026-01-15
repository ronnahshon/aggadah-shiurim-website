# S3 CORS Configuration for HTML Uploader

## Problem
The HTML uploader is being blocked by CORS policy when trying to upload to S3. This happens because browsers enforce CORS security when making requests from web pages.

## Solution
You need to configure CORS on your S3 bucket to allow uploads from the browser.

---

## Steps to Configure CORS

### 1. Log into AWS Console
Go to: https://s3.console.aws.amazon.com/s3/buckets/midrash-aggadah?region=eu-north-1&tab=permissions

### 2. Navigate to CORS Configuration
- Click on the **"midrash-aggadah"** bucket
- Click on the **"Permissions"** tab
- Scroll down to **"Cross-origin resource sharing (CORS)"**
- Click **"Edit"**

### 3. Add CORS Configuration
Paste the following JSON configuration:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-server-side-encryption",
            "x-amz-request-id",
            "x-amz-id-2"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

### 4. Save Changes
Click **"Save changes"**

---

## Security Considerations

### Will This Break Anything?
**No, this CORS configuration will NOT break existing functionality.** Here's why:

1. **CORS only affects browser requests** - It doesn't impact:
   - The Android app (not subject to CORS)
   - AWS CLI operations
   - Server-to-server requests
   - Direct S3 API calls from backend services
   - Existing files or downloads

2. **CORS is additive** - It only adds permissions for browser-based uploads. It doesn't remove or restrict any existing access.

3. **Bucket permissions unchanged** - CORS doesn't modify:
   - IAM policies
   - Bucket policies
   - Access Control Lists (ACLs)
   - Encryption settings
   - Versioning or lifecycle rules

### What CORS Actually Does
CORS tells browsers: "It's okay to allow JavaScript from web pages to upload to this bucket."

Without CORS, browsers block these requests for security. With CORS, browsers allow them.

### Potential Security Concerns

#### Using `"AllowedOrigins": ["*"]`

**Risk Level: Low to Medium** (depending on your use case)

**What it allows:**
- Anyone with valid AWS credentials can upload from ANY website or local HTML file
- This is convenient but less secure

**What it does NOT allow:**
- Uploading without valid AWS credentials (credentials are still required!)
- Anonymous uploads (authentication is still enforced)
- Accessing files you don't have permission to access
- Modifying bucket settings or policies

**Real-world impact:**
- If someone steals your AWS credentials, they could use them from any website
- But if they have your credentials, they can already upload via CLI, SDK, or API anyway
- CORS doesn't make credential theft more dangerous - it just adds browser convenience

#### More Secure Alternative

If you want to be more restrictive, you can limit origins to specific domains:

```json
"AllowedOrigins": [
    "https://yourdomain.com",
    "https://www.yourdomain.com"
]
```

**However**, this won't work for:
- Opening HTML files directly from filesystem (file://)
- Local development servers (unless you add http://localhost:8000)

### Recommended Approach

**For your use case (internal tool for Ron/Zach):**

Using `"*"` is **perfectly fine** because:
1. ✅ Only authorized users have the AWS credentials
2. ✅ Credentials are stored securely (encrypted on Android, secure cookies on HTML)
3. ✅ This is an internal tool, not a public service
4. ✅ The bucket likely already has proper IAM policies restricting who can upload
5. ✅ CORS just makes the HTML uploader work - it doesn't bypass authentication

**For a public-facing application:**
You'd want to use specific origins and possibly implement a backend proxy instead of direct S3 uploads from browsers.

---

## What This Configuration Does

- **AllowedHeaders**: `["*"]` - Allows all headers in requests
- **AllowedMethods**: Allows GET, PUT, POST, DELETE, and HEAD operations
- **AllowedOrigins**: `["*"]` - Allows requests from any origin (including file:// protocol)
- **ExposeHeaders**: Exposes specific AWS headers needed for uploads
- **MaxAgeSeconds**: Caches CORS preflight requests for 3000 seconds (50 minutes)

---

## Security Note

The configuration above uses `"*"` for AllowedOrigins, which allows uploads from any origin (including file:// protocol).

**Is this safe?**
- ✅ **Yes, for your use case** - This is an internal tool with controlled access
- ✅ **Authentication still required** - Users still need valid AWS credentials to upload
- ✅ **Doesn't bypass security** - CORS only affects browser behavior, not AWS permissions
- ✅ **Won't break anything** - CORS is additive and only affects browser requests

**What CORS does:**
- Tells browsers: "Allow JavaScript to upload to this bucket"
- Does NOT remove authentication requirements
- Does NOT affect non-browser access (Android app, CLI, etc.)

### For Production (More Secure)
If you want to restrict access to specific domains, replace the AllowedOrigins with specific URLs:

```json
"AllowedOrigins": [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
    "file://"
]
```

However, note that `"file://"` doesn't work in CORS - browsers send `null` as the origin for local files. So if you need to use the HTML file locally, you must use `"*"`.

---

## Alternative: Use a Local Web Server

If you don't want to use `"*"` for AllowedOrigins, you can serve the HTML file through a local web server instead of opening it directly:

### Option 1: Python Simple Server
```bash
# In the directory with shiurim-upload.html
python3 -m http.server 8000
```
Then open: http://localhost:8000/shiurim-upload.html

### Option 2: Node.js http-server
```bash
# Install globally
npm install -g http-server

# Run in the directory with shiurim-upload.html
http-server -p 8000
```
Then open: http://localhost:8000/shiurim-upload.html

### Option 3: PHP Built-in Server
```bash
# In the directory with shiurim-upload.html
php -S localhost:8000
```
Then open: http://localhost:8000/shiurim-upload.html

With a local server, you can then configure CORS to allow:
```json
"AllowedOrigins": [
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]
```

---

## Testing After Configuration

1. Configure CORS as described above
2. Wait a few seconds for changes to propagate
3. Refresh the HTML uploader page
4. Try entering credentials again
5. The test upload should now succeed

---

## Troubleshooting

### Still Getting CORS Error?
- Make sure you saved the CORS configuration
- Try clearing your browser cache (Ctrl+Shift+Delete)
- Wait a minute and try again (AWS changes can take time to propagate)
- Check that you're editing the correct bucket (midrash-aggadah)

### CORS Works But Uploads Fail?
- Check that your AWS credentials have permission to upload to the bucket
- Verify the bucket name is correct: `midrash-aggadah`
- Check the AWS region is correct: `eu-north-1`

### Need Help?
Contact Ron or Zach if you continue to have issues with CORS configuration.
