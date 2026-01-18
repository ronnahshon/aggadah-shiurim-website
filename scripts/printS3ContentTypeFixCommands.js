#!/usr/bin/env node
/**
 * Print AWS CLI commands to fix S3 Content-Type metadata for podcast enclosures.
 *
 * Why: Apple Podcasts may ignore episodes when the enclosure URL returns a non-audio
 * Content-Type (e.g. application/octet-stream), which commonly happens when uploads
 * omit explicit metadata for .m4a files.
 *
 * Usage:
 *   node scripts/printS3ContentTypeFixCommands.js public/data/other_shiurim_carmei_zion/daf_yomi.json
 *
 * Then run the printed commands with AWS credentials configured in your shell.
 *
 * Notes:
 * - This uses `aws s3api copy-object` to copy each object onto itself while replacing metadata.
 * - We keep the key identical; only Content-Type is replaced.
 * - Always sanity-check ACL/encryption behavior for your bucket before running in bulk.
 */

import fs from 'fs';

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Missing path to series json. Example: node scripts/printS3ContentTypeFixCommands.js public/data/other_shiurim_carmei_zion/daf_yomi.json');
  process.exit(2);
}

const raw = fs.readFileSync(inputPath, 'utf8');
const data = JSON.parse(raw);

const BUCKET = 'midrash-aggadah';

const encodeKeyForCopySource = (key) =>
  // AWS examples keep "/" unescaped but require URL-encoding for special chars in segments.
  key
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');

const mimeTypeFromKey = (key) => {
  const lower = String(key || '').toLowerCase();
  if (lower.endsWith('.m4a') || lower.endsWith('.mp4')) return 'audio/mp4';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.aac')) return 'audio/aac';
  if (lower.endsWith('.wav')) return 'audio/wav';
  return null;
};

const audioKeys = [];
for (const ep of data?.episodes || []) {
  const audioUrl = ep?.audio_url;
  if (!audioUrl) continue;
  try {
    const u = new URL(audioUrl);
    // pathname is already encoded; decode then re-encode per segment to keep "/" separators.
    const decodedPath = decodeURIComponent(u.pathname).replace(/^\/+/, '');
    audioKeys.push(decodedPath);
  } catch {
    // ignore invalid URLs
  }
}

const uniqueKeys = [...new Set(audioKeys)];
const toFix = uniqueKeys
  .map((key) => ({ key, type: mimeTypeFromKey(key) }))
  .filter((x) => x.type); // only known audio types

if (toFix.length === 0) {
  console.log('No audio keys found to fix.');
  process.exit(0);
}

console.log(`# Found ${toFix.length} audio objects with known types in ${inputPath}`);
console.log(`# For each, we copy the object onto itself and REPLACE the Content-Type metadata.`);
console.log(`# Review commands before running.`);
console.log('');

for (const { key, type } of toFix) {
  const copySource = `${BUCKET}/${encodeKeyForCopySource(key)}`;
  // Use JSON-style quoting for safer copy/paste in most shells.
  console.log(
    [
      'aws s3api copy-object',
      `--bucket ${BUCKET}`,
      `--key ${JSON.stringify(key)}`,
      `--copy-source ${JSON.stringify(copySource)}`,
      '--metadata-directive REPLACE',
      `--content-type ${JSON.stringify(type)}`,
    ].join(' ')
  );
}


