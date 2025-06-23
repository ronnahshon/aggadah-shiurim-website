import React, { useState, useEffect } from 'react';
import { ArrowUp, Download } from 'lucide-react';
import { cleanMarkdownEscapes } from '../utils/midrashParser';

const EinYaakovCommentaryPage: React.FC = () => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const loadContent = async () => {
      try {
        // Add cache-busting parameter to ensure latest version is loaded
        const timestamp = new Date().getTime();
        const response = await fetch(`/ein_yaakov_commentary.md?v=${timestamp}`, {
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

  // Simple markdown-to-HTML processor for Hebrew commentary
  const processContent = (rawContent: string): string => {
    return rawContent
      // Convert bold markdown to HTML
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Convert italic markdown to HTML
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Convert line breaks to paragraphs
      .split('\n\n')
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
      .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-subtle-parchment py-8 pt-20 md:pt-8">
        <div className="content-container">
          <div className="flex items-center justify-center py-20">
            <div className="text-biblical-brown text-lg">טוען פירוש עין יעקב...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-subtle-parchment py-8 pt-20 md:pt-8">
        <div className="content-container">
          <div className="flex items-center justify-center py-20">
            <div className="text-red-600 text-lg">שגיאה בטעינת התוכן: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-subtle-parchment py-8 pt-20 md:pt-8" dir="rtl">
      <div className="content-container">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-4 font-hebrew">
            פירוש על העין יעקב
          </h1>
          <p className="text-lg text-biblical-brown">
            חידושים על האגדות בסדר נזיקין, קדשים וטהרות
          </p>
        </div>

        {/* Introduction Section */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-white/90 rounded-lg shadow-sm p-6 md:p-8">
            <p className="text-lg text-black leading-relaxed text-center">
              This commentary is based on insights and ideas from hundreds of shiurim delivered over several years on Ein Yaakov (the aggadic portions of the Talmud Bavli)
            </p>
          </div>
        </div>

        {/* Work in Progress Note */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="bg-yellow-50/90 border border-yellow-200 rounded-lg shadow-sm p-4 md:p-6">
            <p className="text-center text-black font-medium">
              Note: This commentary is still a work in progress
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/90 rounded-lg shadow-sm p-8 md:p-12">
            <div 
              className="prose-hebrew prose-xl max-w-none leading-relaxed text-black text-justify"
              dangerouslySetInnerHTML={{ 
                __html: cleanMarkdownEscapes(processContent(content))
              }}
            />
          </div>
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