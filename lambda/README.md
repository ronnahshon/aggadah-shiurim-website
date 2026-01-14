# S3 to GitHub Auto-Updater Lambda

Automatically updates your GitHub repository when audio files are uploaded to S3.

## Quick Start

1. **Read the setup guide**: See [SETUP.md](./SETUP.md) for detailed instructions
2. **Build the deployment package**:
   ```bash
   cd lambda
   npm install
   zip -r deployment.zip . -x "*.git*" "*.md" "deployment.zip"
   ```
3. **Upload to Lambda**: Follow steps in SETUP.md

## How It Works

```
Upload MP3 to S3
    ↓
S3 Event Notification
    ↓
SQS Queue
    ↓
Lambda Function (this code)
    ↓
GitHub API - Update JSON file
    ↓
Git Commit
    ↓
Vercel Auto-Deploy
    ↓
Site Updated!
```

## Files

- `index.js` - Main Lambda function code
- `package.json` - Dependencies (Octokit for GitHub API)
- `SETUP.md` - Complete setup instructions
- `README.md` - This file

## Folder Mappings

| S3 Folder | JSON File | Type |
|-----------|-----------|------|
| `audio/` | `public/data/shiurim_data.json` | Ein Yaakov |
| `carmei_zion_daf_yomi/` | `public/data/other_shiurim_carmei_zion/daf_yomi.json` | Daf Yomi |
| `carmei_zion_gemara_beiyyun/` | `public/data/other_shiurim_carmei_zion/gemara_beiyyun.json` | Gemara Iyun |
| `carmei_zion_shiurim_meyuhadim/` | `public/data/other_shiurim_carmei_zion/shiurim_meyuhadim.json` | Meyuchadim |

## Environment Variables

Set these in Lambda Configuration:

- `GITHUB_TOKEN` - Personal access token with `repo` scope
- `GITHUB_OWNER` - Your GitHub username
- `GITHUB_REPO` - Repository name (e.g., "aggadah-shiurim-website")
- `GITHUB_BRANCH` - Branch to commit to (default: "main")

## Customization

Edit the `parseFilename()` function in `index.js` to match your filename conventions.

## Support

See [SETUP.md](./SETUP.md) for troubleshooting and detailed configuration.
