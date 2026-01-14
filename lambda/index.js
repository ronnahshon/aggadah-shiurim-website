/**
 * AWS Lambda function to automatically update GitHub repo when audio files are uploaded to S3
 * 
 * Flow: S3 Upload → SQS → This Lambda → GitHub API → Commit → Vercel auto-deploys
 * 
 * Environment Variables Required:
 * - GITHUB_TOKEN: Personal access token with repo permissions
 * - GITHUB_OWNER: GitHub username/org (e.g., "yourusername")
 * - GITHUB_REPO: Repository name (e.g., "aggadah-shiurim-website")
 * - GITHUB_BRANCH: Branch to commit to (default: "main")
 * 
 * Manifest File Format:
 * For each audio file (e.g., shiur.mp3), there should be a corresponding manifest file (shiur.manifest)
 * containing JSON metadata with all the properties needed for the shiur entry.
 */

import { Octokit } from '@octokit/rest';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// Mapping of S3 folder prefixes to JSON file paths in the repo
const FOLDER_TO_JSON_MAP = {
  'audio/': 'public/data/shiurim_data.json',
  'carmei_zion_daf_yomi/': 'public/data/other_shiurim_carmei_zion/daf_yomi.json',
  'carmei_zion_gemara_beiyyun/': 'public/data/other_shiurim_carmei_zion/gemara_beiyyun.json',
  'carmei_zion_shiurim_meyuhadim/': 'public/data/other_shiurim_carmei_zion/shiurim_meyuhadim.json',
};

// Mapping of folder prefixes to shiur types
const FOLDER_TO_TYPE_MAP = {
  'audio/': 'ein_yaakov',
  'carmei_zion_daf_yomi/': 'daf_yomi',
  'carmei_zion_gemara_beiyyun/': 'gemara_beiyyun',
  'carmei_zion_shiurim_meyuhadim/': 'shiurim_meyuhadim',
};

