# Midrash Aggadah Website

A comprehensive React-based website for exploring midrash aggadah, featuring shiurim, source texts, and sefarim. Built with modern web technologies including React, TypeScript, Vite, and Tailwind CSS. 

Claude-4-Sonnet was used to write the initial code. It was first given a Prompt and Product Requirements Document (PRD) - which can be found in public/docs - to generate the base website structure, and then further improvements and changes were made via discussions with the model's 'Agent' mode.

**LAST UPDATE: JAN 2026**

## 🎙️ Podcast Feeds (Carmei Zion)
- Primary feed URL (production): `https://www.midrashaggadah.com/podcast/carmei-zion/all.xml`
- Artwork: `public/favicons/carmei_zion_logo_squared.png` (square, 1400–3000px; default cover art).
- Generation: `scripts/generatePodcastFeeds.js` runs in `npm run build` and outputs under `public/podcast/...` (per category/subcategory/sefer).
- Audio URLs: derived from S3 `audio/<shiur.id>.mp3` (matching site playback). `audio_recording_link` can override if it’s already a direct URL (non-GDrive).
- Podcast-only entries: add to `public/data/podcast_only.json` (same schema as `shiurim_data.json`) to include in feeds without showing on the site.
- Preview/validation: you can override host/art URLs via env:
  - `SITE_URL` and `FEED_BASE_URL` for self links (e.g., ngrok)
  - `COVER_ART_URL` if you need a different art host during validation
- Midrash shiurim are also available for streaming via the קהילת כרמי ציון | Carmei Zion podcast:
  - Apple: https://apple.co/3MSLcEH
  - Amazon: https://amzn.to/3L9MMl0
  - Spotify: https://bit.ly/cz-spotify
  - YouTube: https://bit.ly/cz-youtube


## 🏗️ Website Structure & Code Organization

### Main Page Components (`src/pages/`)
- **`HomePage.tsx`** - Landing page with featured content and navigation
- **`CatalogPage.tsx`** - Browse all shiurim organized by category/sefer
- **`ShiurPage.tsx`** - Individual shiur display with audio player and source sheets
- **`SearchPage.tsx`** - Search functionality across all content
- **`SefarimPage.tsx`** - Overview of available sefarim
- **`SeferPage.tsx`** - Individual sefer display (generic)
- **`DaroshDarashMoshePage.tsx`** - Featured sefer with enhanced formatting
- **`MidrashHaaliyahPage.tsx`** - Full midrash text display
- **`EinYaakovCommentaryPage.tsx`** - Ein Yaakov commentary display
- **`AboutPage.tsx`** - About page with website information
- **`NotFound.tsx`** - 404 error page

### Core Components
- **`src/components/layout/`** - Layout components (Sidebar, Layout wrapper)
- **`src/components/seo/`** - SEO components (SEOHead, BlogSchema)
- **`src/components/common/`** - Shared components (AudioPlayer, DocumentViewer, etc.)
- **`src/components/ui/`** - UI components from shadcn/ui

### Data & Content
- **`public/data/shiurim_data.json`** - Main shiurim database (238+ entries)
- **`public/sefarim/`** - Markdown files for sefarim content
- **`public/sefer/`** - Static HTML pages for sefarim
- **`src/utils/`** - Utility functions for data processing, SEO, and parsing

### Routing Structure (`src/App.tsx`)
```
/ - Homepage
/catalog - Browse all shiurim
/search - Search functionality
/shiur/:shiurId - Individual shiur page
/sefarim - Sefarim overview
/sefer/:seferId - Generic sefer page
/sefer/darosh-darash-moshe - Featured sefer (special layout)
/sefer/midrash-haaliyah - Midrash HaAliyah
/sefer/ein-yaakov-commentary - Ein Yaakov Commentary
/about - About page
```

## 📝 Adding Content to the Website

### Adding a New Shiur

1. **Update the data file** (`public/data/shiurim_data.json`):
   ```json
   {
     "id": "unique-shiur-id",
     "global_id": 999,
     "shiur_num": 1,
     "category": "ein_yaakov",
     "sub_category": "seder_nashim",
     "english_sefer": "yevamot",
     "english_title": "Your Shiur Title",
     "hebrew_sefer": "יבמות",
     "hebrew_title": "Hebrew Title",
     "source_sheet_link": "https://docs.google.com/...",
     "audio_recording_link": "https://drive.google.com/...",
     "tags": ["relevant", "tags"],
     "hebrew_year": "תשפ״ה",
     "english_year": 5785,
     "length": "25:30"
   }
   ```

