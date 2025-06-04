import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { parseMidrashContent, renderContentWithFootnotes, cleanMarkdownEscapes, type MidrashContent } from '../utils/midrashParser';

const MidrashHaaliyahPage: React.FC = () => {
  const [midrashContent, setMidrashContent] = useState<MidrashContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const loadMidrash = async () => {
      try {
        // Add cache-busting parameter to ensure latest version is loaded
        const timestamp = new Date().getTime();
        const response = await fetch(`/midrash-haaliyah.md?v=${timestamp}`, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to load midrash content');
        }
        const text = await response.text();
        const parsed = parseMidrashContent(text);
        setMidrashContent(parsed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadMidrash();
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

  useEffect(() => {
    // Add tooltip functionality for footnotes
    const handleFootnoteHover = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('footnote-link')) {
        const footnoteId = target.getAttribute('data-footnote');
        if (footnoteId && midrashContent?.allFootnotes[footnoteId]) {
          showTooltip(target, midrashContent.allFootnotes[footnoteId]);
        }
      }
    };

    const handleFootnoteLeave = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('footnote-link')) {
        hideTooltip();
      }
    };

    // Touch events for mobile
    const handleFootnoteTouch = (event: TouchEvent) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('footnote-link')) {
        event.preventDefault(); // Prevent default touch behavior
        const footnoteId = target.getAttribute('data-footnote');
        if (footnoteId && midrashContent?.allFootnotes[footnoteId]) {
          // If tooltip is already showing for this footnote, hide it
          const existingTooltip = document.querySelector('.footnote-tooltip');
          if (existingTooltip && existingTooltip.getAttribute('data-footnote-id') === footnoteId) {
            hideTooltip();
          } else {
            showTooltip(target, midrashContent.allFootnotes[footnoteId], footnoteId);
          }
        }
      }
    };

    // Hide tooltip when touching elsewhere
    const handleTouchOutside = (event: TouchEvent) => {
      const target = event.target as HTMLElement;
      if (!target.classList.contains('footnote-link') && !target.closest('.footnote-tooltip')) {
        hideTooltip();
      }
    };

    document.addEventListener('mouseover', handleFootnoteHover);
    document.addEventListener('mouseout', handleFootnoteLeave);
    document.addEventListener('touchstart', handleFootnoteTouch);
    document.addEventListener('touchstart', handleTouchOutside);

    return () => {
      document.removeEventListener('mouseover', handleFootnoteHover);
      document.removeEventListener('mouseout', handleFootnoteLeave);
      document.removeEventListener('touchstart', handleFootnoteTouch);
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, [midrashContent]);

  const showTooltip = (element: HTMLElement, content: string, footnoteId?: string) => {
    // Remove existing tooltip
    hideTooltip();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'footnote-tooltip';
    tooltip.innerHTML = cleanMarkdownEscapes(content);
    if (footnoteId) {
      tooltip.setAttribute('data-footnote-id', footnoteId);
    }
    document.body.appendChild(tooltip);

    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // Calculate initial position
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    let top = rect.top + window.scrollY - tooltipRect.height - 8;
    
    // Adjust horizontal position if tooltip goes off screen edges
    const margin = 10;
    if (left < margin) {
      left = margin;
    } else if (left + tooltipRect.width > window.innerWidth - margin) {
      left = window.innerWidth - tooltipRect.width - margin;
    }
    
    // On mobile, if tooltip would go above viewport, show it below the footnote instead
    const isMobile = window.innerWidth <= 768;
    if (top < window.scrollY + margin) {
      if (isMobile) {
        // Show below the footnote on mobile
        top = rect.bottom + window.scrollY + 8;
      } else {
        // Keep above but at minimum distance from top on desktop
        top = window.scrollY + margin;
      }
    }

    // Ensure tooltip doesn't go below the bottom of the viewport on mobile
    if (isMobile && top + tooltipRect.height > window.scrollY + window.innerHeight - margin) {
      top = window.scrollY + window.innerHeight - tooltipRect.height - margin;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };

  const hideTooltip = () => {
    const existingTooltip = document.querySelector('.footnote-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }
  };

  const renderBibliographyContent = (content: string) => {
    // Clean markdown escapes first
    const cleanedContent = cleanMarkdownEscapes(content);
    
    // Split content into sections and format nicely
    const lines = cleanedContent.split('\n').filter(line => line.trim());
    let currentSection = '';
    const sections: { title: string; entries: string[] }[] = [];
    let currentEntries: string[] = [];

    for (const line of lines) {
      if (line.startsWith('**') && line.endsWith('**')) {
        // This is a section header
        if (currentSection && currentEntries.length > 0) {
          sections.push({ title: currentSection, entries: [...currentEntries] });
        }
        currentSection = line.replace(/\*\*/g, '');
        currentEntries = [];
      } else if (line.trim()) {
        // This is an entry
        currentEntries.push(line.trim());
      }
    }

    // Add the last section
    if (currentSection && currentEntries.length > 0) {
      sections.push({ title: currentSection, entries: currentEntries });
    }

    return (
      <div className="bibliography-content">
        {sections.map((section, index) => (
          <div key={index} className="mb-6">
            <h4 className="text-lg font-semibold text-biblical-burgundy mb-3 border-b border-biblical-gold/30 pb-1">
              {section.title}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2">
              {section.entries.map((entry, entryIndex) => (
                <div key={entryIndex} className="text-sm text-slate-700 p-2 bg-parchment/50 rounded">
                  {entry}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderFootnotes = (footnotes: Record<string, string>) => {
    const sortedFootnotes = Object.entries(footnotes).sort((a, b) => {
      // Extract the number from the footnote id (e.g., ^123 -> 123)
      const numA = parseInt(a[0].slice(1)) || 0;
      const numB = parseInt(b[0].slice(1)) || 0;
      return numA - numB;
    });

    return (
      <div className="footnotes-content">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4 items-start">
          {sortedFootnotes.map(([id, content]) => {
            const footnoteNumber = id.slice(1); // Remove the ^ symbol
            return (
              <div key={id} id={`footnote-${footnoteNumber}`} className="footnote-item p-3 bg-white/70 rounded-lg border border-biblical-gold/20">
                <a 
                  href={`#footnote-ref-${footnoteNumber}`} 
                  className="footnote-return text-blue-600 hover:text-blue-800 transition-colors duration-200 ml-1 font-bold"
                  title="חזור לטקסט"
                >
                  ^
                </a>
                <a 
                  href={`#footnote-ref-${footnoteNumber}`} 
                  className="footnote-number font-semibold text-blue-600 ml-1"
                  title="חזור לטקסט"
                >
                  {footnoteNumber}
                </a>
                <span className="footnote-text text-slate-800">{cleanMarkdownEscapes(content)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center" dir="rtl">
        <div className="text-biblical-burgundy text-xl font-hebrew">טוען...</div>
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

  if (!midrashContent) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center" dir="rtl">
        <div className="text-biblical-burgundy text-xl font-hebrew">לא נמצא תוכן</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment" dir="rtl">
      <div className="max-w-6xl lg:max-w-7xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 font-hebrew mb-2">
            {midrashContent.title}
          </h1>
        </div>

        {/* Introduction Section */}
        {midrashContent.introduction && (
          <div className="introduction-section mb-12 bg-white/70 rounded-lg p-6 border border-biblical-gold/20">
            <div className="max-w-none text-slate-800 font-hebrew text-lg leading-relaxed">
              <p className="mb-0 text-justify">
                {midrashContent.introduction.map(line => cleanMarkdownEscapes(line)).join(' ')}
              </p>
            </div>
          </div>
        )}

        {/* Table of Contents */}
        <div className="table-of-contents mb-16">
          <h2 className="text-3xl font-bold text-biblical-burgundy mb-8 text-center">
            תוכן העניינים
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Right Container - Sefer Midrash HaAliyah */}
            <div className="bg-gradient-to-br from-white/90 to-parchment/70 rounded-lg p-6 border-2 border-biblical-gold/30 shadow-lg">
              <h3 className="text-xl font-bold text-biblical-burgundy mb-4 text-center border-b border-biblical-gold/30 pb-2">
                ספר מדרש העלייה
              </h3>
              <div className="text-sm font-hebrew text-center space-y-1">
                {midrashContent.chapters.map((chapter, index) => (
                  <a 
                    key={chapter.id} 
                    href={`#chapter-${chapter.id}`} 
                    className="block text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded px-2 py-1 transition-all duration-200"
                  >
                    {chapter.title}
                  </a>
                ))}
              </div>
            </div>

            {/* Middle Container - Bibliography */}
            <a href="#bibliography-section" className="block bg-gradient-to-br from-white/90 to-parchment/70 rounded-lg p-6 border-2 border-biblical-gold/30 shadow-lg hover:shadow-xl hover:border-biblical-gold/50 transition-all duration-300">
              <h3 className="text-xl font-bold text-biblical-burgundy mb-4 text-center border-b border-biblical-gold/30 pb-2">
                מפתח למדרש העלייה
              </h3>
              <div className="text-sm text-slate-700 font-hebrew text-center">
                ביבליוגרפיה לכל המקורות המצוטטים בספר, כולל מהתורה, תלמוד, מדרשים, ראשונים ועוד
              </div>
            </a>

            {/* Left Container - Footnotes */}
            <a href="#footnotes-section" className="block bg-gradient-to-br from-white/90 to-parchment/70 rounded-lg p-6 border-2 border-biblical-gold/30 shadow-lg hover:shadow-xl hover:border-biblical-gold/50 transition-all duration-300">
              <h3 className="text-xl font-bold text-biblical-burgundy mb-4 text-center border-b border-biblical-gold/30 pb-2">
                הערות
              </h3>
              <div className="text-sm text-slate-700 font-hebrew text-center">
                הערות שוליים לכל המקורות המצוטטים בספר
              </div>
            </a>
          </div>
        </div>

        {/* Section separator */}
        <div className="section-separator my-8">
          <div className="border-t-4 border-biblical-gold/40"></div>
        </div>

        {/* Sefer Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-biblical-burgundy">
            ספר מדרש העלייה
          </h2>
        </div>

        {/* Main Content */}
        <div id="main-content" className="midrash-content font-hebrew text-lg leading-relaxed">
          {midrashContent.chapters.map((chapter) => (
            <div key={chapter.id} id={`chapter-${chapter.id}`} className="mb-12">
              {/* Chapter Title */}
              <h2 className="text-2xl font-bold text-biblical-burgundy mb-6 text-center">
                {chapter.title}
              </h2>
              
              {/* Chapter Sections */}
              {chapter.sections.map((section) => (
                <div key={section.id} className="mb-8">
                  {/* Section Title */}
                  <h3 className="text-xl font-semibold text-biblical-burgundy mb-4">
                    {section.title}
                  </h3>
                  
                  {/* Section Content */}
                  <div 
                    className="prose prose-lg max-w-none text-slate-800 text-justify"
                    dangerouslySetInnerHTML={{ 
                      __html: renderContentWithFootnotes(section.content) 
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Bibliography Section */}
        {midrashContent.bibliography && (
          <>
            {/* Decorative section separator */}
            <div className="section-separator my-8">
              <div className="border-t-4 border-biblical-gold/40"></div>
            </div>
            
            <div className="bibliography-section mb-16">
              <h2 id="bibliography-section" className="text-3xl font-bold text-biblical-burgundy mb-8 text-center">
                {midrashContent.bibliography.title}
              </h2>
              {renderBibliographyContent(midrashContent.bibliography.content)}
            </div>
          </>
        )}

        {/* Footnotes Section */}
        {midrashContent.footnotesSection && (
          <>
            {/* Decorative section separator */}
            <div className="section-separator my-8">
              <div className="border-t-4 border-biblical-gold/40"></div>
            </div>
            
            <div className="footnotes-section">
              <h2 id="footnotes-section" className="text-3xl font-bold text-biblical-burgundy mb-8 text-center">
                {midrashContent.footnotesSection.title}
              </h2>
              {renderFootnotes(midrashContent.footnotesSection.footnotes)}
            </div>

            {/* Bottom divider line */}
            <div className="mt-16 mb-8">
              <div className="border-t-4 border-biblical-gold/40"></div>
            </div>
          </>
        )}
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

export default MidrashHaaliyahPage; 