const S3_BUCKET = 'midrash-aggadah';
const S3_REGION = 'eu-north-1';
const S3_BASE_URL = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/`;

const s3Client = new S3Client({ region: S3_REGION });

export const handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  // Validate environment variables
  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH = 'main' } = process.env;
  
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error('Missing required environment variables: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO');
  }
  
  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  
  const results = {
    processed: 0,
    failed: 0,
    errors: [],
  };

  // Process each SQS record
  for (const record of event.Records) {
    try {
      // Parse S3 event from SQS message
      const s3Event = JSON.parse(record.body);
      const s3Records = s3Event.Records || [];
      
      for (const s3Record of s3Records) {
        if (s3Record.eventName?.startsWith('ObjectCreated:')) {
          const key = decodeURIComponent(s3Record.s3.object.key.replace(/\+/g, ' '));
          
          // Only process manifest files
          if (!key.endsWith('.manifest')) {
            console.log(`Skipping non-manifest file: ${key}`);
            continue;
          }
          
          console.log(`Processing manifest upload: ${key}`);
          
          await processNewUpload(octokit, key, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH);
          results.processed++;
        }
      }
      
    } catch (error) {
      console.error('Error processing record:', error);
      results.failed++;
      results.errors.push(error.message);
    }
  }

  console.log('Processing complete:', results);
  return results;
};

/**
 * Process a new S3 upload and update the GitHub repo
 */
async function processNewUpload(octokit, manifestKey, owner, repo, branch) {
  // Determine which JSON file to update based on folder prefix
  const folderPrefix = Object.keys(FOLDER_TO_JSON_MAP).find(prefix => manifestKey.startsWith(prefix));
  
  if (!folderPrefix) {
    console.log(`Skipping file - no matching folder prefix: ${manifestKey}`);
    return;
  }
  
  const jsonPath = FOLDER_TO_JSON_MAP[folderPrefix];
  const shiurType = FOLDER_TO_TYPE_MAP[folderPrefix];
  
  console.log(`Updating ${jsonPath} for ${shiurType}`);
  
  // Read manifest file from S3
  console.log(`Reading manifest file: ${manifestKey}`);
  
  let manifestData;
  try {
    manifestData = await getManifestFromS3(manifestKey);
  } catch (error) {
    console.error(`Error reading manifest file ${manifestKey}:`, error.message);
    throw new Error(`Failed to read manifest file: ${manifestKey}`);
  }
  
  // Manifest should specify the audio file extension
  if (!manifestData.audio_extension) {
    throw new Error(`Manifest missing required field: audio_extension (should be "mp3" or "m4a")`);
  }
  
  // Construct audio file key from manifest key
  const audioKey = manifestKey.replace(/\.manifest$/, `.${manifestData.audio_extension}`);
  console.log(`Audio file: ${audioKey}`);
  
  // Get current file content from GitHub
  const { data: fileData } = await octokit.repos.getContent({
    owner,
    repo,
    path: jsonPath,
    ref: branch,
  });
  
  // Decode content
  const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
  
  // Parse JSON
  let jsonData;
  let isSeriesFormat = false;
  
  if (shiurType === 'ein_yaakov') {
    // shiurim_data.json is an array
    jsonData = JSON.parse(content);
  } else {
    // Other series files have series_metadata and episodes array
    jsonData = JSON.parse(content);
    isSeriesFormat = true;
  }
  
  // Create new entry from manifest
  const newEntry = createShiurEntryFromManifest(audioKey, manifestData, shiurType);
  
  // Add or update entry
  if (isSeriesFormat) {
    if (!jsonData.episodes) {
      jsonData.episodes = [];
    }
    
    const existingIndex = jsonData.episodes.findIndex(item => item.id === newEntry.id);
    if (existingIndex >= 0) {
      console.log(`Updating existing entry: ${newEntry.id}`);
      jsonData.episodes[existingIndex] = { ...jsonData.episodes[existingIndex], ...newEntry };
    } else {
      console.log(`Adding new entry: ${newEntry.id}`);
      jsonData.episodes.push(newEntry);
    }
    
    // Sort by date descending
    jsonData.episodes.sort((a, b) => {
      const dateA = new Date(a.english_date || a.english_year || 0);
      const dateB = new Date(b.english_date || b.english_year || 0);
      return dateB - dateA;
    });
  } else {
    const existingIndex = jsonData.findIndex(item => item.id === newEntry.id);
    if (existingIndex >= 0) {
      console.log(`Updating existing entry: ${newEntry.id}`);
      jsonData[existingIndex] = { ...jsonData[existingIndex], ...newEntry };
    } else {
      console.log(`Adding new entry: ${newEntry.id}`);
      jsonData.push(newEntry);
    }
    
    // Sort by global_id descending
    jsonData.sort((a, b) => (b.global_id || 0) - (a.global_id || 0));
  }
  
  // Convert back to JSON string
  const updatedContent = JSON.stringify(jsonData, null, 2);
  
  // Commit to GitHub
  const filename = audioKey.split('/').pop();
  const commitMessage = `Add shiur: ${filename}`;
  
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: jsonPath,
    message: commitMessage,
    content: Buffer.from(updatedContent).toString('base64'),
    sha: fileData.sha,
    branch,
  });
  
  console.log(`Successfully committed update to ${jsonPath}`);
}

/**
 * Get manifest file from S3
 */
async function getManifestFromS3(manifestKey) {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: manifestKey,
  });
  
  const response = await s3Client.send(command);
  const bodyString = await streamToString(response.Body);
  
  return JSON.parse(bodyString);
}

/**
 * Convert stream to string
 */
async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

/**
 * Create a shiur entry from manifest data
 */
function createShiurEntryFromManifest(s3Key, manifestData, shiurType) {
  const audioUrl = `${S3_BASE_URL}${s3Key}`;
  
  // Get current date/time in Israel timezone (Asia/Jerusalem)
  const israelDate = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' });
  const now = new Date(israelDate);
  const currentYear = now.getFullYear();
  const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  if (shiurType === 'ein_yaakov') {
    // Main shiurim_data.json format
    return {
      id: manifestData.id,
      hebrew_title: manifestData.hebrew_title,
      english_title: manifestData.english_title,
      category: manifestData.category || 'ein_yaakov',
      sub_category: manifestData.sub_category || '',
      hebrew_sefer: manifestData.hebrew_sefer || '',
      english_sefer: manifestData.english_sefer || '',
      shiur_num: manifestData.shiur_num || 0,
      global_id: manifestData.global_id || 0,
      length: manifestData.length || '',
      audio_recording_link: audioUrl,
      source_sheet_link: manifestData.source_sheet_link || '',
      english_year: currentYear,
      english_date: currentDate,
    };
  } else {
    // Other series format (daf_yomi, gemara_beiyyun, shiurim_meyuhadim)
    return {
      id: manifestData.id,
      hebrew_title: manifestData.hebrew_title,
      english_title: manifestData.english_title,
      hebrew_sefer: manifestData.hebrew_sefer || '',
      shiur_num: manifestData.shiur_num || 0,
      length: manifestData.length || '',
      english_year: currentYear,
      english_date: currentDate,
      audio_url: audioUrl,
      speaker: manifestData.speaker || 'כרמי ציון',
    };
  }
}