2. **Add the source sheet and audio to AWS S3**
- There are two objects in S3, "audio" and "source_sheets"
- Use the same naming convention as the existing files for it to work
- Link: https://eu-north-1.console.aws.amazon.com/s3/buckets/midrash-aggadah?region=eu-north-1&bucketType=general&tab=objects

3. **Regenerate sitemap**:
   ```bash
   npm run sitemap
   ```

4. **Build and deploy** to ensure SEO updates are applied.

### Adding a New Page

1. **Create the page component** in `src/pages/YourPage.tsx`:
   ```tsx
   import React from 'react';
   import SEOHead from '@/components/seo/SEOHead';
   
   const YourPage: React.FC = () => {
     return (
       <>
         <SEOHead
           title="Your Page Title"
           description="Your page description"
           keywords={['relevant', 'keywords']}
         />
         <div className="container mx-auto px-4 py-8">
           {/* Your content */}
         </div>
       </>
     );
   };
   
   export default YourPage;
   ```

2. **Add route to App.tsx**:
   ```tsx
   const YourPage = React.lazy(() => import("./pages/YourPage"));
   
   // In Routes:
   <Route path="/your-page" element={<Layout><YourPage /></Layout>} />
   ```

3. **Update sitemap** in `scripts/generateSitemap.js`:
   ```javascript
   const staticPages = [
     // ... existing pages
     { url: '/your-page', priority: '0.8', changefreq: 'monthly' }
   ];
   ```

### Adding a New Sefer

1. **Create markdown file** in `public/sefarim/your-sefer.md`:
   ```markdown
   # Your Sefer Title
   
   ## Chapter 1
   Content here...
   ```

2. **Create parser utility** in `src/utils/yourSeferParser.ts` (follow existing patterns)

3. **Create page component** in `src/pages/YourSeferPage.tsx`

4. **Add route and navigation** as above

5. **Update SEO** in `src/utils/seoUtils.ts` with sefer-specific metadata

## 📱 Desktop vs Mobile Differences

