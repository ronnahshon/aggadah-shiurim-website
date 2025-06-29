import { Shiur } from '@/types/shiurim';
import { formatTitle } from './dataUtils';

export interface StructuredDataBase {
  "@context": string;
  "@type": string;
}

export interface AudioObjectStructuredData extends StructuredDataBase {
  "@type": "AudioObject";
  name: string;
  description: string;
  url: string;
  duration?: string;
  contentUrl: string;
  encodingFormat: string;
  creator: {
    "@type": "Organization";
    name: string;
    url: string;
  };
  keywords: string[];
  inLanguage: string[];
  educationalAlignment?: {
    "@type": "AlignmentObject";
    alignmentType: string;
    educationalFramework: string;
    targetName: string;
  };
}

export interface LectureStructuredData extends StructuredDataBase {
  "@type": "LearningResource";
  name: string;
  description: string;
  url: string;
  educationalLevel: string;
  about: {
    "@type": "Thing";
    name: string;
  };
  creator: {
    "@type": "Organization";
    name: string;
    url: string;
  };
  keywords: string[];
  inLanguage: string[];
  associatedMedia?: AudioObjectStructuredData;
}

export interface WebsiteStructuredData extends StructuredDataBase {
  "@type": "EducationalOrganization";
  name: string;
  description: string;
  url: string;
  sameAs: string[];
  potentialAction: {
    "@type": "SearchAction";
    target: string;
    "query-input": string;
  };
  mainEntityOfPage: {
    "@type": "WebPage";
    "@id": string;
  };
  contactPoint?: {
    "@type": "ContactPoint";
    email: string;
    contactType: string;
    availableLanguage: string[];
  };
  foundingDate?: string;
  areaServed?: string;
  availableLanguage?: string[];
  educationalCredentialAwarded?: string;
  publishingPrinciples?: string;
  knowsAbout?: string[];
}

export interface BreadcrumbStructuredData extends StructuredDataBase {
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item?: string;
  }>;
}

// Social Media Configuration
export const SOCIAL_MEDIA_CONFIG = {
  // Primary accounts (already set up)
  twitter: {
    handle: "@midrashaggadah",
    url: "https://twitter.com/midrashaggadah"
  },
  
  // TODO: Update these URLs when accounts are created
  // Replace empty strings with your actual social media URLs
  facebook: {
    url: "https://www.facebook.com/profile.php?id=61577753708266",
    appId: "" // UPDATE: Add Facebook App ID for better integration (optional)
  },
  linkedin: {
    url: "https://www.linkedin.com/company/107936990/",
  },
  youtube: {
    url: "", // UPDATE: Add your YouTube channel URL (e.g., "https://youtube.com/@midrashaggadah")
  },
  instagram: {
    url: "", // UPDATE: Add your Instagram URL (e.g., "https://instagram.com/midrashaggadah")
  },
  whatsapp: {
    // WhatsApp Business number or link
    url: "", // UPDATE: Add your WhatsApp Business link (e.g., "https://wa.me/1234567890")
  },
  telegram: {
    url: "", // UPDATE: Add your Telegram channel URL (e.g., "https://t.me/midrashaggadah")
  }
};

// Get active social media URLs (only those that are set up)
export const getActiveSocialMediaUrls = (): string[] => {
  const urls: string[] = [];
  
  Object.values(SOCIAL_MEDIA_CONFIG).forEach(platform => {
    if (typeof platform === 'object' && platform.url && platform.url.trim()) {
      urls.push(platform.url);
    }
  });
  
  return urls;
};

