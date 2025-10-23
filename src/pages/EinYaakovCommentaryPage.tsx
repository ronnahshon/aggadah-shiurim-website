import React, { useState, useEffect } from 'react';
import { ArrowUp, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEOHead from '@/components/seo/SEOHead';
import { cleanMarkdownEscapes } from '../utils/midrashParser';

const EinYaakovCommentaryPage: React.FC = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const loadContent = async () => {
      try {
        // Add cache-busting parameter to ensure latest version is loaded
        const timestamp = new Date().getTime();
        const response = await fetch(`/sefarim/ein-yaakov-commentary.md?v=${timestamp}`, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to load Ein Yaakov Commentary content');
        }
        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  // Back to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Process content for rendering - simplified to match the new content structure
  const processContent = (text: string): string => {
    if (!text) return '';
    
    try {
      // Split content into paragraphs
      const paragraphs = text.split('\n\n');
      const processedParagraphs: string[] = [];
      
      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i].trim();
        if (paragraph.length === 0) continue;
        
        // Check if the paragraph is entirely bold (starts with ** and ends with ** and has no other content)
        const isEntirelyBold = /^\*\*[^*]+\*\*$/.test(paragraph.trim());
        
        if (isEntirelyBold) {
          // Extract the text without the ** markers and render as centered header
          const headerText = paragraph.replace(/^\*\*([^*]+)\*\*$/, '$1');
          processedParagraphs.push(`<div class="text-center my-6"><h2 class="text-2xl font-bold text-biblical-brown">${headerText}</h2></div>`);
        } else {
          // Process basic markdown for mixed content
          let processedParagraph = paragraph
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
          
          processedParagraphs.push(`<p>${processedParagraph}</p>`);
        }
      }
      
      return cleanMarkdownEscapes(processedParagraphs.join(''));
    } catch (err) {
      console.error('Error processing content:', err);
      return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center" dir="rtl">
        <div className="text-biblical-brown text-xl font-hebrew">טוען...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center" dir="rtl">
        <div className="text-red-600 text-xl font-hebrew">שגיאה: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment" dir="rtl">
      <SEOHead
        title="Ein Yaakov Commentary - Classical Hebrew Commentary"
        description="Read our Hebrew commentary on Ein Yaakov (פירוש על העין יעקב) with original insights on aggadic sections of Nezikin, Kodashim, and Toharot. Written in traditional Hebrew and Aramaic style."
        keywords={['ein yaakov commentary', 'פירוש עין יעקב', 'talmud commentary', 'hebrew commentary', 'aggadah commentary', 'nezikin kodashim toharot']}
        ogType="book"
      />
      <div className="max-w-6xl lg:max-w-7xl mx-auto px-4 py-8 pt-16 md:pt-8">
        {/* Back to Sefarim Button */}
        <div className="mb-6 flex justify-center">
          <button
            onClick={() => navigate('/sefarim')}
            className="flex flex-col items-center gap-1 p-3 text-biblical-brown hover:text-biblical-brown/80 hover:bg-biblical-cream/50 rounded-lg transition-all duration-200 group"
            aria-label="Back to Sefarim Page"
          >
            <Home size={24} className="group-hover:scale-110 transition-transform duration-200" />
            <span className="text-sm font-medium">Back to Sefarim Page</span>
          </button>
        </div>
        
        {/* Title */}
        <div className="relative text-center mb-8">
          <h1 className="text-5xl font-bold text-black font-hebrew mb-2">
            פירוש על העין יעקב
          </h1>
          <p className="text-center text-black font-hebrew text-lg mt-4">
            נערך ע״י רון שמואל בן נדב צבי הכהן, תשרי תשפ״ו
          </p>
        </div>

        {/* Main Content */}
        <div className="midrash-content-container">
          <div id="main-content" className="midrash-content font-hebrew text-lg leading-relaxed">
            <div className="prose prose-lg max-w-none text-black text-right">
              <div dangerouslySetInnerHTML={{ __html: processContent(content) }} />
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="back-to-top-btn"
          aria-label="חזור למעלה"
        >
          <ArrowUp width="24" height="24" />
        </button>
      )}
    </div>
  );
};

export default EinYaakovCommentaryPage; 