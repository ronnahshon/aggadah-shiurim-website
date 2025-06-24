#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import shiurim data
const shiurimDataPath = path.join(__dirname, '../src/data/shiurim_data.json');
const shiurimData = JSON.parse(fs.readFileSync(shiurimDataPath, 'utf8'));

// Base URL - you should update this to your actual domain
const BASE_URL = 'https://midrashaggadah.com';
const SITE_NAME = 'Midrash Aggadah';
const SITE_DESCRIPTION = 'A comprehensive resource for exploring midrash aggadah, featuring shiurim, source texts, and sefarim';

function formatTitle(str) {
  return str.replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function generateEnclosure(shiur) {
  // Estimate audio file size based on duration
  // Assuming average MP3 bitrate of 128kbps (about 1MB per minute)
  let estimatedSize = 1048576; // Default 1MB if no duration
  
  if (shiur.length) {
    const [minutes, seconds] = shiur.length.split(':').map(Number);
    const totalMinutes = minutes + (seconds / 60);
    // Estimate: 1MB per minute for 128kbps MP3
    estimatedSize = Math.round(totalMinutes * 1048576);
  }
  
  return `<enclosure url="${shiur.audio_recording_link}" type="audio/mpeg" length="${estimatedSize}"/>`;
}

function generateRSSFeed() {
  // Get all shiurim (RSS feeds can handle large numbers of entries)
  const latestShiurim = shiurimData;
  
  const buildDate = new Date().toUTCString();
  
  let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${BASE_URL}</link>
    <description>${SITE_DESCRIPTION}</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <pubDate>${buildDate}</pubDate>
    <ttl>1440</ttl>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    
    <!-- iTunes podcast metadata -->
    <itunes:author>${SITE_NAME}</itunes:author>
    <itunes:summary>${SITE_DESCRIPTION}</itunes:summary>
    <itunes:category text="Religion &amp; Spirituality">
      <itunes:category text="Judaism"/>
    </itunes:category>
    <itunes:explicit>no</itunes:explicit>
    <itunes:owner>
      <itunes:name>${SITE_NAME}</itunes:name>
      <itunes:email>midrashaggadah@gmail.com</itunes:email>
    </itunes:owner>
    <itunes:image href="${BASE_URL}/favicon.ico"/>
`;

  // Add each shiur as an RSS item
  latestShiurim.forEach(shiur => {
    const shiurUrl = `${BASE_URL}/shiur/${shiur.id}`;
    const categoryName = formatTitle(shiur.category);
    const seferName = formatTitle(shiur.english_sefer);
    
    // Create a comprehensive description
    const description = `A shiur on "${shiur.english_title}" from ${seferName} in the ${categoryName} collection. ${shiur.hebrew_title ? `Hebrew title: ${shiur.hebrew_title}. ` : ''}Part of the comprehensive Midrash Aggadah learning series featuring classical Jewish wisdom and aggadic texts.`;
    
    // Estimate publication date (you might want to add actual dates to your data)
    const pubDate = new Date().toUTCString();
    
    rss += `
    <item>
      <title><![CDATA[${shiur.english_title}]]></title>
      <link>${shiurUrl}</link>
      <guid>${shiurUrl}</guid>
      <description><![CDATA[${description}]]></description>
      <pubDate>${pubDate}</pubDate>
      <category><![CDATA[${categoryName}]]></category>
      <category><![CDATA[${seferName}]]></category>
      
      <!-- iTunes episode metadata -->
      <itunes:title><![CDATA[${shiur.english_title}]]></itunes:title>
      <itunes:summary><![CDATA[${description}]]></itunes:summary>
      <itunes:explicit>no</itunes:explicit>
      ${shiur.audio_recording_link ? generateEnclosure(shiur) : ''}
      ${shiur.audio_recording_link ? `<itunes:duration>${shiur.length || '00:00'}</itunes:duration>` : ''}
    </item>`;
  });

  rss += `
  </channel>
</rss>`;

  return rss;
}

function generateAtomFeed() {
  const latestShiurim = shiurimData;
  const buildDate = new Date().toISOString();
  
  let atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${SITE_NAME}</title>
  <link href="${BASE_URL}"/>
  <link href="${BASE_URL}/atom.xml" rel="self"/>
  <id>${BASE_URL}/</id>
  <updated>${buildDate}</updated>
  <subtitle>${SITE_DESCRIPTION}</subtitle>
  <author>
    <name>${SITE_NAME}</name>
    <email>midrashaggadah@gmail.com</email>
  </author>
`;

  latestShiurim.forEach(shiur => {
    const shiurUrl = `${BASE_URL}/shiur/${shiur.id}`;
    const categoryName = formatTitle(shiur.category);
    const seferName = formatTitle(shiur.english_sefer);
    
    const description = `A shiur on "${shiur.english_title}" from ${seferName} in the ${categoryName} collection. Part of the comprehensive Midrash Aggadah learning series.`;
    const updateDate = new Date().toISOString();
    
    atom += `
  <entry>
    <title><![CDATA[${shiur.english_title}]]></title>
    <link href="${shiurUrl}"/>
    <id>${shiurUrl}</id>
    <updated>${updateDate}</updated>
    <summary><![CDATA[${description}]]></summary>
    <category term="${categoryName}"/>
    <category term="${seferName}"/>
  </entry>`;
  });

  atom += `
</feed>`;

  return atom;
}

// Generate both RSS and Atom feeds
try {
  const rssContent = generateRSSFeed();
  const atomContent = generateAtomFeed();
  
  // Write RSS feed
  const rssOutputPath = path.join(__dirname, '../public/rss.xml');
  fs.writeFileSync(rssOutputPath, rssContent, 'utf8');
  
  // Write Atom feed
  const atomOutputPath = path.join(__dirname, '../public/atom.xml');
  fs.writeFileSync(atomOutputPath, atomContent, 'utf8');
  
  console.log('✅ RSS feed generated successfully at', rssOutputPath);
  console.log('📊 RSS items:', shiurimData.length);
  console.log('✅ Atom feed generated successfully at', atomOutputPath);
  console.log('📊 Atom entries:', shiurimData.length);
} catch (error) {
  console.error('❌ Error generating feeds:', error);
  process.exit(1);
} 