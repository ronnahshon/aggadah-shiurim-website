# AWS Credential Setup Guide

## Quick Start

When you first open the HTML uploader or Android app, you'll be prompted for AWS credentials.

### Credential Format

Enter credentials in this format:
```
<AccessKeyID>+<SecretKey>
```

Example:
```
MY_AWS_KEY+MY_AWS_SECRET
```

Just copy and paste the entire string with the `+` in the middle.

---

## How to Get Credentials

### Option A: Contact Ron or Zach
The easiest way is to ask Ron or Zach for the credentials. They'll give you a string in the format above that you can copy and paste.

### Option B: Get from AWS Console

1. **Log into AWS Console**
   - Go to: https://us-east-1.console.aws.amazon.com/secretsmanager/secret?name=CarmeiZionUploader&region=us-east-1

2. **Retrieve the Secret**
   - Click the "Retrieve secret value" button
   - You'll see two values:
     - `access_key_id` (starts with AKIA...)
     - `secret_access_key` (long random string)

3. **Format the Credentials**
   - Copy the `access_key_id` value
   - Add a `+` sign
   - Copy the `secret_access_key` value
   - Final format: `<access_key_id>+<secret_access_key>`

4. **Paste into the App**
   - Paste the entire string when prompted

---

## HTML Uploader

### Prerequisites
The S3 bucket must have CORS configured to allow browser uploads. See `S3_CORS_SETUP.md` for instructions.

### First Time Setup
1. Open `shiurim-upload.html` in your browser
2. A prompt will appear asking for credentials
3. Paste your credentials in the format: `<AccessKeyID>+<SecretKey>`
4. Click OK
5. The system will test the credentials (takes a few seconds)
6. If valid, you're ready to upload!

### Credentials are Remembered
- Your credentials are stored securely in browser cookies
- They'll last for 30 days
- You won't need to enter them again unless you clear cookies or 30 days pass

### Reset Credentials
- Click the "🔄 Reset Credentials" button in the header
- This clears stored credentials and prompts you to enter new ones

---

## Android App

### First Time Setup
1. Launch the app
2. A dialog will appear asking for credentials
3. Paste your credentials in the format: `<AccessKeyID>+<SecretKey>`
4. Tap "Validate & Save Credentials"
5. The system will test the credentials (takes a few seconds)
6. If valid, the dialog closes and you're ready to upload!

### Credentials are Remembered
- Your credentials are stored securely using Android's encrypted storage
- They're stored permanently until you reset them
- You won't need to enter them again

### Reset Credentials
- Scroll to the bottom of the main screen
- Tap the "🔄 Reset AWS Credentials" button
- This clears stored credentials and shows the dialog again

---

## Troubleshooting

### CORS Error (HTML Only)
If you see an error about "CORS policy" or "Access-Control-Allow-Origin":
- The S3 bucket needs CORS configuration
- See `S3_CORS_SETUP.md` for detailed instructions
- Contact Ron or Zach to configure CORS on the bucket

### "Invalid credentials" Error
- **Check the format**: Make sure you have `<AccessKeyID>+<SecretKey>` with a `+` in the middle
- **No spaces**: Remove any extra spaces before or after the credentials
- **Complete string**: Make sure you copied both the Access Key ID and Secret Access Key
- **Try again**: Get fresh credentials from Ron/Zach or AWS Console

### "Upload failed" Error
- Your credentials might have expired or been revoked
- Reset credentials and enter new ones
- Contact Ron or Zach if the problem persists

### Credentials Not Saving (HTML)
- Make sure cookies are enabled in your browser
- Some browsers in private/incognito mode won't save cookies
- Try using a regular browser window

### Credentials Not Saving (Android)
- Make sure the app has storage permissions
- Try clearing the app's cache and data, then re-enter credentials
- Reinstall the app if the problem persists

---

## Security Notes

- **Never share your credentials** with anyone except Ron or Zach
- **Don't post credentials** in emails, chat messages, or public places
- **Reset if compromised**: If you think your credentials were exposed, reset them immediately
- Credentials are stored securely:
  - HTML: Secure browser cookies
  - Android: Encrypted storage with AES256-GCM

---

## Need Help?

Contact Ron or Zach if you:
- Can't get credentials to work
- Need new credentials
- Have security concerns
- Experience any other issues
