#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const DATA_PATH = path.join(ROOT_DIR, 'public/data/shiurim_data.json');
const PODCAST_ONLY_DATA_PATH = path.join(ROOT_DIR, 'public/data/podcast_only.json'); // optional
const OUTPUT_DIR = path.join(ROOT_DIR, 'public/podcast');

// Allow overriding for previews (e.g., ngrok) so assets resolve correctly in validators.
const SITE_URL = process.env.SITE_URL || 'https://www.midrashaggadah.com';
const FEED_BASE_URL = process.env.FEED_BASE_URL || `${SITE_URL}/podcast`;

const PODCAST_TITLE = 'כרמי ציון | Carmei Zion';
const PODCAST_TOPIC = 'Midrash'; // content focus; kept for descriptions only
const PODCAST_AUTHOR = 'קהילת כרמי ציון';
const PODCAST_EMAIL = process.env.PODCAST_OWNER_EMAIL || 'ronnahshon@gmail.com';
const COVER_ART_URL = process.env.COVER_ART_URL || `${SITE_URL}/favicons/carmei_zion_logo_squared.png`;

// Match site playback behavior: derive S3 audio URL from the shiur id (id + ".mp3")
const S3_BUCKET = 'midrash-aggadah';
const S3_REGION = 'eu-north-1';
const S3_BASE_URL = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/`;

const DEFAULT_LANGUAGE = 'he';
const TTL_MINUTES = 1440;

const ITUNES_CATEGORY_PRIMARY = 'Religion & Spirituality';
const ITUNES_CATEGORY_SECONDARY = 'Judaism';

const FALLBACK_PUBDATE = new Date(Date.UTC(2024, 0, 1));
const BYTES_PER_MINUTE_AT_128K = 1048576; // 1MB/min as a safe default

/**
 * Convert Hebrew calendar year to approximate Gregorian year.
 * Hebrew year 5784 corresponds roughly to 2023-2024 Gregorian.
 * The offset is approximately 3760 years.
 */
const hebrewToGregorianYear = (hebrewYear) => {
  if (!hebrewYear || typeof hebrewYear !== 'number') return null;
  // Hebrew years > 5000 are clearly Hebrew calendar
  if (hebrewYear > 5000) {
    return hebrewYear - 3760;
  }
  // If it's already a reasonable Gregorian year (2000-2100), use it as-is
  if (hebrewYear >= 2000 && hebrewYear <= 2100) {
    return hebrewYear;
  }
  return null;
};

const ensureDir = (dirPath) => fs.mkdirSync(dirPath, { recursive: true });

const isHttpUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value);

const escapeAttr = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const buildAudioUrlFromShiur = (shiur) => {
  // Site playback derives audio from S3 using `${shiur.id}.mp3`
  const s3Derived = `${S3_BASE_URL}audio/${shiur.id}.mp3`;

  // If the stored link is already a direct HTTP URL and not a Google Drive view link, honor it.
  if (isHttpUrl(shiur.audio_recording_link) && !shiur.audio_recording_link.includes('drive.google.com')) {
    return shiur.audio_recording_link;
  }

  return s3Derived;
};

const slugify = (value) =>
  String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'untitled';

const formatTitle = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ''))
    .join(' ')
    .trim();

const parseDurationToSeconds = (duration) => {
  if (!duration || typeof duration !== 'string') return null;
  const parts = duration.split(':').map(Number);
  if (parts.some(Number.isNaN)) return null;
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }
  return null;
};

const estimateEnclosureLength = (duration) => {
  const totalSeconds = parseDurationToSeconds(duration);
  if (!totalSeconds) return BYTES_PER_MINUTE_AT_128K;
  const minutes = totalSeconds / 60;
  return Math.max(BYTES_PER_MINUTE_AT_128K, Math.round(minutes * BYTES_PER_MINUTE_AT_128K));
};

const buildPubDate = (shiur) => {
  if (shiur.english_year && Number.isFinite(Number(shiur.english_year))) {
    const rawYear = Number(shiur.english_year);
    const gregorianYear = hebrewToGregorianYear(rawYear);
    
    if (gregorianYear && gregorianYear >= 2000 && gregorianYear <= 2100) {
      return new Date(Date.UTC(gregorianYear, 0, 1));
    }
  }
  return FALLBACK_PUBDATE;
};

const buildDescription = (shiur) => {
  const pieces = [];
  if (shiur.english_title) pieces.push(shiur.english_title);
  if (shiur.hebrew_title) pieces.push(shiur.hebrew_title);
  if (shiur.source_sheet_link) pieces.push(`Source sheet: ${shiur.source_sheet_link}`);
  return `${pieces.join(' — ')}. Presented by ${PODCAST_AUTHOR}.`.trim();
};

const buildEpisode = (shiur) => {
  const enclosureUrl = buildAudioUrlFromShiur(shiur);
  if (!enclosureUrl) return null;
  const pubDate = buildPubDate(shiur);
  const enclosureLength = estimateEnclosureLength(shiur.length);
  const guid = `carmei-zion-${shiur.id}`;
  const link = `${SITE_URL}/shiur/${shiur.id}`;
  const categories = [
    PODCAST_TOPIC,
    formatTitle(shiur.category),
    formatTitle(shiur.sub_category),
    formatTitle(shiur.english_sefer),
  ].filter(Boolean);

  return {
    guid,
    link,
    title: shiur.hebrew_title || shiur.english_title || 'Shiur',
    description: buildDescription(shiur),
    pubDate: pubDate.toUTCString(),
    duration: shiur.length || '',
    enclosure: {
      url: enclosureUrl,
      type: 'audio/mpeg',
      length: enclosureLength,
    },
    categories,
  };
};

const groupBy = (items, keyFn) => {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
};

const renderRss = ({ feedTitle, feedDescription, feedUrl, items }) => {
  const buildDate = new Date().toUTCString();
  const imageTag = `<itunes:image href="${COVER_ART_URL}"/>`;
  const categoryPrimary = escapeAttr(ITUNES_CATEGORY_PRIMARY);
  const categorySecondary = escapeAttr(ITUNES_CATEGORY_SECONDARY);
  
  // Ensure description is at least 50 characters for podcast validators
  const minDescLength = 50;
  const paddedDescription = feedDescription.length >= minDescLength 
    ? feedDescription 
    : `${feedDescription} Torah shiurim and Jewish learning from Israel.`;

  const header = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <title><![CDATA[${feedTitle}]]></title>
    <link>${SITE_URL}</link>
    <description><![CDATA[${paddedDescription}]]></description>
    <language>${DEFAULT_LANGUAGE}</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <pubDate>${buildDate}</pubDate>
    <ttl>${TTL_MINUTES}</ttl>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <itunes:author><![CDATA[${PODCAST_AUTHOR}]]></itunes:author>
    <itunes:summary><![CDATA[${paddedDescription}]]></itunes:summary>
    <itunes:category text="${categoryPrimary}">
      <itunes:category text="${categorySecondary}"/>
    </itunes:category>
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    <itunes:owner>
      <itunes:name><![CDATA[${PODCAST_AUTHOR}]]></itunes:name>
      <itunes:email>${PODCAST_EMAIL}</itunes:email>
    </itunes:owner>
    ${imageTag}
    <podcast:locked>no</podcast:locked>
`;

  const itemsXml = items
    .map(
      (item) => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <guid isPermaLink="false">${item.guid}</guid>
      <description><![CDATA[${item.description}]]></description>
      <pubDate>${item.pubDate}</pubDate>
      ${item.categories
        .map((category) => `      <category><![CDATA[${category}]]></category>`)
        .join('\n')}
      <itunes:author><![CDATA[${PODCAST_AUTHOR}]]></itunes:author>
      <itunes:episodeType>full</itunes:episodeType>
      <itunes:explicit>no</itunes:explicit>
      ${item.duration ? `<itunes:duration>${item.duration}</itunes:duration>` : ''}
      <enclosure url="${item.enclosure.url}" type="${item.enclosure.type}" length="${item.enclosure.length}"/>
    </item>`
    )
    .join('\n');

  const footer = `
  </channel>
</rss>`;

  return `${header}${itemsXml}${footer}`;
};

const writeFeed = (filePath, content) => {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
};

const buildFeedDefinitions = (shiurim) => {
  const feeds = [];

  feeds.push({
    segments: ['carmei-zion', 'all'],
    title: `${PODCAST_TITLE}`,
    description: 'שיעורי תורה בגמרא, מדרש, מחשבה, ונושאים אחרים מקהילת כרמי ציון בקרית גת, ישראל',
    items: shiurim,
  });

  const byCategory = groupBy(shiurim, (s) => s.category);
  for (const [categoryKey, categoryItems] of byCategory.entries()) {
    const categoryTitle = formatTitle(categoryKey);
    feeds.push({
      segments: ['carmei-zion', 'category', slugify(categoryKey)],
      title: `${PODCAST_TITLE} – ${categoryTitle}`,
      description: `${categoryTitle} shiurim from ${PODCAST_AUTHOR}.`,
      items: categoryItems,
    });

    const bySub = groupBy(categoryItems, (s) => s.sub_category);
    for (const [subKey, subItems] of bySub.entries()) {
      const subTitle = formatTitle(subKey);
      feeds.push({
        segments: ['carmei-zion', 'category', slugify(categoryKey), 'sub-category', slugify(subKey)],
        title: `${PODCAST_TITLE} – ${categoryTitle} / ${subTitle}`,
        description: `${categoryTitle} – ${subTitle} shiurim from ${PODCAST_AUTHOR}.`,
        items: subItems,
      });

      const bySefer = groupBy(subItems, (s) => s.english_sefer);
      for (const [seferKey, seferItems] of bySefer.entries()) {
        const seferTitle = formatTitle(seferKey);
        feeds.push({
          segments: [
            'carmei-zion',
            'category',
            slugify(categoryKey),
            'sub-category',
            slugify(subKey),
            'sefer',
            slugify(seferKey),
          ],
          title: `${PODCAST_TITLE} – ${categoryTitle} / ${subTitle} / ${seferTitle}`,
          description: `${categoryTitle} – ${subTitle} – ${seferTitle} shiurim from ${PODCAST_AUTHOR}.`,
          items: seferItems,
        });
      }
    }
  }

  return feeds;
};

const main = () => {
  const primaryRaw = fs.readFileSync(DATA_PATH, 'utf8');
  const primaryShiurim = JSON.parse(primaryRaw);

  let podcastOnly = [];
  if (fs.existsSync(PODCAST_ONLY_DATA_PATH)) {
    try {
      const podcastOnlyRaw = fs.readFileSync(PODCAST_ONLY_DATA_PATH, 'utf8');
      podcastOnly = JSON.parse(podcastOnlyRaw);
    } catch (err) {
      console.warn('⚠️  Could not read podcast_only.json, skipping:', err?.message);
    }
  }

  const shiurim = [...primaryShiurim, ...podcastOnly];

  const validShiurim = shiurim.filter((s) => s.audio_recording_link);
  const sortedShiurim = [...validShiurim].sort((a, b) => {
    if (b.english_year !== a.english_year) return (b.english_year || 0) - (a.english_year || 0);
    if (b.global_id !== a.global_id) return (b.global_id || 0) - (a.global_id || 0);
    return (b.shiur_num || 0) - (a.shiur_num || 0);
  });

  const feeds = buildFeedDefinitions(sortedShiurim);

  let written = 0;
  for (const feed of feeds) {
    const feedItems = feed.items
      .map(buildEpisode)
      .filter(Boolean)
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    if (!feedItems.length) continue;

    const feedRelativePath = `${feed.segments.join('/')}.xml`;
    const feedUrl = `${FEED_BASE_URL}/${feedRelativePath}`;
    const filePath = path.join(OUTPUT_DIR, `${feedRelativePath}`);

    const rss = renderRss({
      feedTitle: feed.title,
      feedDescription: feed.description,
      feedUrl,
      items: feedItems,
    });

    writeFeed(filePath, rss);
    written += 1;
    console.log(`✅ wrote ${feedItems.length} episodes -> ${filePath}`);
  }

  console.log(`🎙️  Podcast feeds generated: ${written}`);
  console.log(`📚  Source items -> site: ${primaryShiurim.length}, podcast-only: ${podcastOnly.length}`);
};

try {
  main();
} catch (err) {
  console.error('❌ Error generating podcast feeds:', err);
  process.exitCode = 1;
}

