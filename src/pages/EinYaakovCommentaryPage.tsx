import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowUp, Download, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEOHead from '@/components/seo/SEOHead';
import { cleanMarkdownEscapes } from '../utils/midrashParser';

const EinYaakovCommentaryPage: React.FC = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    const loadContent = async () => {
      try {
        // Remove cache-busting for better performance and caching
        const response = await fetch(`/sefarim/ein-yaakov-commentary.md`);
        if (!response.ok) {
          throw new Error('Failed to load Ein Yaakov Commentary content');
        }
        const text = await response.text();
        setContent(text);
        // Delay content processing slightly to improve perceived performance
        setTimeout(() => setContentVisible(true), 100);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  // Optimized scroll handler with throttling
  const handleScroll = useCallback(() => {
    setShowBackToTop(window.scrollY > 400);
  }, []);

  useEffect(() => {
    // Throttle scroll events for better performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [handleScroll]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // Simplified content processing - no regex operations for better mobile performance
  const processedContent = useMemo(() => {
    if (!content || !contentVisible) return '';
    
    try {
      // Very simple processing - just split into paragraphs and wrap in <p> tags
      const paragraphs = content.split('\n\n');
      const processedParagraphs: string[] = [];
      
      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i].trim();
        if (paragraph.length === 0) continue;
        
        // Simple paragraph wrapping - no regex processing
        const processedParagraph = paragraph.replace(/\n/g, '<br>');
        processedParagraphs.push(`<p>${processedParagraph}</p>`);
      }
      
      return processedParagraphs.join('');
    } catch (err) {
      console.error('Error processing content:', err);
      return '';
    }
  }, [content, contentVisible]);

  // Memoized final HTML content
  const finalHtmlContent = useMemo(() => {
    if (!processedContent) return '';
    return cleanMarkdownEscapes(processedContent);
  }, [processedContent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-subtle-parchment flex items-center justify-center" dir="rtl">
        <div className="text-biblical-brown text-xl font-hebrew">טוען...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-subtle-parchment flex items-center justify-center" dir="rtl">
        <div className="text-red-600 text-xl font-hebrew">שגיאה: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-subtle-parchment py-8 pt-20 md:pt-8" dir="rtl">
      <SEOHead
        title="Ein Yaakov Commentary - Classical Hebrew Commentary"
        description="Read our Hebrew commentary on Ein Yaakov (פירוש על העין יעקב) with original insights on aggadic sections of Nezikin, Kodashim, and Toharot. Written in traditional Hebrew and Aramaic style."
        keywords={['ein yaakov commentary', 'פירוש עין יעקב', 'talmud commentary', 'hebrew commentary', 'aggadah commentary', 'nezikin kodashim toharot']}
        ogType="book"
      />
      {/* Simplified styles - removed custom bold formatting */}
      <style>
        {`
          /* Optimize font rendering for better performance */
          .prose-hebrew {
            text-rendering: optimizeSpeed;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        `}
      </style>
      <div className="content-container">
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
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-4 font-hebrew">
            פירוש על העין יעקב
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-biblical-brown mb-2">
            Ein Yaakov Commentary
          </h2>
          <p className="text-lg text-biblical-brown">
            חידושים על האגדות בסדר נזיקין, קדשים וטהרות
          </p>
        </div>

        {/* Work in Progress Note */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="bg-yellow-50/90 border border-yellow-200 rounded-lg shadow-sm p-4 md:p-6">
            <p className="text-center text-black font-medium">
              Note: This commentary is still a work in progress
            </p>
          </div>
        </div>

        {/* Main Content - Text directly on parchment background */}
        <div className="max-w-6xl mx-auto">
          {contentVisible ? (
            <div 
              className="prose-hebrew prose-xl max-w-none leading-relaxed text-black text-justify px-8 md:px-12"
              dangerouslySetInnerHTML={{ 
                __html: finalHtmlContent
              }}
            />
          ) : (
            <div className="prose-hebrew prose-xl max-w-none leading-relaxed text-black text-justify px-8 md:px-12">
              <div className="flex items-center justify-center py-12">
                <div className="text-biblical-brown text-lg font-hebrew">מעבד את התוכן...</div>
              </div>
            </div>
          )}
        </div>

        {/* Back to Top Button */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 bg-biblical-brown text-white p-3 rounded-full shadow-lg hover:bg-opacity-80 transition-all duration-200 z-50"
            aria-label="חזור למעלה"
          >
            <ArrowUp size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default EinYaakovCommentaryPage; 