// Generate social media sharing URLs
export const generateSocialSharingUrls = (url: string, title: string, description: string) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const twitterHandle = SOCIAL_MEDIA_CONFIG.twitter.handle.replace('@', '');
  
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&via=${twitterHandle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%20${encodedUrl}`
  };
};

// Generate structured data for individual shiur
export const generateShiurStructuredData = (shiur: Shiur, baseUrl: string): LectureStructuredData => {
  const shiurUrl = `${baseUrl}/shiur/${shiur.id}`;
  
  const keywords = [
    'midrash',
    'aggadah',
    'jewish learning',
    'talmud',
    'shiur',
    formatTitle(shiur.category).toLowerCase(),
    formatTitle(shiur.sub_category).toLowerCase(),
    formatTitle(shiur.english_sefer).toLowerCase(),
    ...(shiur.tags || [])
  ];

  const structuredData: LectureStructuredData = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: shiur.english_title,
    description: `A shiur on ${shiur.english_title} from ${formatTitle(shiur.english_sefer)} in the ${formatTitle(shiur.category)} collection. Part of the comprehensive Midrash Aggadah learning series.`,
    url: shiurUrl,
    educationalLevel: "Advanced",
    about: {
      "@type": "Thing",
      name: `${formatTitle(shiur.category)} - ${formatTitle(shiur.english_sefer)}`
    },
    creator: {
      "@type": "Organization",
      name: "Midrash Aggadah",
      url: baseUrl
    },
    keywords,
    inLanguage: ["en", "he"]
  };

  // Add audio if available
  if (shiur.audio_recording_link) {
    const audioStructuredData: AudioObjectStructuredData = {
      "@context": "https://schema.org",
      "@type": "AudioObject",
      name: shiur.english_title,
      description: `Audio recording of ${shiur.english_title}`,
      url: shiurUrl,
      contentUrl: shiur.audio_recording_link,
      encodingFormat: "audio/mpeg",
      creator: {
        "@type": "Organization",
        name: "Midrash Aggadah",
        url: baseUrl
      },
      keywords,
      inLanguage: ["en", "he"]
    };

    if ((shiur as any).length) {
      // Convert MM:SS format to ISO 8601 duration
      const [minutes, seconds] = ((shiur as any).length as string).split(':').map(Number);
      audioStructuredData.duration = `PT${minutes}M${seconds}S`;
    }

    structuredData.associatedMedia = audioStructuredData;
  }

  return structuredData;
};

// Generate structured data for the main website
export const generateWebsiteStructuredData = (baseUrl: string): WebsiteStructuredData => {
  const socialMediaUrls = getActiveSocialMediaUrls();
  
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "Midrash Aggadah",
    description: "A comprehensive resource for exploring midrash aggadah, featuring shiurim, source texts, and sefarim. Thousands of pages of written source sheets and hundreds of hours of audio shiurim.",
    url: baseUrl,
    sameAs: socialMediaUrls,
    contactPoint: {
      "@type": "ContactPoint",
      email: "midrashaggadah@gmail.com",
      contactType: "customer service",
      availableLanguage: ["English", "Hebrew"]
    },
    foundingDate: "2023",
    areaServed: "Worldwide",
    availableLanguage: ["en", "he"],
    educationalCredentialAwarded: "Certificate of Completion",
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": baseUrl
    },
    // Enhanced social media presence
    publishingPrinciples: `${baseUrl}/about`,
    knowsAbout: [
      "Midrash Aggadah",
      "Jewish Learning",
      "Talmudic Studies", 
      "Ein Yaakov",
      "Hebrew Literature",
      "Torah Study",
      "Jewish Education"
    ]
  };
};

// Generate breadcrumb structured data
export const generateBreadcrumbStructuredData = (
  breadcrumbs: Array<{ name: string; url?: string }>,
  baseUrl: string
): BreadcrumbStructuredData => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((breadcrumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: breadcrumb.name,
      ...(breadcrumb.url && { item: `${baseUrl}${breadcrumb.url}` })
    }))
  };
};

// Generate page-specific meta description
export const generateMetaDescription = (page: string, shiur?: Shiur): string => {
  switch (page) {
    case 'home':
      return "Explore thousands of pages of midrash aggadah source texts and hundreds of hours of shiurim. Access comprehensive Jewish learning resources including Ein Yaakov, Talmud, and classical sefarim.";
    
    case 'catalog':
      return "Browse our comprehensive catalog of midrash aggadah shiurim organized by category, subcategory, and sefer. Find lectures on Ein Yaakov, Talmud, and other classical Jewish texts.";
    
    case 'search':
      return "Search through our extensive collection of midrash aggadah shiurim and source texts. Find specific topics, keywords, and teachings across our entire library.";
    
    case 'sefarim':
      return "Access complete sefarim with our unique collection of midrashic texts and commentaries. Explore classical Jewish literature with comprehensive source materials.";
    
    case 'sefer':
      if (shiur && (shiur as any).includes && (shiur as any).includes('darosh-darash-moshe')) {
        return "Read Darosh Darash Moshe - A comprehensive work exploring the life and legacy of Moshe Rabbeinu through the lens of Midrash Aggadah. Features three ascents with full Hebrew text, footnotes, and commentary.";
      }
      return "Explore this complete sefer from our midrash aggadah collection with comprehensive Hebrew texts and commentary.";
    
    case 'about':
      return "Learn about the Midrash Aggadah project, our mission to make ancient Jewish wisdom accessible, and the people behind this comprehensive learning resource.";
    
    case 'shiur':
      if (shiur) {
        return `Listen to "${shiur.english_title}" from ${formatTitle(shiur.english_sefer)} in our ${formatTitle(shiur.category)} collection. Includes audio shiur and comprehensive source sheet materials.`;
      }
      return "Access detailed shiur with audio recording and comprehensive source materials from our midrash aggadah collection.";
    
    default:
      return "A comprehensive resource for exploring midrash aggadah, featuring shiurim, source texts, and sefarim.";
  }
};

// Generate page-specific keywords
export const generateKeywords = (page: string, shiur?: Shiur): string[] => {
  const baseKeywords = ['midrash', 'aggadah', 'jewish learning', 'talmud', 'torah study'];
  
  switch (page) {
    case 'home':
      return [...baseKeywords, 'shiurim', 'lectures', 'ein yaakov', 'sefarim', 'jewish texts'];
    
    case 'catalog':
      return [...baseKeywords, 'catalog', 'browse', 'organized learning', 'structured study'];
    
    case 'search':
      return [...baseKeywords, 'search', 'find', 'topics', 'keywords', 'research'];
    
    case 'sefarim':
      return [...baseKeywords, 'sefarim', 'books', 'texts', 'midrashic literature'];
    
    case 'sefer':
      if (shiur && (shiur as any).includes && (shiur as any).includes('darosh-darash-moshe')) {
        return [
          ...baseKeywords,
          'darosh darash moshe',
          'moshe rabbeinu',
          'three ascents',
          'classical sefarim',
          'hebrew texts',
          'footnotes',
          'commentary',
          'jewish biography',
          'משה רבינו',
          'דרוש דרש משה'
        ];
      }
      return [...baseKeywords, 'sefer', 'text', 'classical literature'];
    
    case 'shiur':
      if (shiur) {
        return [
          ...baseKeywords,
          'shiur',
          'lecture',
          formatTitle(shiur.category).toLowerCase(),
          formatTitle(shiur.sub_category).toLowerCase(),
          formatTitle(shiur.english_sefer).toLowerCase(),
          ...(shiur.tags || [])
        ];
      }
      return [...baseKeywords, 'shiur', 'lecture', 'audio', 'source sheet'];
    
    default:
      return baseKeywords;
  }
}; 