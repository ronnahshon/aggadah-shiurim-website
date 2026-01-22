#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const DATA_PATH = path.join(ROOT_DIR, 'public/data/shiurim_data.json');
const PODCAST_ONLY_DATA_PATH = path.join(ROOT_DIR, 'public/data/podcast_only.json'); // optional
const OTHER_SERIES_DIR = path.join(ROOT_DIR, 'public/data/other_shiurim_carmei_zion'); // additional series
const OUTPUT_DIR = path.join(ROOT_DIR, 'public/podcast');

// Allow overriding for previews (e.g., ngrok) so assets resolve correctly in validators.
const SITE_URL = process.env.SITE_URL || 'https://www.midrashaggadah.com';
const FEED_BASE_URL = process.env.FEED_BASE_URL || `${SITE_URL}/podcast`;
// Optional cache-buster for podcast artwork URLs. Some aggregators cache show art
// aggressively; bump this value (e.g. 2026-01-19) to force a refresh.
const PODCAST_ARTWORK_VERSION = process.env.PODCAST_ARTWORK_VERSION || '2026-01-20';

// Channel-level constants (shared across all Carmei Zion podcasts)
const PODCAST_AUTHOR = 'כרמי ציון | Carmei Zion';
const PODCAST_EMAIL = process.env.PODCAST_OWNER_EMAIL || 'ronnahshon@gmail.com';
const COVER_ART_URL = process.env.COVER_ART_URL || `${SITE_URL}/favicons/carmei_zion_logo_2048_2048.png`;

// Per-podcast artwork (stored in /public/images/artwork_for_podcasts).
// Filenames are ASCII to avoid encoding edge cases in some podcast clients/CDNs.
const PODCAST_ARTWORK_FILENAMES = {
  gemara_beiyyun: 'gemara_beiyyun.jpeg',
  daf_yomi: 'daf_yomi.jpeg',
  shiurim_meyuhadim: 'shiurim_meyuhadim.jpeg',
  ein_yaakov: 'ein_yaakov.jpeg',
  // derived podcast id uses a dash, but the requested key is underscore
  'ein-yaakov': 'ein_yaakov.jpeg',
};

const buildArtworkUrl = (filename) =>
  `${SITE_URL}/images/artwork_for_podcasts/${encodeURIComponent(String(filename || ''))}`;

const withArtworkVersion = (url) => {
  if (!PODCAST_ARTWORK_VERSION) return url;
  try {
    const u = new URL(String(url));
    u.searchParams.set('v', PODCAST_ARTWORK_VERSION);
    return u.toString();
  } catch {
    return url;
  }
};

const getCoverImageForPodcastId = (podcastId) => {
  const raw = String(podcastId || '').trim();
  if (!raw) return null;

  const direct = PODCAST_ARTWORK_FILENAMES[raw];
  if (direct) return buildArtworkUrl(direct);

  // Try common normalization between ids that use '-' vs '_'
  const underscore = raw.replace(/-/g, '_');
  const dash = raw.replace(/_/g, '-');
  const normalized =
    PODCAST_ARTWORK_FILENAMES[underscore] ||
    PODCAST_ARTWORK_FILENAMES[dash];

  return normalized ? buildArtworkUrl(normalized) : null;
};

/**
 * DERIVED PODCASTS CONFIGURATION
 * 
 * These are podcasts auto-generated from shiurim_data.json with filters.
 * Each entry creates a separate podcast feed with its own title, author, etc.
 * 
 * The filter function determines which shiurim from shiurim_data.json are included.
 */
// Content language options for podcast descriptions
const CONTENT_LANGUAGES = {
  english: 'אנגלית | English',
  hebrew: 'עברית | Hebrew',
};

