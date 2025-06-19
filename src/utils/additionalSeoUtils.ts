export interface FAQStructuredData {
  "@context": "https://schema.org";
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

export interface ArticleStructuredData {
  "@context": "https://schema.org";
  "@type": "Article";
  headline: string;
  description: string;
  author: {
    "@type": "Organization";
    name: string;
    url: string;
  };
  publisher: {
    "@type": "Organization";
    name: string;
    url: string;
  };
  datePublished: string;
  dateModified: string;
  mainEntityOfPage: {
    "@type": "WebPage";
    "@id": string;
  };
  keywords: string[];
}

// Generate FAQ structured data for About page or general FAQ
export const generateFAQStructuredData = (): FAQStructuredData => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Midrash Aggadah?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Midrash Aggadah is a comprehensive collection of Jewish learning materials focusing on aggadic midrashim. Our collection includes hundreds of hours of audio shiurim, thousands of pages of source texts, and complete sefarim exploring classical Jewish wisdom and storytelling."
        }
      },
      {
        "@type": "Question", 
        name: "What content is available on this website?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our website features over 238 individual shiurim covering Ein Yaakov, Tanach, and various midrashic texts. Each shiur includes audio recordings and comprehensive source sheets. We also offer complete sefarim including our original work 'Midrash HaAliyah'."
        }
      },
      {
        "@type": "Question",
        name: "Are the shiurim available in both Hebrew and English?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, our content is available in both Hebrew and English. Each shiur has titles and descriptions in both languages, and our source texts preserve the original Hebrew alongside English translations and explanations."
        }
      },
      {
        "@type": "Question",
        name: "How can I search for specific topics?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Use our advanced search feature to find specific topics, keywords, or content across our entire collection. You can filter by category (Ein Yaakov, Tanach, Midrash), sub-category, or specific sefer to narrow down your search results."
        }
      },
      {
        "@type": "Question",
        name: "Is this content suitable for advanced learners?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our content is designed for advanced Jewish learning, suitable for those with a strong background in Torah study, Talmud, and Hebrew texts. The shiurim assume familiarity with classical Jewish sources and terminology."
        }
      }
    ]
  };
};

// Enhanced meta descriptions for different page types
export const generateEnhancedMetaDescription = (
  pageType: string,
  data?: any
): string => {
  switch (pageType) {
    case 'home':
      return "Explore thousands of pages of midrash aggadah source texts and hundreds of hours of audio shiurim. Your comprehensive resource for Ein Yaakov, classical midrashim, and Jewish learning materials.";
    
    case 'catalog':
      return "Browse our complete catalog of 238+ shiurim organized by category and sefer. Find Ein Yaakov lectures, Tanach studies, and midrashic texts with audio recordings and source sheets.";
    
    case 'search':
      return "Search through our entire collection of midrash aggadah content. Find specific topics, keywords, or concepts across hundreds of shiurim and thousands of pages of source material.";
    
    case 'sefarim':
      return "Access complete sefarim including our original 'Midrash HaAliyah' and other classical Jewish texts. Download PDFs and explore comprehensive midrashic literature.";
    
    case 'about':
      return "Learn about the Midrash Aggadah project, our mission to make classical Jewish wisdom accessible, and the team behind this comprehensive learning resource.";
    
    case 'shiur':
      if (data) {
        const categoryName = data.category?.replace(/_/g, ' ') || '';
        const seferName = data.english_sefer || '';
        return `Listen to "${data.english_title}" - A comprehensive shiur on ${seferName} from our ${categoryName} collection. Includes audio recording and detailed source sheet with Hebrew texts and commentary.`;
      }
      return "Listen to this comprehensive shiur with audio recording and detailed source sheet from our midrash aggadah collection.";
    
    case 'sefer':
      if (data && data.includes('midrash-haaliyah')) {
        return "Read Midrash HaAliyah - An original Hebrew midrash exploring the life and legacy of Moshe Rabbeinu through his three ascents. Combines classical aggadic style with original insights.";
      }
      if (data && data.includes('darosh-darash-moshe')) {
        return "Read Darosh Darash Moshe - A comprehensive work exploring the life and legacy of Moshe Rabbeinu through the lens of Midrash Aggadah. Features three ascents with full Hebrew text, footnotes, and commentary.";
      }
      return "Explore this complete sefer from our midrash aggadah collection with comprehensive Hebrew texts and commentary.";
    
    default:
      return "Midrash Aggadah - Your comprehensive resource for Jewish learning, featuring shiurim, source texts, and classical sefarim.";
  }
};

// Generate keywords based on content and context
export const generateContextualKeywords = (
  pageType: string,
  data?: any
): string[] => {
  const baseKeywords = [
    'midrash aggadah',
    'jewish learning',
    'torah study',
    'hebrew texts',
    'shiurim',
    'audio lectures',
    'source sheets'
  ];

  const hebrewKeywords = [
    'מדרש אגדה',
    'שיעורים',
    'לימוד יהודי',
    'תורה',
    'ספרים'
  ];

  switch (pageType) {
    case 'home':
      return [
        ...baseKeywords,
        ...hebrewKeywords,
        'ein yaakov',
        'talmud aggadah',
        'jewish wisdom',
        'classical texts',
        'online learning'
      ];
    
    case 'catalog':
      return [
        ...baseKeywords,
        'shiur catalog',
        'jewish lecture library',
        'organized learning',
        'systematic study',
        'ein yaakov lectures'
      ];
    
    case 'search':
      return [
        ...baseKeywords,
        'search jewish texts',
        'find shiurim',
        'discover content',
        'text search'
      ];
    
    case 'shiur':
      if (data) {
        const contextKeywords = [
          ...baseKeywords,
          data.category?.replace(/_/g, ' '),
          data.sub_category?.replace(/_/g, ' '),
          data.english_sefer,
          'audio recording',
          'source sheet'
        ].filter(Boolean);
        
        if (data.tags) {
          contextKeywords.push(...data.tags);
        }
        
        return contextKeywords;
      }
      return baseKeywords;
    
    case 'sefer':
      if (data && data.includes('darosh-darash-moshe')) {
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
          'דרוש דרש משה',
          'ספרים קלאסיים'
        ];
      }
      if (data && data.includes('midrash-haaliyah')) {
        return [
          ...baseKeywords,
          'midrash haaliyah',
          'original midrash',
          'moshe rabbeinu',
          'hebrew literature',
          'classical style'
        ];
      }
      return [
        ...baseKeywords,
        'sefarim',
        'classical texts',
        'hebrew literature'
      ];
    
    default:
      return baseKeywords;
  }
};

// Generate article structured data for content pages
export const generateArticleStructuredData = (
  title: string,
  description: string,
  url: string,
  datePublished: string,
  dateModified?: string
): ArticleStructuredData => {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description,
    author: {
      "@type": "Organization",
      name: "Midrash Aggadah",
      url: "https://midrashaggadah.com"
    },
    publisher: {
      "@type": "Organization", 
      name: "Midrash Aggadah",
      url: "https://midrashaggadah.com"
    },
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url
    },
    keywords: generateContextualKeywords('shiur')
  };
}; 