### Mobile Adaptations (`src/hooks/use-mobile.tsx`)
- **Breakpoint**: 768px (Tailwind's `md` breakpoint)
- **Sidebar**: Collapses to minimal width on mobile
- **Layout**: Full-width content on mobile (`ml-0`)
- **Audio Player**: Optimized for mobile interaction
- **Text**: Responsive typography scaling

### Desktop Features
- **Fixed sidebar**: Always visible navigation
- **Wider margins**: Better use of screen real estate
- **Enhanced typography**: Larger text for better readability
- **Multi-column layouts**: Where appropriate

### Implementation Details
- Uses `useIsMobile()` hook for responsive behavior
- CSS classes with Tailwind responsive prefixes (`md:`, `lg:`, etc.)
- Layout component automatically adjusts margins based on screen size

## 🔍 SEO Optimization Overview

### Current Implementation

#### 1. **Dynamic Meta Tags** (`src/components/seo/SEOHead.tsx`)
- Page-specific titles, descriptions, and keywords
- Open Graph tags for social media sharing
- Twitter Card integration
- Canonical URLs for each page
- Multi-language support (English/Hebrew)

#### 2. **Structured Data** (`src/utils/seoUtils.ts`)
- **Educational Organization** schema for website
- **Learning Resource** schema for shiurim
- **Audio Object** schema for recordings
- **Breadcrumb List** schema for navigation
- **Search Action** markup

#### 3. **Automated Sitemap** (`scripts/generateSitemap.js`)
- **245 URLs** indexed (7 static + 238 shiur pages)
- Priority levels: Homepage (1.0), Featured content (0.95), Regular content (0.8)
- Auto-generated on build process
- Submitted to search engines

#### 4. **Technical SEO**
- **Mobile-first responsive design**
- **Fast loading** with lazy loading and code splitting
- **Clean URLs** with React Router
- **Proper heading hierarchy** (H1, H2, H3, etc.)
- **Image optimization** with alt text

### Adding SEO for New Content

#### For New Pages:
1. **Add SEOHead component** with relevant metadata:
   ```tsx
   <SEOHead
     title="Your Page Title"
     description="Compelling description under 160 characters"
     keywords={['relevant', 'keywords', 'for', 'content']}
     structuredData={yourStructuredData}
   />
   ```

2. **Update sitemap** in `scripts/generateSitemap.js`:
   ```javascript
   const staticPages = [
     // ... existing pages
     { url: '/your-new-page', priority: '0.8', changefreq: 'monthly' }
   ];
   ```

3. **Build and deploy** the site:
   ```bash
   npm run build
   # Deploy to your hosting platform
   ```

4. **Search Engine Submission** (Complete within 24-48 hours of deployment):

   **Google Search Console:**
   - Go to [Google Search Console](https://search.google.com/search-console)
   - Select your property (midrashaggadah.com)
   - **Sitemaps** → Submit updated sitemap: `https://midrashaggadah.com/sitemap.xml`
   - **URL Inspection** → Test new page URL: `https://midrashaggadah.com/your-new-page`
   - Click "Request Indexing" if URL is valid
   - **Performance** → Monitor for new page appearance in search results (7-14 days)

   **Bing Webmaster Tools (covers Yahoo Search):**
   - Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
   - Select your site
   - **Sitemaps** → Submit/resubmit sitemap: `https://midrashaggadah.com/sitemap.xml`
   - **URL Inspection** → Submit new URL for indexing
   - **Site Scan** → Run to check for issues
   - Note: This also optimizes for Yahoo Search (powered by Bing since 2009)

   **Yahoo-Specific Optimization:**
   - **Yahoo Local**: Claim business listing at [local.yahoo.com](https://local.yahoo.com)
   - **Yahoo Directory**: Submit to relevant educational/religious categories
   - **Social Integration**: Leverage Yahoo Mail, Tumblr, Flickr for additional visibility

5. **Validation & Testing**:
   - **Rich Results Test**: Test structured data at [search.google.com/test/rich-results](https://search.google.com/test/rich-results)
   - **PageSpeed Insights**: Check performance at [pagespeed.web.dev](https://pagespeed.web.dev)
   - **Mobile-Friendly Test**: Verify at [search.google.com/test/mobile-friendly](https://search.google.com/test/mobile-friendly)

#### For New Shiurim:

- **Automatic SEO**: New shiurim in `shiurim_data.json` automatically get:
  - Dynamic page titles and descriptions
  - Learning Resource structured data
  - Audio Object schema (if audio_recording_link provided)
  - Inclusion in sitemap
  - Breadcrumb navigation

**Manual Steps Required:**
1. **Build and deploy** after updating `shiurim_data.json`
2. **Resubmit sitemap** in Google Search Console and Bing Webmaster Tools
3. **Bulk URL submission** (if adding many shiurim):
   - Google Search Console → **Sitemaps** → Monitor "Submitted" vs "Indexed" counts
   - Use **Batch URL submission** in Bing Webmaster Tools for 10+ new URLs

#### For New Sefarim:
1. **Create structured data** following Book schema pattern
2. **Add to navigation** and breadcrumbs
3. **Include in sitemap** with appropriate priority
4. **Optimize content** with proper headings and semantic markup
5. **Follow same search engine submission process as new pages above**

### SEO Monitoring & Maintenance

#### Weekly Tasks:
- **Google Search Console**:
  - Check **Coverage** report for indexing issues
  - Monitor **Performance** for ranking changes
  - Review **Core Web Vitals** for performance issues
  - Check **Manual Actions** for penalties

- **Bing Webmaster Tools**:
  - Review **Reports & Data** → **Search Performance**
  - Check **Crawl** → **Crawl Errors** for issues
  - Monitor **SEO Reports** for optimization opportunities

#### Monthly Tasks:
- **Analytics Review**:
  - Track organic traffic growth
  - Monitor bounce rate and engagement
  - Analyze top-performing pages and keywords
  - Review mobile vs desktop performance

- **Technical SEO Audit**:
  - Validate sitemap coverage: Should show ~245 URLs indexed
  - Check `robots.txt` accessibility
  - Test structured data with Google's Rich Results Test
  - Run PageSpeed Insights on key pages

#### Tools & Resources:
- **Google Search Console**: [search.google.com/search-console](https://search.google.com/search-console)
- **Bing Webmaster Tools**: [bing.com/webmasters](https://www.bing.com/webmasters) (covers Yahoo)
- **Yahoo Local**: [local.yahoo.com](https://local.yahoo.com)
- **Rich Results Test**: [search.google.com/test/rich-results](https://search.google.com/test/rich-results)
- **PageSpeed Insights**: [pagespeed.web.dev](https://pagespeed.web.dev)
- **Mobile-Friendly Test**: [search.google.com/test/mobile-friendly](https://search.google.com/test/mobile-friendly)
- **Yahoo SEO Guide**: [/public/docs/seo/yahoo-seo-guide.md](./public/docs/seo/yahoo-seo-guide.md)

#### Key Performance Indicators:
- **Sitemap Coverage**: 245+ URLs indexed (check monthly)
- **Core Web Vitals**: All metrics in "Good" range
- **Mobile Usability**: Zero errors
- **Rich Results**: Structured data showing in search results
- **Search Visibility**: Growing organic impressions and clicks

## 🚀 Development Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd aggadah-shiurim-website

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts
```bash
# Development
npm run dev              # Start development server with hot reload

# Building
npm run build           # Production build with sitemap/RSS + podcast feed generation
npm run build:dev       # Development build with debugging
npm run preview         # Preview production build locally

# Utilities
npm run sitemap         # Generate sitemap.xml only
npm run podcast:generate # Generate podcast feeds only
npm run lint            # Run ESLint
```

### Project Structure
```
aggadah-shiurim-website/
├── public/                 # Static assets
│   ├── data/              # JSON data files
│   ├── sefarim/           # Markdown sefarim content
│   ├── sefer/             # Static HTML sefarim pages
│   └── docs/              # Documentation
│       └── seo/           # SEO-related documentation
├── src/
│   ├── components/        # React components
│   ├── pages/             # Page components
│   ├── utils/             # Utility functions
│   ├── hooks/             # Custom React hooks
│   └── types/             # TypeScript type definitions
├── scripts/               # Build and utility scripts
└── public/                # Static files and generated content
```

## 🛠️ Technology Stack

### Core Technologies
- **React 18** - Frontend framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **Lucide React** - Icon library

### SEO & Performance
- **React Helmet Async** - Dynamic meta tag management
- **Code splitting** - Lazy loading for better performance
- **Service Worker** - PWA functionality

### Data & State Management
- **TanStack Query** - Server state management
- **React Context** - Global state (sidebar, etc.)

## 📊 Content Statistics

- **238+ Shiurim** across multiple categories
- **3 Complete Sefarim** (Darosh Darash Moshe, Midrash HaAliyah, Ein Yaakov Commentary)
- **Categories**: Ein Yaakov, Midrash HaAliyah, and more
- **Languages**: Hebrew and English content
- **Audio**: Direct integration with Google Drive recordings
- **Source Sheets**: Links to Google Docs source materials

## 🔧 Maintenance & Best Practices

### Regular Tasks
1. **Update shiurim data** as new content becomes available
2. **Regenerate sitemap** when adding static pages
3. **Monitor SEO performance** via Google Search Console
4. **Update dependencies** regularly for security

### Code Quality
- **TypeScript** for type safety
- **ESLint** for code quality
- **Consistent naming** conventions
- **Component composition** over large monolithic components

### Performance Optimization
- **Lazy loading** for route components
- **Image optimization** with proper sizing
- **Bundle splitting** for better caching
- **Minimal dependencies** to reduce bundle size

### Accessibility
- **Semantic HTML** structure
- **Proper heading hierarchy**
- **Alt text** for images
- **Keyboard navigation** support

## Other Important Info

#### Hosting Platform: Vercel
- Link: https://vercel.com/ron-nahshons-projects/aggadah-shiurim-website

#### Domain Registrar: Squarespace (Google)
- Link: https://account.squarespace.com/domains/managed/midrashaggadah.com 
- Note: Note: the cost with Squarespace is ~$20 USD / year to host the domain

**Key files for reference:**
- SEO implementation: `public/docs/seo/seo-improvements.md`
- Google SEO action plan: `public/docs/seo/google-seo-action-plan.md`
- Component patterns: `src/components/`
- Data structure: `public/data/shiurim_data.json`
- Build scripts: `scripts/`
