#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import shiurim data
const shiurimDataPath = path.join(__dirname, '../public/data/shiurim_data.json');
const shiurimData = JSON.parse(fs.readFileSync(shiurimDataPath, 'utf8'));

// Base URL - you should update this to your actual domain
const BASE_URL = 'https://midrashaggadah.com';

// Static pages - Darosh Darash Moshe is highest priority content page
const staticPages = [
  { url: '', priority: '1.0', changefreq: 'weekly' },
  { url: '/sefer/darosh-darash-moshe', priority: '0.95', changefreq: 'weekly' },
  { url: '/catalog', priority: '0.9', changefreq: 'weekly' },
  { url: '/podcasts', priority: '0.8', changefreq: 'weekly' },
  { url: '/sefarim', priority: '0.8', changefreq: 'monthly' },
  { url: '/sefer/midrash-haaliyah', priority: '0.8', changefreq: 'monthly' },
  { url: '/sefer/ein-yaakov-commentary', priority: '0.8', changefreq: 'monthly' },
  { url: '/search', priority: '0.8', changefreq: 'daily' },
  { url: '/about', priority: '0.6', changefreq: 'monthly' }
];

const getPodcastSeriesFeedUrls = () => {
  const seriesDir = path.join(__dirname, '../public/podcast/carmei-zion/series');
  if (!fs.existsSync(seriesDir)) return [];
  return fs
    .readdirSync(seriesDir)
    .filter((f) => f.endsWith('.xml'))
    .map((f) => `${BASE_URL}/podcast/carmei-zion/series/${f}`)
    .sort();
};

function generateSitemap() {
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Add static pages
  staticPages.forEach(page => {
    sitemap += `
  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <priority>${page.priority}</priority>
    <changefreq>${page.changefreq}</changefreq>
  </url>`;
  });

  // Add shiur pages
  shiurimData.forEach(shiur => {
    sitemap += `
  <url>
    <loc>${BASE_URL}/shiur/${shiur.id}</loc>
    <priority>0.8</priority>
    <changefreq>yearly</changefreq>
  </url>`;
  });

  // Add podcast feed URLs (series feeds) so crawlers discover them directly.
  const podcastSeriesFeeds = getPodcastSeriesFeedUrls();
  podcastSeriesFeeds.forEach((feedUrl) => {
    sitemap += `
  <url>
    <loc>${feedUrl}</loc>
    <priority>0.7</priority>
    <changefreq>daily</changefreq>
  </url>`;
  });

  // Also include site-level RSS/Atom feeds.
  [
    `${BASE_URL}/rss.xml`,
    `${BASE_URL}/atom.xml`,
  ].forEach((feedUrl) => {
    sitemap += `
  <url>
    <loc>${feedUrl}</loc>
    <priority>0.6</priority>
    <changefreq>daily</changefreq>
  </url>`;
  });

  sitemap += `
</urlset>`;

  return sitemap;
}

function saveSitemap() {
  const sitemap = generateSitemap();
  const outputPath = path.join(__dirname, '../public/sitemap.xml');
  
  fs.writeFileSync(outputPath, sitemap, 'utf8');
  console.log(`✅ Sitemap generated successfully at ${outputPath}`);
  console.log(`📊 Total URLs: ${staticPages.length + shiurimData.length}`);
  console.log(`   - Static pages: ${staticPages.length}`);
  console.log(`   - Shiur pages: ${shiurimData.length}`);
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  saveSitemap();
}

export { generateSitemap, saveSitemap }; 