const DERIVED_PODCASTS = [
  {
    id: 'ein-yaakov',
    title: 'אגדות הש״ס - עין יעקב | רון נחשון',
    description: 'שיעורים מעמיקים בעין יעקב - אגדות הש"ס מאת רון נחשון מקהילת כרמי ציון בקרית גת.\n\nIn-depth shiurim on Ein Yaakov, the collected Aggadic passages of the Talmud.\n\nFor more please visit <a href="https://www.midrashaggadah.com">www.midrashaggadah.com</a>',
    // author defaults to PODCAST_AUTHOR ("כרמי ציון | Carmei Zion")
    email: 'ronnahshon@gmail.com',
    // cover_image defaults to COVER_ART_URL (carmei_zion_logo_2048_2048.png)
    language: 'he',
    category: 'Religion & Spirituality',
    subcategory: 'Judaism',
    // Speaker name for episode descriptions
    speaker: 'רון נחשון',
    // Content language: 'english' (default) or 'hebrew'
    contentLanguage: 'english',
    // Filter function: only include shiurim where category === 'ein_yaakov'
    filter: (shiur) => shiur.category === 'ein_yaakov',
  },
  // Add more derived podcasts here as needed, e.g.:
  // {
  //   id: 'tanach',
  //   title: 'כרמי ציון: תנ"ך | Carmei Zion: Tanach',
  //   description: '...',
  //   filter: (shiur) => shiur.category === 'tanach',
  //   // contentLanguage: 'english' is the default, set to 'hebrew' for Hebrew content
  // },
];

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
 * Normalize a Gregorian publication year.
 *
 * IMPORTANT: `public/data/shiurim_data.json` stores `english_year` as a Gregorian year
 * (e.g. 2026), so we do not perform Hebrew->Gregorian conversion here anymore.
 *
 * We keep the input validation strict to avoid silently producing incorrect dates.
 */
const normalizeGregorianYear = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n >= 1900 && n <= 2100) return n;
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

// Apple Podcasts and other clients can drop items if enclosure URLs contain raw
// non-ASCII characters or spaces. Normalize to a properly-encoded absolute URL.
const normalizeEnclosureUrl = (value) => {
  if (!isHttpUrl(value)) return value;
  try {
    return new URL(value).href;
  } catch {
    return value;
  }
};

// Encode S3 object keys safely for use in URLs (encode each segment, keep "/").
const encodeS3KeyForUrl = (key) =>
  String(key || '')
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');

// Build a public S3 URL for a PDF source sheet.
const buildSourceSheetPdfUrl = (s3Key) => {
  const key = String(s3Key || '').trim();
  if (!key) return '';
  return `${S3_BASE_URL}${encodeS3KeyForUrl(key)}`;
};

// For Ein Yaakov shiurim, source sheets are stored under source_sheets/<shiur.id>.pdf
const getEinYaakovSourceSheetPdfUrl = (shiurId) =>
  buildSourceSheetPdfUrl(`source_sheets/${String(shiurId || '').trim()}.pdf`);

// For additional series, attachments are stored under "<folder>-sources/<basename>.pdf"
// where basename matches the audio filename without extension.
const SERIES_SOURCE_SHEETS_PREFIX = {
  daf_yomi: 'carmei_zion_daf_yomi-sources/',
  gemara_beiyyun: 'carmei_zion_gemara_beiyyun-sources/',
  shiurim_meyuhadim: 'carmei_zion_shiurim_meyuhadim-sources/',
};

const getAdditionalSeriesSourceSheetPdfUrl = (seriesId, episodeId) => {
  const prefix = SERIES_SOURCE_SHEETS_PREFIX[String(seriesId || '').trim()];
  if (!prefix) return '';
  const base = String(episodeId || '').split('/').pop();
  if (!base) return '';
  return buildSourceSheetPdfUrl(`${prefix}${base}.pdf`);
};

