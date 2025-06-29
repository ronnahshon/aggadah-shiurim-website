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
  // New social media props
  twitterHandle?: string;
  facebookAppId?: string;
  socialMediaUrls?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    instagram?: string;
    whatsapp?: string;
    telegram?: string;
  };
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = "Midrash Aggadah",
  description = "A comprehensive resource for exploring midrash aggadah, featuring shiurim, source texts, and sefarim.",
  canonicalUrl,
  ogImage = "https://lovable.dev/opengraph-image-p98pqg.png",
  ogType = "website",
  keywords = [],
  structuredData,
  hreflang,
  twitterHandle = "@midrashaggadah",
  facebookAppId,
  socialMediaUrls = {
    twitter: "https://twitter.com/midrashaggadah",
    // Add other URLs when accounts are created
  }
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

  // Enhanced description with social media call-to-action
  const enhancedDescription = ogType === 'article' || ogType === 'book' 
    ? `${description} Follow @midrashaggadah for more Jewish learning content.`
    : description;

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
      
      {/* Enhanced Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={enhancedDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={`${fullTitle} - Midrash Aggadah`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Midrash Aggadah" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:locale:alternate" content="he_IL" />
      
      {/* Facebook specific tags */}
      {facebookAppId && <meta property="fb:app_id" content={facebookAppId} />}
      <meta property="fb:admins" content="midrashaggadah" />
      
      {/* Enhanced Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:creator" content={twitterHandle} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={enhancedDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={`${fullTitle} - Midrash Aggadah`} />
      
      {/* LinkedIn specific meta tags */}
      <meta property="article:author" content="Midrash Aggadah" />
      <meta property="article:publisher" content={socialMediaUrls.linkedin || ''} />
      
      {/* WhatsApp specific optimization */}
      <meta property="og:image:secure_url" content={ogImage} />
      <meta property="og:image:type" content="image/png" />
      
      {/* Additional Social Media Optimization */}
      <meta name="pinterest-rich-pin" content="true" />
      <meta name="format-detection" content="telephone=no" />
      
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