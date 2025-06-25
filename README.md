# Midrash Aggadah Website

A comprehensive React-based website for exploring midrash aggadah, featuring shiurim, source texts, and sefarim. Built with modern web technologies including React, TypeScript, Vite, and Tailwind CSS. 

Claude-4-Sonnet was used to write the initial code. It was first given a Prompt and Product Requirements Document (PRD) - which can be found in public/docs - to generate the base website structure, and then further improvements and changes were made via discussions with the model's 'Agent' mode.

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

2. **Regenerate sitemap**:
   ```bash
   npm run sitemap
   ```

3. **Build and deploy** to ensure SEO updates are applied.

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

2. **Update sitemap** in `scripts/generateSitemap.js`

3. **Add structured data** if applicable (in `src/utils/seoUtils.ts`)

#### For New Shiurim:
- **Automatic SEO**: New shiurim in `shiurim_data.json` automatically get:
  - Dynamic page titles and descriptions
  - Learning Resource structured data
  - Audio Object schema (if audio_recording_link provided)
  - Inclusion in sitemap
  - Breadcrumb navigation

#### For New Sefarim:
1. **Create structured data** following Book schema pattern
2. **Add to navigation** and breadcrumbs
3. **Include in sitemap** with appropriate priority
4. **Optimize content** with proper headings and semantic markup

### SEO Monitoring
- **Files to check**: `public/sitemap.xml`, `public/robots.txt`
- **Analytics**: Track organic traffic growth
- **Tools**: Google Search Console, Rich Results Test
- **Performance**: Monitor Core Web Vitals

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
npm run build           # Production build with sitemap/RSS generation
npm run build:dev       # Development build with debugging
npm run preview         # Preview production build locally

# Utilities
npm run sitemap         # Generate sitemap.xml only
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

---

## 📞 Support & Contributing

For questions about website structure, adding content, or technical issues, refer to the documentation in `public/docs/` or examine the existing code patterns for guidance.

**Key files for reference:**
- SEO implementation: `public/docs/SEO_IMPROVEMENTS.md`
- Component patterns: `src/components/`
- Data structure: `public/data/shiurim_data.json`
- Build scripts: `scripts/`