// Enclosure MIME type should match the actual media container. Using audio/mpeg
// for .m4a can cause Apple Podcasts to ignore the episode.
const mimeTypeFromUrl = (value) => {
  const v = String(value || '').toLowerCase();
  if (v.includes('.m4a')) return 'audio/x-m4a';
  if (v.includes('.mp4')) return 'audio/mp4';
  if (v.includes('.mp3')) return 'audio/mpeg';
  if (v.includes('.aac')) return 'audio/aac';
  if (v.includes('.wav')) return 'audio/wav';
  // Safe fallback
  return 'audio/mpeg';
};

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

// For additional-series feed filenames, prefer preserving ids that are already URL-safe.
// This is important for ids with underscores like `gemara_beiyyun`, where slugify() would
// otherwise change `_` to `-` and break the expected feed filename.
const seriesIdToFilename = (seriesId) => {
  const raw = String(seriesId || '').trim();
  if (/^[a-zA-Z0-9_-]+$/.test(raw)) return raw;
  return slugify(raw);
};

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

// Parse a per-episode date used for RSS pubDate ordering.
// Supported inputs:
// - "YYYY-MM-DD" (treated as UTC midnight)
// - "YYYY-MM-DDTHH:mm:ssZ" (any Date.parse()-compatible string)
// - 8-digit number or string "YYYYMMDD"
const parseEnglishDateToDate = (value) => {
  if (!value) return null;

  // YYYYMMDD as number or string
  const compact = typeof value === 'number' ? String(value) : (typeof value === 'string' ? value.trim() : '');
  if (/^\d{8}$/.test(compact)) {
    const year = Number(compact.slice(0, 4));
    const month = Number(compact.slice(4, 6));
    const day = Number(compact.slice(6, 8));
    if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(Date.UTC(year, month - 1, day));
    }
  }

  if (typeof value === 'string') {
    const v = value.trim();
    // YYYY-MM-DD (UTC midnight)
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    if (m) {
      const year = Number(m[1]);
      const month = Number(m[2]);
      const day = Number(m[3]);
      if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return new Date(Date.UTC(year, month - 1, day));
      }
    }

    // Datetime string (let JS parse, but only accept valid date)
    const t = Date.parse(v);
    if (!Number.isNaN(t)) return new Date(t);
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
  // Prefer per-episode date (more granular ordering in podcast apps)
  const parsedDate = parseEnglishDateToDate(shiur.english_date);
  if (parsedDate) return parsedDate;

  const gregorianYear = normalizeGregorianYear(shiur.english_year);
  if (gregorianYear) return new Date(Date.UTC(gregorianYear, 0, 1));
  return FALLBACK_PUBDATE;
};

const buildDescription = (shiur) => {
  const pieces = [];
  if (shiur.english_title) pieces.push(shiur.english_title);
  if (shiur.hebrew_title) pieces.push(shiur.hebrew_title);
  // Avoid publishing editable Google Doc links in podcast metadata.
  if (shiur.source_sheet_link) {
    const pdfUrl = getEinYaakovSourceSheetPdfUrl(shiur.id);
    if (pdfUrl) pieces.push(`Source sheet (PDF): ${pdfUrl}`);
  }
  return `${pieces.join(' — ')}. Presented by ${PODCAST_AUTHOR}.`.trim();
};

// Build a mapping of hebrew_sefer to season numbers
// This is populated dynamically based on the shiurim data
let seferToSeasonMap = new Map();

// Custom season order: Talmud tractates in traditional order, then Torah books, then Tanna Devei Eliyahu
const SEFER_ORDER = [
  // Seder Nashim
  'יבמות',
  // Seder Nezikin (in traditional order)
  'בבא קמא',
  'בבא מציעא',
  'בבא בתרא',
  'סנהדרין',
  'מכות',
  'שבועות',
  'עבודה זרה',
  'הוריות',
  // Seder Kodashim (in traditional order)
  'זבחים',
  'מנחות',
  'חולין',
  'בכורות',
  'ערכין',
  'תמורה',
  'כריתות',
  'מעילה',
  // Seder Toharot
  'נדה',
  // Torah (Chumash) in order
  'בראשית',
  'שמות',
  'ויקרא',
  'במדבר',
  'דברים',
  // Midrash - last
  'תנא דבי אליהו רבה',
];

