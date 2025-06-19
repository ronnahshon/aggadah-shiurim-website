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

// Static pages - Darosh Darash Moshe is highest priority content page
const staticPages = [
  { url: '', priority: '1.0', changefreq: 'weekly' },
  { url: '/sefer/darosh-darash-moshe', priority: '0.95', changefreq: 'weekly' },
  { url: '/catalog', priority: '0.9', changefreq: 'weekly' },
  { url: '/sefarim', priority: '0.8', changefreq: 'monthly' },
  { url: '/sefer/midrash-haaliyah', priority: '0.8', changefreq: 'monthly' },
  { url: '/search', priority: '0.7', changefreq: 'monthly' },
  { url: '/about', priority: '0.6', changefreq: 'monthly' }
];

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