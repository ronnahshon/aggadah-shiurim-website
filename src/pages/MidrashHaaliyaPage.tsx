import React, { useState, useEffect } from 'react';
import { parseMidrashContent, renderContentWithFootnotes, type MidrashContent } from '../utils/midrashParser';

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
    tooltip.innerHTML = content;
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

        {/* Content */}
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
      </div>
    </div>
  );
};

export default MidrashHaaliyaPage; 