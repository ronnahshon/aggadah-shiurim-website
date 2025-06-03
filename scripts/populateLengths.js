// Import the ESM module - this syntax would be used with Node.js
import { populateAudioLengths } from '../src/utils/populateAudioLengths.js';

// Run the function to populate audio lengths
(async () => {
  console.log('Starting to populate audio lengths...');
  await populateAudioLengths();
  console.log('Done populating audio lengths!');
})();

/*
To run this script:
1. Make sure you're in the project root
2. Run: node --experimental-modules scripts/populateLengths.js

Note: For the real implementation using the get-audio-duration package,
you would need to install it first with:
npm install get-audio-duration
*/ 