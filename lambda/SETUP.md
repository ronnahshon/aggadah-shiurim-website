# Updating Lambda Function

## Quick Update

```bash
cd lambda
npm install
zip -r deployment.zip . -x "*.git*" "*.md" "deployment.zip" "sqs-access-policy.json"
```

Then upload `deployment.zip` to Lambda:
- AWS Console → Lambda → Upload from → .zip file

Or via CLI:
```bash
aws lambda update-function-code \
  --function-name midrash-aggadah-s3-to-github \
  --zip-file fileb://deployment.zip \
  --region eu-north-1
```

## Test

Lambda Console → Test tab → Use this event:
```json
{
  "Records": [{
    "body": "{\"Records\":[{\"eventName\":\"ObjectCreated:Put\",\"s3\":{\"bucket\":{\"name\":\"midrash-aggadah\"},\"object\":{\"key\":\"carmei_zion_daf_yomi/test.manifest\"}}}]}"
  }]
}
```

## View Logs

```bash
aws logs tail /aws/lambda/midrash-aggadah-s3-to-github --follow
```

## Common Changes

**Add new folder mapping** - edit `index.js`:
```javascript
const FOLDER_TO_JSON_MAP = {
  'new_folder/': 'public/data/new_series.json',
};
```

**Update GitHub settings** - Lambda → Configuration → Environment variables (no redeploy needed)
