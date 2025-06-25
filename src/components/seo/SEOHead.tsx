import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  keywords?: string[];
  structuredData?: any | any[];
  hreflang?: { [key: string]: string };
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = "Midrash Aggadah",
  description = "A comprehensive resource for exploring midrash aggadah, featuring shiurim, source texts, and sefarim.",
  canonicalUrl,
  ogImage = "https://lovable.dev/opengraph-image-p98pqg.png",
  ogType = "website",
  keywords = [],
  structuredData,
  hreflang
}) => {
  const fullTitle = title === "Midrash Aggadah" ? title : `${title} | Midrash Aggadah`;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://midrashaggadah.com';
  
  // Use provided canonicalUrl or construct clean URL without query parameters
  const canonical = canonicalUrl || (typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}` 
    : baseUrl);

  const defaultKeywords = [
    'midrash', 'aggadah', 'jewish learning', 'talmud', 'shiurim', 'lectures', 
    'torah study', 'ein yaakov', 'jewish texts', 'sefarim', 'hebrew learning',
    'מדרש', 'אגדה', 'שיעורים', 'תלמוד', 'עין יעקב'
  ];
  
  const allKeywords = [...defaultKeywords, ...keywords].join(', ');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords} />
      <meta name="author" content="Midrash Aggadah" />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="en-US" />
      <meta name="revisit-after" content="7 days" />
      <meta name="category" content="Education" />
      <meta name="coverage" content="Worldwide" />
      <meta name="distribution" content="Global" />
      <meta name="rating" content="General" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Midrash Aggadah" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@midrashaggadah" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Additional SEO Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="theme-color" content="#8B4513" />
      
      {/* Hreflang for multilingual content */}
      <link rel="alternate" hrefLang="en" href={canonical} />
      <link rel="alternate" hrefLang="he" href={canonical} />
      <link rel="alternate" hrefLang="x-default" href={canonical} />
      {hreflang && Object.entries(hreflang).map(([lang, url]) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}
      
      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        Array.isArray(structuredData) ? (
          structuredData.map((data, index) => (
            <script key={index} type="application/ld+json">
              {JSON.stringify(data)}
            </script>
          ))
        ) : (
          <script type="application/ld+json">
            {JSON.stringify(structuredData)}
          </script>
        )
      )}
    </Helmet>
  );
};

export default SEOHead; 