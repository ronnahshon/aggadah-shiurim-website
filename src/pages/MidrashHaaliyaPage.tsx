import React, { useState, useEffect } from 'react';
import { parseMidrashContent, renderContentWithFootnotes, cleanMarkdownEscapes, type MidrashContent } from '../utils/midrashParser';

const MidrashHaaliyaPage: React.FC = () => {
  const [midrashContent, setMidrashContent] = useState<MidrashContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMidrash = async () => {
      try {
        const response = await fetch('/midrash-haaliyah.md');
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

    document.addEventListener('mouseover', handleFootnoteHover);
    document.addEventListener('mouseout', handleFootnoteLeave);

    return () => {
      document.removeEventListener('mouseover', handleFootnoteHover);
      document.removeEventListener('mouseout', handleFootnoteLeave);
    };
  }, [midrashContent]);

  const showTooltip = (element: HTMLElement, content: string) => {
    // Remove existing tooltip
    hideTooltip();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'footnote-tooltip';
    tooltip.innerHTML = cleanMarkdownEscapes(content);
    document.body.appendChild(tooltip);

    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // Always position tooltip directly above the footnote link
    // Account for page scroll position
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    let top = rect.top + window.scrollY - tooltipRect.height - 8;
    
    // Adjust horizontal position if tooltip goes off screen edges
    if (left < 10) {
      left = 10;
    } else if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }
    
    // If tooltip would go above the viewport, adjust but keep it above the footnote
    if (top < window.scrollY + 10) {
      top = window.scrollY + 10; // Minimum distance from top of viewport
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
            <h4 className="text-lg font-semibold text-burgundy mb-3 border-b border-gold/30 pb-1">
              {section.title}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedFootnotes.map(([id, content]) => (
            <div key={id} className="footnote-item p-3 bg-white/70 rounded-lg border border-gold/20">
              <span className="footnote-number font-semibold text-burgundy">
                {id.slice(1)}:
              </span>
              <span className="footnote-text mr-2 text-slate-800">{cleanMarkdownEscapes(content)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center" dir="rtl">
        <div className="text-burgundy text-xl font-hebrew">טוען...</div>
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
        <div className="text-burgundy text-xl font-hebrew">לא נמצא תוכן</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-burgundy font-hebrew mb-2">
            {midrashContent.title}
          </h1>
        </div>

        {/* Main Content */}
        <div className="midrash-content font-hebrew text-lg leading-relaxed">
          {midrashContent.chapters.map((chapter) => (
            <div key={chapter.id} className="mb-12">
              {/* Chapter Title */}
              <h2 className="text-2xl font-bold text-burgundy mb-6 text-center border-b-2 border-gold pb-2">
                {chapter.title}
              </h2>
              
              {/* Chapter Sections */}
              {chapter.sections.map((section) => (
                <div key={section.id} className="mb-8">
                  {/* Section Title */}
                  <h3 className="text-xl font-semibold text-burgundy mb-4">
                    {section.title}
                  </h3>
                  
                  {/* Section Content */}
                  <div 
                    className="prose prose-lg max-w-none text-slate-800"
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
            {/* Clear break before bibliography */}
            <div className="my-16 border-t-4 border-gold/40"></div>
            
            <div className="bibliography-section mb-16">
              <h2 className="text-2xl font-bold text-burgundy mb-8 text-center border-b-2 border-gold pb-2">
                {midrashContent.bibliography.title}
              </h2>
              {renderBibliographyContent(midrashContent.bibliography.content)}
            </div>
          </>
        )}

        {/* Footnotes Section */}
        {midrashContent.footnotesSection && (
          <>
            {/* Clear break before footnotes */}
            <div className="my-16 border-t-4 border-gold/40"></div>
            
            <div className="footnotes-section">
              <h2 className="text-2xl font-bold text-burgundy mb-8 text-center border-b-2 border-gold pb-2">
                {midrashContent.footnotesSection.title}
              </h2>
              {renderFootnotes(midrashContent.footnotesSection.footnotes)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MidrashHaaliyaPage; 