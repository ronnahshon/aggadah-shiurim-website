import fs from 'fs';
import path from 'path';
import https from 'https';
import { getAudioDurationInSeconds } from 'get-audio-duration';
import { createWriteStream } from 'fs';
import { unlink } from 'fs/promises';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const S3_BUCKET = "midrash-aggadah";
const S3_REGION = "eu-north-1";
const AUDIO_FOLDER = "audio";
const DATA_FILE_PATH = path.resolve(__dirname, '../public/data/shiurim_data.json');
const TEMP_DIR = path.resolve(__dirname, '../temp');
const FORCE_UPDATE = true; // Force update all durations, even if they already exist

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Format duration in seconds to mm:ss
function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Download file to a temporary location
function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(destination);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download file: ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      // Clean up the file
      unlink(destination).catch(() => {});
      reject(err);
    });
  });
}

// Check if URL is accessible
function isUrlAccessible(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        // Read a bit of the stream to ensure it's valid
        let dataReceived = false;
        res.on('data', () => {
          dataReceived = true;
          // We don't need the whole file, just checking if it exists
          res.destroy();
          resolve(true);
        });
        
        // Safeguard if no data event fires
        setTimeout(() => {
          if (!dataReceived) resolve(false);
        }, 5000);
      } else {
        resolve(false);
      }
    }).on('error', () => {
      resolve(false);
    });
  });
}

// Get the duration of an audio file
async function getAudioDuration(url) {
  const tempFile = path.join(TEMP_DIR, `temp-${Date.now()}.mp3`);
  
  try {
    // Download the file
    console.log(`  Downloading audio file...`);
    await downloadFile(url, tempFile);
    
    // Get the duration
    console.log(`  Analyzing audio duration...`);
    const durationInSeconds = await getAudioDurationInSeconds(tempFile);
    
    // Format and return
    return formatDuration(durationInSeconds);
  } catch (error) {
    throw error;
  } finally {
    // Clean up temp file
    try {
      await unlink(tempFile);
    } catch (e) {
      // Ignore errors during cleanup
    }
  }
}

async function main() {
  try {
    console.log('Reading shiurim data...');
    const data = JSON.parse(fs.readFileSync(DATA_FILE_PATH, 'utf8'));
    console.log(`Found ${data.length} shiurim in the data file`);
    
    // Count how many already have length
    const withLength = data.filter(item => item.length).length;
    console.log(`${withLength} shiurim already have length values`);
    
    if (FORCE_UPDATE) {
      console.log('FORCE_UPDATE is enabled - will update ALL audio durations');
    }
    
    // Process each shiur
    let processed = 0;
    let updated = 0;
    let failed = 0;
    let unchanged = 0;
    
    for (const shiur of data) {
      processed++;
      
      // Skip if already has length and we're not forcing update
      if (shiur.length && !FORCE_UPDATE) {
        console.log(`Shiur ${shiur.id} already has length: ${shiur.length} (${processed}/${data.length})`);
        continue;
      }
      
      // Store the old length to check if it changes
      const oldLength = shiur.length;
      
      // Construct audio URL
      const audioUrl = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${AUDIO_FOLDER}/${shiur.id}.mp3`;
      
      try {
        // First check if URL is accessible
        console.log(`Checking access to ${shiur.id} audio file...`);
        const isAccessible = await isUrlAccessible(audioUrl);
        
        if (!isAccessible) {
          console.log(`❌ Audio file not accessible: ${shiur.id}`);
          failed++;
          continue;
        }
        
        // Get duration
        console.log(`Getting accurate duration for ${shiur.id}...`);
        const duration = await getAudioDuration(audioUrl);
        
        // Check if the duration has changed
        if (oldLength === duration) {
          console.log(`✓ Duration unchanged for ${shiur.id}: ${duration} (${processed}/${data.length})`);
          unchanged++;
        } else {
          // Update the shiur with the actual duration
          shiur.length = duration;
          console.log(`✅ Updated ${shiur.id} from ${oldLength || 'none'} to ${duration} (${processed}/${data.length})`);
          updated++;
        }
        
        // Save progress after processing a file (even if unchanged)
        if (processed % 5 === 0 || processed === data.length) {
          fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
          console.log(`Progress saved (${processed}/${data.length})`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${shiur.id}:`, error.message);
        failed++;
      }
    }
    
    // Save final result
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    
    console.log('\nSummary:');
    console.log(`Total shiurim: ${data.length}`);
    console.log(`Updated with new duration: ${updated}`);
    console.log(`Unchanged durations: ${unchanged}`);
    console.log(`Failed to update: ${failed}`);
    console.log('\nThe shiurim_data.json file has been updated with accurate audio durations.');
  } catch (error) {
    console.error('Error in main process:', error);
  }
}

// Run the main process
main().catch(console.error); 