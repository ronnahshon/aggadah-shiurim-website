# S3 Upload Setup Instructions

## AWS Configuration

### 1. Create IAM User

1. Go to AWS IAM Console
2. Click "Users" → "Add users"
3. User name: `carmei-zion-shiurim-uploader`
4. Select "Access key - Programmatic access"
5. Click "Next: Permissions"

### 2. Create and Attach IAM Policy

1. Click "Attach existing policies directly"
2. Click "Create policy"
3. Select JSON tab and paste:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "UploadToSpecificBucket",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl"
            ],
            "Resource": "arn:aws:s3:::midrash-aggadah/*"
        }
    ]
}
```

4. Name the policy: `CarmeiZionShiurimUploadPolicy`
5. Create the policy
6. Go back to user creation and attach this policy
7. Complete user creation
8. **IMPORTANT**: Save the Access Key ID and Secret Access Key

### 3. Configure the App

1. Open `app/src/main/java/com/bienenfe/carmeizionshiurimupload/config/AwsConfig.kt`
2. Replace the placeholder values:
   - `ACCESS_KEY`: Your AWS Access Key ID
   - `SECRET_KEY`: Your AWS Secret Access Key
   - `BUCKET_NAME`: `midrash-aggadah` (already set)
   - `REGION`: Your bucket's region (default: `us-east-1`)

```kotlin
object AwsConfig {
    const val ACCESS_KEY = "MY_AWS_KEY"  // Replace with your key
    const val SECRET_KEY = "MY_AWS_SECRET"  // Replace with your key
    const val BUCKET_NAME = "midrash-aggadah"
    const val REGION = "eu-north-1"  // Europe (Stockholm)
}
```

### 4. S3 Bucket Configuration

Ensure your S3 bucket `midrash-aggadah` in **eu-north-1 (Europe - Stockholm)** has the following folder structure:
- `audio/` - For Ein Yaakov shiurim
- `carmei_zion_daf_yomi/` - For Daf Yomi shiurim
- `carmei_zion_gemara_beiyyun/` - For Gemara Iyun shiurim
- `carmei_zion_shiurim_meyuhadim/` - For Meyuchadim shiurim
- Custom folders as needed for "Other" type

## Security Notes

⚠️ **IMPORTANT**: The current implementation stores AWS credentials in the app code. This is acceptable for:
- Internal/private apps
- Apps distributed within your organization
- Development/testing

For production apps distributed publicly, consider:
1. Using AWS Cognito for temporary credentials
2. Using a backend API to handle uploads
3. Using AWS Amplify for authentication

## How It Works

1. User records or selects an audio file
2. User fills in metadata (title, presenter, language, etc.)
3. User selects shiur type (determines S3 folder)
4. App uploads to: `s3://midrash-aggadah/{folder_prefix}/{filename}`
5. Progress is shown during upload
6. Success message displays the S3 URL

## Testing

1. Build and run the app
2. Record or select a test audio file
3. Fill in the metadata
4. Click "Upload to S3"
5. Check your S3 bucket to verify the file was uploaded

## Troubleshooting

### Upload fails with "Access Denied"
- Verify IAM policy is correctly attached
- Check that bucket name matches
- Ensure credentials are correct

### Upload fails with "Network Error"
- Check internet connection
- Verify INTERNET permission in AndroidManifest.xml
- Check if bucket region is correct

### App crashes on upload
- Check Logcat for detailed error messages
- Verify AWS SDK dependencies are properly added
- Ensure file URI is valid
