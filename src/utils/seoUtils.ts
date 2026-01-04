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

export interface FAQStructuredData extends StructuredDataBase {
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
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
// Note: Google requires the "item" field for all breadcrumb items EXCEPT the last one
export const generateBreadcrumbStructuredData = (
  breadcrumbs: Array<{ name: string; url?: string }>,
  baseUrl: string
): BreadcrumbStructuredData => {
  const lastIndex = breadcrumbs.length - 1;
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((breadcrumb, index) => {
      const isLastItem = index === lastIndex;
      const listItem: {
        "@type": "ListItem";
        position: number;
        name: string;
        item?: string;
      } = {
        "@type": "ListItem",
        position: index + 1,
        name: breadcrumb.name,
      };
      
      // Include "item" field for all items except the last one
      // For the last item (current page), "item" is optional
      if (breadcrumb.url) {
        listItem.item = `${baseUrl}${breadcrumb.url}`;
      } else if (!isLastItem) {
        // Non-last items without a URL should use a fallback to satisfy Google's requirements
        // Use the base URL as a fallback (better than missing the field entirely)
        listItem.item = baseUrl;
      }
      
      return listItem;
    })
  };
};

// Generate page-specific meta description
export const generateMetaDescription = (page: string, shiur?: Shiur): string => {
  switch (page) {
    case 'home':
      return "Discover the profound wisdom of Midrash Aggadah through our comprehensive collection of Jewish learning resources. Access hundreds of hours of expert shiurim, thousands of pages of classical texts including Ein Yaakov and Talmudic commentary, plus original sefarim with Hebrew sources and English explanations. Perfect for students, scholars, and anyone seeking to deepen their understanding of rabbinical literature and Jewish exegesis.";
    
    case 'catalog':
      return "Browse our organized catalog of Midrash Aggadah shiurim and study materials. Find lectures systematically arranged by category, subcategory, and classical texts including Ein Yaakov, Talmudic tractates, and biblical commentary. Each shiur includes audio recordings and comprehensive source sheets for in-depth study.";
    
    case 'search':
      return "Search our extensive digital library of Midrash Aggadah content with advanced filtering options. Find specific topics, teachings, or concepts across hundreds of shiurim and thousands of pages of source materials from classical Jewish literature.";
    
    case 'sefarim':
      return "Access our unique collection of original sefarim dedicated to Midrash Aggadah studies. These comprehensive works include full Hebrew texts with detailed footnotes, English commentary, and scholarly analysis of classical midrashic literature.";
    
    case 'sefer':
      if (shiur && (shiur as any).includes && (shiur as any).includes('darosh-darash-moshe')) {
        return "Explore 'Darosh Darash Moshe' - our featured comprehensive work examining the life and spiritual journey of Moshe Rabbeinu through the lens of Midrash Aggadah. This detailed study covers three pivotal ascents with full Hebrew text, extensive footnotes, and scholarly commentary connecting biblical narrative to rabbinical interpretation.";
      }
      return "Read this complete sefer from our Midrash Aggadah collection, featuring comprehensive Hebrew texts with detailed commentary and analysis of classical Jewish literature.";
    
    case 'about':
      return "Learn about our mission to make the profound teachings of Midrash Aggadah accessible to modern learners. Discover how our team of scholars and educators creates comprehensive study resources that bridge ancient wisdom with contemporary Jewish learning.";
    
    case 'shiur':
      if (shiur) {
        return `Study "${shiur.english_title}" from ${formatTitle(shiur.english_sefer)} with expert analysis and comprehensive source materials. This shiur from our ${formatTitle(shiur.category)} collection includes audio recording and detailed source sheets connecting classical texts to contemporary understanding.`;
      }
      return "Access this detailed shiur with professional audio recording and comprehensive source materials from our curated Midrash Aggadah collection.";
    
    default:
      return "Comprehensive resources for exploring Midrash Aggadah, featuring expert shiurim, classical source texts, and original scholarly works.";
  }
};

// Generate page-specific keywords
export const generateKeywords = (page: string, shiur?: Shiur): string[] => {
  const baseKeywords = ['midrash', 'aggadah', 'jewish learning', 'talmud', 'torah study'];
  
  switch (page) {
    case 'home':
      return [
        ...baseKeywords, 
        'midrash aggadah',
        'aggadic midrash',
        'midrashic literature',
        'rabbinical literature',
        'jewish exegesis',
        'talmudic aggadah',
        'classical jewish texts',
        'shiurim', 
        'lectures', 
        'ein yaakov', 
        'sefarim', 
        'jewish texts',
        'jewish study resources',
        'online jewish learning',
        'torah commentary',
        'rabbinic teachings',
        'hebrew literature'
      ];
    
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

// Generate FAQ structured data for homepage
export const generateHomepageFAQStructuredData = (baseUrl: string): FAQStructuredData => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Midrash Aggadah?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Midrash Aggadah refers to the non-legal exegetical texts in rabbinic literature that explore ethical principles, theological concepts, and narrative expansions of biblical stories. Unlike Midrash Halakha which focuses on Jewish law, Aggadic midrashim illuminate the deeper meanings, moral teachings, and spiritual insights found within the Torah and Tanach."
        }
      },
      {
        "@type": "Question",
        name: "How is Midrash Aggadah different from other Jewish texts?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "While Talmudic discussions often focus on legal matters, and biblical commentary (peshat) seeks the literal meaning, Midrash Aggadah employs creative interpretation to uncover hidden wisdom, moral lessons, and spiritual truths. These texts often fill in narrative gaps, explore character motivations, and connect seemingly unrelated biblical passages to reveal deeper theological principles."
        }
      },
      {
        "@type": "Question",
        name: "What can I find on the Midrash Aggadah website?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our comprehensive collection includes hundreds of hours of expert shiurim (lectures), thousands of pages of classical midrashic texts with Hebrew sources and English explanations, original sefarim with detailed commentary, and study materials covering Ein Yaakov, Talmudic aggadot, and biblical midrashim. All content is organized by topic, tractate, and difficulty level."
        }
      },
      {
        "@type": "Question",
        name: "Who is Midrash Aggadah content suitable for?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our materials serve students, scholars, educators, and anyone interested in deepening their understanding of Jewish wisdom literature. Content ranges from introductory explanations for beginners to advanced scholarly analysis for experienced learners. Each shiur includes comprehensive source sheets to support study at any level."
        }
      },
      {
        "@type": "Question",
        name: "How do I get started with studying Midrash Aggadah?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Begin by exploring our organized catalog to find topics that interest you. New learners might start with Ein Yaakov selections, while those seeking deeper study can explore our original sefarim. Each shiur includes background context and source materials to support your learning journey."
        }
      }
    ]
  };
}; 