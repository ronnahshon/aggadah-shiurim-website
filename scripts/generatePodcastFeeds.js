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

// Channel-level constants (shared across all Carmei Zion podcasts)
const PODCAST_AUTHOR = 'כרמי ציון | Carmei Zion';
const PODCAST_EMAIL = process.env.PODCAST_OWNER_EMAIL || 'ronnahshon@gmail.com';
const COVER_ART_URL = process.env.COVER_ART_URL || `${SITE_URL}/favicons/carmei_zion_logo_squared.png`;

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
    description: 'שיעורים מעמיקים בעין יעקב - אגדות הש"ס מאת רון נחשון מקהילת כרמי ציון בקרית גת. In-depth shiurim on Ein Yaakov, the collected Aggadic passages of the Talmud.',
    // author defaults to PODCAST_AUTHOR ("כרמי ציון | Carmei Zion")
    email: 'ronnahshon@gmail.com',
    cover_image: `${SITE_URL}/images/ein_yaakov.png`,
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
      type: 'audio/mpeg',
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
      cover_image = COVER_ART_URL,
      language = DEFAULT_LANGUAGE,
      category = ITUNES_CATEGORY_PRIMARY,
      subcategory = ITUNES_CATEGORY_SECONDARY,
      filter: filterFn,
      preferHebrew = true,
      contentLanguage = 'english',  // 'english' or 'hebrew'
    } = config;

    // Build description with language indicator
    const languageLabel = CONTENT_LANGUAGES[contentLanguage] || CONTENT_LANGUAGES.english;
    const fullDescription = `${description} שפה | Language: ${languageLabel}`;

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

        // Build description - Hebrew first if preferHebrew
        const descParts = [];
        if (preferHebrew) {
          if (shiur.hebrew_title) descParts.push(shiur.hebrew_title);
          if (shiur.english_title) descParts.push(shiur.english_title);
        } else {
          if (shiur.english_title) descParts.push(shiur.english_title);
          if (shiur.hebrew_title) descParts.push(shiur.hebrew_title);
        }
        if (shiur.source_sheet_link) descParts.push(`דף מקורות: ${shiur.source_sheet_link}`);
        // Use speaker name if provided, otherwise fall back to author
        const speakerName = speaker || author;
        const episodeDescription = `${descParts.join(' — ')}. מאת ${speakerName}.`.trim();

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
        cover_image,
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
    cover_image,
    category = ITUNES_CATEGORY_PRIMARY,
    subcategory = ITUNES_CATEGORY_SECONDARY,
  } = seriesMetadata;

  const buildDate = new Date().toUTCString();
  const imageTag = `<itunes:image href="${cover_image}"/>`;
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
const buildEpisodeForSeries = (episode, seriesId, seriesAuthor, seasonOrder = []) => {
  // Episode can provide audio_url directly, or we derive from id
  const enclosureUrl = episode.audio_url || `${S3_BASE_URL}${episode.id}.mp3`;
  if (!enclosureUrl) return null;

  const pubDate = episode.english_year && Number.isFinite(Number(episode.english_year))
    ? new Date(Date.UTC(hebrewToGregorianYear(Number(episode.english_year)) || 2024, 0, 1))
    : FALLBACK_PUBDATE;

  const enclosureLength = estimateEnclosureLength(episode.length);
  const guid = `carmei-zion-${seriesId}-${episode.id}`;

  // No website link for additional series (podcast-only)
  const link = episode.source_sheet_link || SITE_URL;

  const categories = [episode.hebrew_sefer, seriesId].filter(Boolean);

  // Season is based on hebrew_sefer position in season_order, or just 1
  const seasonName = episode.hebrew_sefer || 'אחר';
  const seasonNumber = seasonOrder.indexOf(seasonName) >= 0
    ? seasonOrder.indexOf(seasonName) + 1
    : 1;
  const episodeNumber = episode.shiur_num || 1;

  const descriptionParts = [];
  if (episode.english_title) descriptionParts.push(episode.english_title);
  if (episode.hebrew_title) descriptionParts.push(episode.hebrew_title);
  if (episode.source_sheet_link) descriptionParts.push(`Source sheet: ${episode.source_sheet_link}`);
  const description = `${descriptionParts.join(' — ')}. Presented by ${seriesAuthor}.`.trim();

  return {
    guid,
    link,
    title: episode.hebrew_title || episode.english_title || 'Shiur',
    description,
    pubDate: pubDate.toUTCString(),
    duration: episode.length || '',
    enclosure: {
      url: enclosureUrl,
      type: 'audio/mpeg',
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

      const { series_metadata, episodes, season_order = [] } = data;
      const seriesId = series_metadata.id || file.replace('.json', '');

      // Build episodes
      const feedItems = episodes
        .map((ep) => buildEpisodeForSeries(ep, seriesId, series_metadata.author, season_order))
        .filter(Boolean)
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

      if (!feedItems.length) {
        console.warn(`⚠️  Skipping ${file}: no valid episodes`);
        continue;
      }

      // Generate feed file: public/podcast/carmei-zion/series/<series-id>.xml
      const feedRelativePath = `carmei-zion/series/${slugify(seriesId)}.xml`;
      const feedUrl = `${FEED_BASE_URL}/${feedRelativePath}`;
      const outputPath = path.join(OUTPUT_DIR, feedRelativePath);

      const rss = renderRssForSeries({
        seriesMetadata: series_metadata,
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