const buildSeferSeasonMap = (shiurim) => {
  // Get unique sefarim that actually exist in the data
  const existingSefarim = new Set();
  for (const s of shiurim) {
    const sefer = s.hebrew_sefer || 'אחר';
    existingSefarim.add(sefer);
  }
  
  seferToSeasonMap = new Map();
  let seasonNumber = 1;
  
  // First, add sefarim in the predefined order
  for (const sefer of SEFER_ORDER) {
    if (existingSefarim.has(sefer)) {
      seferToSeasonMap.set(sefer, seasonNumber);
      seasonNumber++;
      existingSefarim.delete(sefer);
    }
  }
  
  // Add any remaining sefarim not in the predefined list (at the end)
  for (const sefer of existingSefarim) {
    seferToSeasonMap.set(sefer, seasonNumber);
    seasonNumber++;
  }
  
  return seferToSeasonMap;
};

const buildEpisode = (shiur) => {
  const enclosureUrl = normalizeEnclosureUrl(buildAudioUrlFromShiur(shiur));
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

  // Get season number based on hebrew_sefer
  const sefer = shiur.hebrew_sefer || 'אחר';
  const seasonNumber = seferToSeasonMap.get(sefer) || 1;
  
  // Use shiur_num as episode number within the sefer, fallback to global_id
  const episodeNumber = shiur.shiur_num || shiur.global_id || 1;

  return {
    guid,
    link,
    title: shiur.hebrew_title || shiur.english_title || 'Shiur',
    description: buildDescription(shiur),
    pubDate: pubDate.toUTCString(),
    duration: shiur.length || '',
    enclosure: {
      url: enclosureUrl,
      type: mimeTypeFromUrl(enclosureUrl),
      length: enclosureLength,
    },
    categories,
    // Season/series info based on hebrew_sefer
    season: seasonNumber,
    seasonName: sefer,
    episode: episodeNumber,
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
  const coverImage = withArtworkVersion(COVER_ART_URL);
  const imageTag = `<itunes:image href="${coverImage}"/>`;
  const podcastImageTag = `<podcast:image href="${coverImage}"/>`;
  const rssImageTag = `<image>
    <url>${coverImage}</url>
    <title><![CDATA[${feedTitle}]]></title>
    <link>${SITE_URL}</link>
  </image>`;
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
    ${podcastImageTag}
    ${rssImageTag}
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
      ${item.season ? `<itunes:season>${item.season}</itunes:season>` : ''}
      ${item.season && item.seasonName ? `<podcast:season name="${item.seasonName}">${item.season}</podcast:season>` : ''}
      ${item.episode ? `<itunes:episode>${item.episode}</itunes:episode>` : ''}
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

  // NOTE: We intentionally do NOT generate a "catch-all" feed (carmei-zion/all.xml).
  // This helps avoid a single umbrella feed being submitted to directories.

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
  
  // Build the sefer-to-season mapping before creating episodes
  buildSeferSeasonMap(validShiurim);
  console.log(`📚 Season mapping created: ${seferToSeasonMap.size} sefarim as seasons`);
  
  const sortedShiurim = [...validShiurim].sort((a, b) => {
    if (b.english_year !== a.english_year) return (b.english_year || 0) - (a.english_year || 0);
    if (b.global_id !== a.global_id) return (b.global_id || 0) - (a.global_id || 0);
    return (b.shiur_num || 0) - (a.shiur_num || 0);
  });

  console.log(`📚 Source items -> site: ${primaryShiurim.length}, podcast-only: ${podcastOnly.length}`);

  // Generate derived podcasts (Ein Yaakov, etc.) from shiurim_data.json with filters
  const derivedWritten = processDerivedPodcasts(sortedShiurim);
  console.log(`🎙️  Derived podcasts generated: ${derivedWritten}`);

  // Process additional series from other_shiurim_carmei_zion directory
  const additionalWritten = processOtherSeries();
  console.log(`🎙️  Additional series feeds generated: ${additionalWritten}`);
};

/**
 * Process derived podcasts - these are filtered from shiurim_data.json
 * with custom titles, authors, etc.
 */
const processDerivedPodcasts = (allShiurim) => {
  let written = 0;

  for (const config of DERIVED_PODCASTS) {
    const {
      id,
      title,
      description,
      author = PODCAST_AUTHOR,  // defaults to "כרמי ציון | Carmei Zion"
      speaker,                   // speaker name for episode descriptions (e.g., "רון נחשון")
      email = PODCAST_EMAIL,
      cover_image,
      language = DEFAULT_LANGUAGE,
      category = ITUNES_CATEGORY_PRIMARY,
      subcategory = ITUNES_CATEGORY_SECONDARY,
      filter: filterFn,
      preferHebrew = true,
      contentLanguage = 'english',  // 'english' or 'hebrew'
    } = config;

    const resolvedCoverImage =
      cover_image ||
      getCoverImageForPodcastId(id) ||
      COVER_ART_URL;

    // Build description with language indicator (language line first for better "About" formatting in apps).
    const languageLabel = CONTENT_LANGUAGES[contentLanguage] || CONTENT_LANGUAGES.english;
    const fullDescription = `שפה | Language: ${languageLabel}\n\n${description}`;

    // Filter shiurim using the config's filter function
    const filteredShiurim = allShiurim.filter(filterFn);

    if (!filteredShiurim.length) {
      console.warn(`⚠️  No shiurim matched filter for derived podcast: ${id}`);
      continue;
    }

    // Build season map for this subset
    const derivedSeferMap = new Map();
    const existingSefarim = new Set();
    for (const s of filteredShiurim) {
      existingSefarim.add(s.hebrew_sefer || 'אחר');
    }
    let seasonNum = 1;
    for (const sefer of SEFER_ORDER) {
      if (existingSefarim.has(sefer)) {
        derivedSeferMap.set(sefer, seasonNum++);
        existingSefarim.delete(sefer);
      }
    }
    for (const sefer of existingSefarim) {
      derivedSeferMap.set(sefer, seasonNum++);
    }

    // Build episodes with custom author in description
    const feedItems = filteredShiurim
      .map((shiur) => {
        const enclosureUrl = buildAudioUrlFromShiur(shiur);
        if (!enclosureUrl) return null;
        
        const pubDate = buildPubDate(shiur);
        const enclosureLength = estimateEnclosureLength(shiur.length);
        const guid = `carmei-zion-${id}-${shiur.id}`;
        const link = `${SITE_URL}/shiur/${shiur.id}`;
        
        // Use Hebrew or English values based on preferHebrew setting
        const categories = preferHebrew
          ? [shiur.hebrew_sefer, shiur.sub_category, shiur.category].filter(Boolean)
          : [formatTitle(shiur.category), formatTitle(shiur.sub_category), formatTitle(shiur.english_sefer)].filter(Boolean);

        const sefer = shiur.hebrew_sefer || 'אחר';
        const seasonNumber = derivedSeferMap.get(sefer) || 1;
        const episodeNumber = shiur.shiur_num || shiur.global_id || 1;

        // Build description with line breaks (Spotify renders newlines well in CDATA).
        // Requested format:
        // Hebrew title
        //
        // English title
        //
        // דף מקורות: <url>.
        //
        // Presented by <speaker>.
        const descriptionLines = [];
        if (preferHebrew) {
          if (shiur.hebrew_title) descriptionLines.push(shiur.hebrew_title);
          if (shiur.english_title) descriptionLines.push(shiur.english_title);
        } else {
          if (shiur.english_title) descriptionLines.push(shiur.english_title);
          if (shiur.hebrew_title) descriptionLines.push(shiur.hebrew_title);
        }
        // Use speaker name if provided, otherwise fall back to author
        const speakerName = speaker || author;
        descriptionLines.push(`Presented by ${speakerName}.`);

        // Put the source sheet at the very bottom, with an extra blank line
        // separating it from the "Presented by ..." line.
        const sourceSheetLine = shiur.source_sheet_link
          ? (() => {
              const pdfUrl = getEinYaakovSourceSheetPdfUrl(shiur.id);
              return pdfUrl ? `Source Sheet (PDF): ${pdfUrl}.` : '';
            })()
          : '';
        let episodeDescription = descriptionLines.filter(Boolean).join('\n\n').trim();
        if (sourceSheetLine) {
          // extra blank line between Presented by and the source sheet
          episodeDescription = `${episodeDescription}\n\n\n${sourceSheetLine}`.trim();
        }

        // Episode title - Hebrew first if preferHebrew
        const episodeTitle = preferHebrew
          ? (shiur.hebrew_title || shiur.english_title || 'שיעור')
          : (shiur.hebrew_title || shiur.english_title || 'Shiur');

        return {
          guid,
          link,
          title: episodeTitle,
          description: episodeDescription,
          pubDate: pubDate.toUTCString(),
          duration: shiur.length || '',
          enclosure: {
            url: enclosureUrl,
            type: 'audio/mpeg',
            length: enclosureLength,
          },
          categories,
          season: seasonNumber,
          seasonName: sefer,
          episode: episodeNumber,
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    if (!feedItems.length) continue;

    // Generate feed file: public/podcast/carmei-zion/series/<id>.xml
    const feedRelativePath = `carmei-zion/series/${id}.xml`;
    const feedUrl = `${FEED_BASE_URL}/${feedRelativePath}`;
    const outputPath = path.join(OUTPUT_DIR, feedRelativePath);

    const rss = renderRssForSeries({
      seriesMetadata: {
        title,
        description: fullDescription,
        author,
        email,
        cover_image: resolvedCoverImage,
        language,
        category,
        subcategory,
      },
      feedUrl,
      items: feedItems,
    });

    writeFeed(outputPath, rss);
    written += 1;
    console.log(`✅ Derived podcast [${id}]: wrote ${feedItems.length} episodes -> ${outputPath}`);
  }

  return written;
};

/**
 * Render RSS feed with custom series metadata (for additional series).
 */
const renderRssForSeries = ({ seriesMetadata, feedUrl, items }) => {
  const {
    title,
    description,
    language = DEFAULT_LANGUAGE,
    author,
    email,
    cover_image = COVER_ART_URL,
    category = ITUNES_CATEGORY_PRIMARY,
    subcategory = ITUNES_CATEGORY_SECONDARY,
  } = seriesMetadata;

  const buildDate = new Date().toUTCString();
  const coverImage = withArtworkVersion(cover_image);
  const imageTag = `<itunes:image href="${coverImage}"/>`;
  const podcastImageTag = `<podcast:image href="${coverImage}"/>`;
  const rssImageTag = `<image>
    <url>${coverImage}</url>
    <title><![CDATA[${title}]]></title>
    <link>${SITE_URL}</link>
  </image>`;
  const categoryPrimary = escapeAttr(category);
  const categorySecondary = escapeAttr(subcategory);

  // Ensure description is at least 50 characters for podcast validators
  const minDescLength = 50;
  const paddedDescription = description.length >= minDescLength
    ? description
    : `${description} Torah shiurim and Jewish learning from Israel.`;

  const header = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <title><![CDATA[${title}]]></title>
    <link>${SITE_URL}</link>
    <description><![CDATA[${paddedDescription}]]></description>
    <language>${language}</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <pubDate>${buildDate}</pubDate>
    <ttl>${TTL_MINUTES}</ttl>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <itunes:author><![CDATA[${author}]]></itunes:author>
    <itunes:summary><![CDATA[${paddedDescription}]]></itunes:summary>
    <itunes:category text="${categoryPrimary}">
      <itunes:category text="${categorySecondary}"/>
    </itunes:category>
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    <itunes:owner>
      <itunes:name><![CDATA[${author}]]></itunes:name>
      <itunes:email>${email}</itunes:email>
    </itunes:owner>
    ${imageTag}
    ${podcastImageTag}
    ${rssImageTag}
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
        .map((cat) => `      <category><![CDATA[${cat}]]></category>`)
        .join('\n')}
      <itunes:author><![CDATA[${author}]]></itunes:author>
      <itunes:episodeType>full</itunes:episodeType>
      <itunes:explicit>no</itunes:explicit>
      ${item.season ? `<itunes:season>${item.season}</itunes:season>` : ''}
      ${item.season && item.seasonName ? `<podcast:season name="${item.seasonName}">${item.season}</podcast:season>` : ''}
      ${item.episode ? `<itunes:episode>${item.episode}</itunes:episode>` : ''}
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

/**
 * Build an episode object from a series episode entry.
 * Series episodes have a different format than shiurim_data.json entries.
 */
const buildEpisodeForSeries = (episode, seriesId, seriesGuidId, defaultSpeaker, seasonOrder = []) => {
  // Episode can provide audio_url directly, or we derive from id
  const enclosureUrl = normalizeEnclosureUrl(episode.audio_url || `${S3_BASE_URL}${episode.id}.mp3`);
  if (!enclosureUrl) return null;

  // Prefer a combined bilingual title when both are present: "English | Hebrew"
  // (Used for additional series feeds like daf_yomi, gemara_beiyyun, shiurim_meyuhadim.)
  const buildBilingualEpisodeTitle = (ep) => {
    const en = typeof ep?.english_title === 'string' ? ep.english_title.trim() : '';
    const he = typeof ep?.hebrew_title === 'string' ? ep.hebrew_title.trim() : '';
    if (en && he) return `${en} | ${he}`;
    return he || en || 'Shiur';
  };

  // Prefer per-episode date (more granular ordering in podcast apps)
  const parsedDate = parseEnglishDateToDate(episode.english_date);
  const pubDate = parsedDate
    ? parsedDate
    : (() => {
      const gregorianYear = normalizeGregorianYear(episode.english_year);
      return gregorianYear ? new Date(Date.UTC(gregorianYear, 0, 1)) : FALLBACK_PUBDATE;
    })();

  const enclosureLength = estimateEnclosureLength(episode.length);
  // GUID stability matters for podcast clients. Allow overriding the GUID prefix id so we can
  // rename a series id (e.g. daf-yomi -> daf_yomi) without re-importing duplicate episodes.
  const guidPrefix = seriesGuidId || seriesId;
  const guid = `carmei-zion-${guidPrefix}-${episode.id}`;

  // No website link for additional series (podcast-only).
  // Also avoid publishing editable Google Doc links: prefer S3 PDF if we can derive it.
  const derivedPdfUrl = getAdditionalSeriesSourceSheetPdfUrl(seriesId, episode.id);
  const link = episode.link || derivedPdfUrl || SITE_URL;

  const categories = [episode.hebrew_sefer, seriesId].filter(Boolean);

  // Season is based on hebrew_sefer position in season_order, or just 1
  const seasonName = episode.hebrew_sefer || 'אחר';
  const seasonNumber = seasonOrder.indexOf(seasonName) >= 0
    ? seasonOrder.indexOf(seasonName) + 1
    : 1;
  const episodeNumber = episode.shiur_num || 1;

  const episodeSpeaker = episode.speaker || defaultSpeaker || PODCAST_AUTHOR;

  // Build a multiline description so apps render this cleanly, and include Source Sheet when present.
  const descriptionLines = [];
  const titleLine = [episode.english_title, episode.hebrew_title].filter(Boolean).join(' | ').trim();
  if (titleLine) descriptionLines.push(titleLine);
  descriptionLines.push(`Presented by ${episodeSpeaker}.`);
  if (episode.source_sheet_link) {
    const pdfUrl = derivedPdfUrl || getAdditionalSeriesSourceSheetPdfUrl(seriesId, episode.id);
    if (pdfUrl) descriptionLines.push(`Source Sheet (PDF): ${pdfUrl}`);
  }
  const description = descriptionLines.filter(Boolean).join('\n\n').trim();

  return {
    guid,
    link,
    title: buildBilingualEpisodeTitle(episode),
    description,
    pubDate: pubDate.toUTCString(),
    duration: episode.length || '',
    enclosure: {
      url: enclosureUrl,
      type: mimeTypeFromUrl(enclosureUrl),
      length: enclosureLength,
    },
    categories,
    season: seasonNumber,
    seasonName,
    episode: episodeNumber,
  };
};

/**
 * Process additional series from the other_shiurim_carmei_zion directory.
 * Each JSON file (except _template.json) becomes a separate podcast feed.
 */
const processOtherSeries = () => {
  if (!fs.existsSync(OTHER_SERIES_DIR)) {
    console.log('📂 No other_shiurim_carmei_zion directory found, skipping additional series.');
    return 0;
  }

  const files = fs.readdirSync(OTHER_SERIES_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('_'));

  if (files.length === 0) {
    console.log('📂 No series files found in other_shiurim_carmei_zion directory.');
    return 0;
  }

  let written = 0;

  for (const file of files) {
    const filePath = path.join(OTHER_SERIES_DIR, file);
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw);

      if (!data.series_metadata || !data.episodes) {
        console.warn(`⚠️  Skipping ${file}: missing series_metadata or episodes`);
        continue;
      }

      const { series_metadata, episodes, season_order = [], contentLanguage = 'english', speaker } = data;
      const seriesId = series_metadata.id || file.replace('.json', '');
      const seriesGuidId = series_metadata.guid_id || series_metadata.legacy_id || seriesId;
      const seriesAuthor = series_metadata.author || PODCAST_AUTHOR;
      const seriesSpeaker = speaker || seriesAuthor;
      const resolvedCoverImage =
        series_metadata.cover_image ||
        getCoverImageForPodcastId(seriesId) ||
        COVER_ART_URL;

      // Build episodes
      const feedItems = episodes
        .map((ep) => buildEpisodeForSeries(ep, seriesId, seriesGuidId, seriesSpeaker, season_order))
        .filter(Boolean)
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

      if (!feedItems.length) {
        console.warn(`⚠️  Skipping ${file}: no valid episodes`);
        continue;
      }

      // Build description with language indicator.
      // Put the language line first (better "About" formatting in podcast apps).
      const languageLabel = CONTENT_LANGUAGES[contentLanguage] || CONTENT_LANGUAGES.english;
      const fullDescription = `שפה | Language: ${languageLabel}\n\n${series_metadata.description}`;

      // Generate feed file: public/podcast/carmei-zion/series/<series-id>.xml
      const feedRelativePath = `carmei-zion/series/${seriesIdToFilename(seriesId)}.xml`;
      const feedUrl = `${FEED_BASE_URL}/${feedRelativePath}`;
      const outputPath = path.join(OUTPUT_DIR, feedRelativePath);

      const rss = renderRssForSeries({
        seriesMetadata: {
          ...series_metadata,
          description: fullDescription,
          author: seriesAuthor,
          cover_image: resolvedCoverImage,
        },
        feedUrl,
        items: feedItems,
      });

      writeFeed(outputPath, rss);
      written += 1;
      console.log(`✅ Additional series: wrote ${feedItems.length} episodes -> ${outputPath}`);

    } catch (err) {
      console.error(`❌ Error processing ${file}:`, err?.message);
    }
  }

  return written;
};

try {
  main();
} catch (err) {
  console.error('❌ Error generating podcast feeds:', err);
  process.exitCode = 1;
}

