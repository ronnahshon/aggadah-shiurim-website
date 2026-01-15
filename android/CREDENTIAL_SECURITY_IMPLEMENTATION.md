# AWS Credential Security Implementation

## Overview
This document describes the implementation of secure AWS credential management for both the HTML web uploader and Android app.

## Changes Made

### 1. Removed Hardcoded Credentials
- **HTML**: Replaced AWS credentials in `shiurim-upload.html` with `REPLACE_ME`
- **Android**: Replaced AWS credentials in `AwsConfig.kt` with `REPLACE_ME`

### 2. Simplified Credential Entry Format

Both HTML and Android now use a **single input field** with the format:
```
<AccessKeyID>+<SecretKey>
```

Example:
```
MY_AWS_KEY+MY_AWS_SECRET
```

This makes it easy to copy and paste credentials from AWS Secrets Manager or from Ron/Zach.

### 3. HTML Implementation

#### Features Added:
- **Secure Cookie Storage**: Credentials are stored in secure, HTTP-only cookies with 30-day expiration
- **Credential Validation**: Test credentials by uploading a 0-byte file to `testing/<timestamp>` in S3
- **Automatic Credential Check**: On page load, checks for stored credentials or prompts user
- **Reset Credentials Button**: Added button in header to clear and re-enter credentials

#### User Flow:
1. When page loads with `REPLACE_ME` credentials:
   - Checks for stored credentials in cookies
   - If found, validates them by testing S3 upload
   - If not found or invalid, shows credential prompt

2. Credential Prompt shows two options:
   - **(a)** Contact Ron or Zach for the password
   - **(b)** Access AWS Secrets Manager:
     - Navigate to: https://us-east-1.console.aws.amazon.com/secretsmanager/secret?name=CarmeiZionUploader&region=us-east-1
     - Click "Retrieve secret value"
     - Copy the credentials in format: `<AccessKeyID>+<SecretKey>`

3. After entering credentials:
   - System tests them by uploading a test file to S3
   - If valid: Stores in secure cookies and allows upload
   - If invalid: Shows error and prompts to try again

4. Reset Credentials:
   - Click "🔄 Reset Credentials" button in header
   - Clears stored credentials and reloads page

### 3. Android Implementation

#### New Files Created:
- `CredentialManager.kt`: Manages encrypted credential storage using Android's EncryptedSharedPreferences
- `CredentialDialog.kt`: Compose UI dialog for credential entry

#### Features Added:
- **Encrypted Storage**: Uses Android Security library's EncryptedSharedPreferences with AES256-GCM encryption
- **Credential Validation**: Tests credentials by uploading a 0-byte file to `testing/<timestamp>` in S3
- **Automatic Credential Check**: On app launch, checks for stored credentials or shows dialog
- **Reset Credentials Button**: Added button in main screen to clear and re-enter credentials

#### User Flow:
1. When app launches with `REPLACE_ME` credentials:
   - Checks for stored encrypted credentials
   - If found, uses them automatically
   - If not found, shows credential dialog

2. Credential Dialog shows two options:
   - **(a)** Contact Ron or Zach for the password
   - **(b)** Access AWS Secrets Manager:
     - Find 'CarmeiZionUploader' secret
     - Click 'Retrieve secret value'
     - Copy credentials in format: `<AccessKeyID>+<SecretKey>`

3. After entering credentials:
   - Shows "Testing credentials..." with loading indicator
   - Tests them by uploading a test file to S3
   - If valid: Encrypts and stores credentials, closes dialog
   - If invalid: Shows error message and allows retry

4. Reset Credentials:
   - Click "🔄 Reset AWS Credentials" button at bottom of screen
   - Clears stored credentials and shows dialog again

#### Dependencies Added:
```gradle
implementation("androidx.security:security-crypto:1.1.0-alpha06")
```

### 4. Security Features

#### HTML:
- Credentials stored in secure cookies with `SameSite=Strict` and `Secure` flags
- 30-day expiration on stored credentials
- Automatic validation on page load
- Test upload to verify credentials work before allowing use

#### Android:
- Credentials encrypted using AES256-GCM via EncryptedSharedPreferences
- Master key managed by Android Keystore
- Credentials never logged or exposed in plain text
- Test upload to verify credentials work before allowing use

### 5. Backward Compatibility

Both implementations support hardcoded credentials for development:
- If credentials in config files are NOT `REPLACE_ME`, they will be used directly
- This allows developers to optionally hardcode credentials for testing
- Production deployments should always use `REPLACE_ME` to force credential entry

### 6. Testing Mechanism

Both implementations test credentials by:
1. Creating a temporary S3 client with provided credentials
2. Uploading a 0-byte file to `testing/<current_timestamp>`
3. If upload succeeds, credentials are valid
4. If upload fails, credentials are rejected

This ensures credentials have proper S3 write permissions before allowing actual uploads.

## Files Modified

### HTML:
- `shiurim-upload.html`: Added credential management, validation, and UI

### Android:
- `app/src/main/java/com/bienenfe/carmeizionshiurimupload/config/AwsConfig.kt`: Replaced credentials with REPLACE_ME
- `app/src/main/java/com/bienenfe/carmeizionshiurimupload/config/CredentialManager.kt`: NEW - Credential management
- `app/src/main/java/com/bienenfe/carmeizionshiurimupload/ui/CredentialDialog.kt`: NEW - Credential entry UI
- `app/src/main/java/com/bienenfe/carmeizionshiurimupload/ui/AudioUploadScreen.kt`: Added reset button
- `app/src/main/java/com/bienenfe/carmeizionshiurimupload/MainActivity.kt`: Added credential checking
- `app/src/main/java/com/bienenfe/carmeizionshiurimupload/service/UploadService.kt`: Use CredentialManager
- `app/build.gradle.kts`: Added security-crypto dependency

## Usage Instructions

### For End Users:

#### HTML:
1. Open `shiurim-upload.html` in a web browser
2. When prompted, enter AWS credentials in format: `<AccessKeyID>+<SecretKey>`
   - Get from Ron/Zach or AWS Console
3. Credentials will be remembered for 30 days
4. To reset: Click "🔄 Reset Credentials" button

#### Android:
1. Launch the app
2. When prompted, paste AWS credentials in format: `<AccessKeyID>+<SecretKey>`
   - Get from Ron/Zach or AWS Console
3. Credentials will be stored securely and remembered
4. To reset: Click "🔄 Reset AWS Credentials" button at bottom of screen

### For Developers:
- Credentials can be hardcoded in config files for development (replace `REPLACE_ME`)
- For production, leave as `REPLACE_ME` to force secure credential entry
- Test files are uploaded to `testing/` folder in S3 bucket
