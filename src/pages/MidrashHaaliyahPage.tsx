import React, { useState, useEffect } from 'react';
import { ArrowUp, Download, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { parseMidrashContent, renderContentWithFootnotes, cleanMarkdownEscapes, type MidrashContent } from '../utils/midrashParser';

const MidrashHaaliyahPage: React.FC = () => {
  const navigate = useNavigate();
  const [midrashContent, setMidrashContent] = useState<MidrashContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const loadMidrash = async () => {
      try {
        // Add cache-busting parameter to ensure latest version is loaded
        const timestamp = new Date().getTime();
        const response = await fetch(`/sefarim/midrash-haaliyah.md?v=${timestamp}`, {
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

  const downloadAsPDF = () => {
    // Create a new window with the content for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    if (!midrashContent) return;

    // Generate simple table of contents with specific entries
    const tocContent = `
      <div class="simple-toc-entry">מבוא ........................................................................ pg. 4</div>
      <br>
      <div class="simple-toc-entry">פרק א - גבעת רפידים ....................................................... pg. 5</div>
      <br>
      <div class="simple-toc-entry">פרק ב - הר סיני ............................................................ pg. 27</div>
      <br>
      <div class="simple-toc-entry">פרק ג - הר ההר ............................................................ pg. 51</div>
      <br>
      <div class="simple-toc-entry">מפתח למדרש העלייה ..................................................... pg. 75</div>
    `;

    // Get introduction content
    const introContent = midrashContent.introduction 
      ? midrashContent.introduction.map(line => cleanMarkdownEscapes(line)).join(' ')
      : '';

    // Generate main content with footnotes positioned for page-bottom layout
    const generateMainContentWithFootnotes = () => {
      let pdfContent = '';
      
      midrashContent.chapters.forEach((chapter, chapterIndex) => {
        // Add chapter title page before each chapter
        // For the first chapter, don't add page break since it should flow from introduction
        const titlePageClass = chapterIndex === 0 ? 'chapter-title-page-first' : 'chapter-title-page';
        
        pdfContent += `
          <div class="${titlePageClass}">
            <div class="chapter-title-page-text">${chapter.title}</div>
          </div>
        `;
        
        // Add chapter content
        pdfContent += `
          <div class="chapter-section">
            <h2 class="chapter-title">${chapter.title}</h2>
        `;
        
        chapter.sections.forEach((section) => {
          // Render section content with footnote links and inline footnotes
          const sectionContentWithFootnotes = renderContentWithInlineFootnotes(section.content, midrashContent.allFootnotes);
          
          pdfContent += `
            <div class="section">
              <h3 class="section-title">${section.title}</h3>
              <div class="section-content">${sectionContentWithFootnotes}</div>
            </div>
          `;
        });
        
        pdfContent += `</div>`; // Close chapter-section
      });
      
      return pdfContent;
    };

    // Function to render content with inline footnotes for proper page positioning
    const renderContentWithInlineFootnotes = (content: string, allFootnotes: Record<string, string>): string => {
      // First clean markdown escapes
      const cleanedContent = cleanMarkdownEscapes(content);
      
      // Convert footnote references to just clickable superscript links
      // The footnotes will be collected and positioned separately
      return cleanedContent.replace(/\[(\^[^\]]+)\]/g, (match, footnoteId) => {
        // Extract just the number/letter after the ^
        const footnoteNumber = footnoteId.slice(1); // Remove the ^ symbol
        const footnoteText = allFootnotes[footnoteId] || '';
        
        // Return just the footnote link - the footnote content will be handled by CSS
        return `<sup><a href="#footnote-${footnoteNumber}" id="footnote-ref-${footnoteNumber}" class="footnote-link" data-footnote="${footnoteId}">${footnoteNumber}</a></sup><span class="footnote-content" data-footnote-id="${footnoteNumber}" style="display: none;">${cleanMarkdownEscapes(footnoteText)}</span>`;
      });
    };

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <title>ספר מדרש העלייה</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=David+Libre:wght@400;500;700&display=swap');
          
          body { 
            margin: 0; 
            padding: 40px; 
            font-family: 'David Libre', serif; 
            direction: rtl;
            line-height: 1.6;
          }
          
          .cover-page {
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            page-break-after: always;
            padding: 60px 40px;
            gap: 40px;
          }
          
          .cover-text {
            flex-shrink: 0;
          }
          
          .cover-title {
            font-size: 48px;
            font-weight: bold;
            color: #000000;
            margin-bottom: 0;
          }
          
          .cover-author {
            font-size: 24px;
            color: #000000;
            font-weight: normal;
            margin-bottom: 0;
          }
          
          .cover-image {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            max-width: 100%;
          }
          
          .cover-image img {
            max-width: 520px;
            max-height: 650px;
            width: auto;
            height: auto;
            object-fit: contain;
          }
          
          .toc-page {
            page-break-before: always;
            page-break-after: always;
            padding: 40px 20px;
          }
          
          .toc-title {
            font-size: 36px;
            font-weight: bold;
            color: #000000;
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 15px;
          }
          
          .toc-content {
            max-width: 500px;
            margin: 0 auto;
            text-align: right;
            direction: rtl;
          }
          
          /* Simple table of contents styling */
          .simple-toc-entry {
            font-size: 16px;
            line-height: 1.5;
            font-weight: normal;
            color: #000000;
          }
          
          .intro-page {
            page-break-before: always;
            padding: 40px;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
          }
          
          .intro-title {
            font-size: 24px;
            font-weight: bold;
            color: #000000;
            text-align: center;
            margin-bottom: 30px;
          }
          
          .intro-content {
            text-align: justify;
            font-size: 18px;
            line-height: 1.8;
            color: #374151;
            max-width: 600px;
          }
          
          .main-content {
          }
          
          /* Chapter title page styling */
          .chapter-title-page {
            page-break-before: always;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 40px;
          }
          
          .chapter-title-page-first {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 40px;
          }
          
          .bibliography-title-page {
            page-break-before: always;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 40px;
          }
          
          .chapter-title-page-text {
            font-size: 60px;
            font-weight: bold;
            color: #000000;
            line-height: 1.2;
          }
          
          /* Center all headers and sub-headers */
          .chapter-title, h2, h3, h4, h5, h6 {
            text-align: center !important;
          }
          
          /* Remove underline from footnote links */
          sup a.footnote-link {
            text-decoration: none !important;
          }
          
          .chapter-title {
            color: #000000;
            font-weight: bold;
            font-size: 24px;
            text-align: center;
            margin: 40px 0 20px 0;
          }
          
          .section-title {
            color: #000000;
            font-weight: 600;
            font-size: 20px;
            text-align: center;
            margin: 30px 0 15px 0;
          }
          
          .section-content {
            text-align: justify;
            color: #374151;
            margin-bottom: 20px;
            line-height: 1.7;
          }
          
          /* Justify all text content in the sefer */
          .midrash-content, .midrash-content p, .midrash-content div {
            text-align: justify !important;
          }
          
          /* Ensure headers stay centered */
          .midrash-content h2, .midrash-content h3, .midrash-content h4 {
            text-align: center !important;
          }
          
          .bibliography-section {
          }
          
          .bibliography-content {
            column-count: 3;
            column-gap: 20px;
            column-rule: 1px solid #6B7280;
          }
          
          .bibliography-content .grid > div {
            break-inside: avoid;
            margin-bottom: 10px;
          }
          
          /* Specific page breaks for chapters */
          .chapter-break-19 {
            page-break-before: always;
          }
          
          .chapter-break-35 {
            page-break-before: always;
          }
          
          .page-break-before {
            page-break-before: always;
          }
          
          .section-header {
            font-size: 28px;
            font-weight: bold;
            color: #000000;
            text-align: center;
            margin-bottom: 30px;
          }
          
          /* Page footnotes styling for PDF - positioned at bottom of each page */
          .page-footnote {
            font-size: 12px;
            line-height: 1.4;
            color: #374151;
            margin-bottom: 4px;
            padding: 2px 0;
            display: block;
            page-break-inside: avoid;
          }
          
          .page-footnote-number {
            font-weight: bold;
            color: #2563eb;
            margin-left: 6px;
            display: inline-block;
            min-width: 18px;
          }
          
          .page-footnote-text {
            text-align: justify;
            display: inline;
          }
          
          /* Footnote area styling */
          .footnote-area {
            margin-top: auto;
            padding-top: 12px;
            border-top: 1px solid #000000;
            min-height: 60px;
          }
          
          @media print {
            body { margin: 0; }
            .page-break { page-break-before: always; }
            
            /* Enhanced print layout */
            @page {
              margin: 0.5in 0.5in 0.5in 0.5in;
              size: A4;
            }
            
            /* Page layout with footnotes at bottom */
            .page-content {
              min-height: calc(100vh - 100px);
              display: flex;
              flex-direction: column;
            }
            
            .main-text {
              flex-grow: 1;
            }
            
            .footnote-area {
              margin-top: auto;
              border-top: 1px solid #000000;
              padding-top: 8px;
              font-size: 11px;
              line-height: 1.3;
            }
            
            .page-footnote {
              font-size: 11px !important;
              line-height: 1.3 !important;
              text-align: justify !important;
              margin-bottom: 3px !important;
              padding: 1px 0 !important;
              page-break-inside: avoid !important;
            }
            
            .page-footnote-number {
              font-weight: bold !important;
              color: #2563eb !important;
              margin-left: 6px !important;
              display: inline-block !important;
              min-width: 18px !important;
            }
            
            .page-footnote-text {
              text-align: justify !important;
              display: inline !important;
            }
            
            /* Alternative footnote approach */
            .footnote-content {
              display: none !important;
            }
            
            /* Create footnote areas at page bottom */
            .page-footnote-area {
              position: fixed;
              bottom: 1in;
              left: 0.5in;
              right: 0.5in;
              border-top: 1px solid #000000;
              padding-top: 8px;
              font-size: 11px;
              line-height: 1.3;
              background: white;
            }
            
            .collected-footnote {
              margin-bottom: 3px;
              text-align: justify;
            }
            
            .collected-footnote-number {
              font-weight: bold;
              color: #2563eb;
              margin-left: 6px;
              display: inline-block;
              min-width: 18px;
            }
            
            /* Hide browser headers and footers */
            @page {
              @top-left { content: ""; }
              @top-center { content: ""; }
              @top-right { content: ""; }
              @bottom-left { 
                content: counter(page);
                font-family: 'David Libre', serif;
                font-size: 12px;
                color: #666666;
              }
              @bottom-center { content: ""; }
              @bottom-right { content: ""; }
            }
            
            /* Ensure no browser-generated content appears */
            body {
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
          }
        </style>
        <script>
          // Simple approach - create footnote areas with dividing lines
          document.addEventListener('DOMContentLoaded', function() {
            // Convert hidden footnote content to visible footnotes in areas
            const footnoteContents = document.querySelectorAll('.footnote-content');
            footnoteContents.forEach(function(content) {
              const footnoteId = content.getAttribute('data-footnote-id');
              const footnoteText = content.textContent;
              
              // Create footnote element (footnoteId already has ^ removed from renderContentWithInlineFootnotes)
              const footnoteDiv = document.createElement('div');
              footnoteDiv.className = 'page-footnote';
              footnoteDiv.id = 'footnote-' + footnoteId;
              footnoteDiv.innerHTML = '<span class="page-footnote-number">' + footnoteId + '</span><span class="page-footnote-text">' + footnoteText + '</span>';
              
              // Find or create footnote area for this page/section
              let footnoteArea = content.closest('.section').querySelector('.footnote-area');
              if (!footnoteArea) {
                footnoteArea = document.createElement('div');
                footnoteArea.className = 'footnote-area';
                content.closest('.section').appendChild(footnoteArea);
              }
              
              footnoteArea.appendChild(footnoteDiv);
              content.remove();
            });
          });
        </script>
      </head>
      <body>
        <!-- Cover Page -->
        <div class="cover-page">
          <div class="cover-text">
            <div class="cover-title">ספר מדרש העלייה</div>
            <div class="cover-author">נכתב ע״י רון שמואל בן נדב צבי הכהן</div>
          </div>
          <div class="cover-image">
            <img src="/images/moshe_aharon_hur_img.png" alt="משה אהרון וחור" />
          </div>
        </div>
        
        <!-- Table of Contents Page -->
        <div class="toc-page">
          <div class="toc-title">תוכן העניינים</div>
          <div class="toc-content">
            ${tocContent}
          </div>
        </div>
        
        <!-- Introduction Page -->
        ${introContent ? `
        <div class="intro-page">
          <div class="intro-title">מבוא</div>
          <div class="intro-content">
            ${introContent}
          </div>
        </div>
        ` : ''}
        
        <!-- Main Content with Section Footnotes -->
        <div class="main-content">
          ${generateMainContentWithFootnotes()}
        </div>
        
        ${midrashContent.bibliography ? `
        <!-- Bibliography Title Page -->
        <div class="bibliography-title-page">
          <div class="chapter-title-page-text">${midrashContent.bibliography.title}</div>
        </div>
        
        <!-- Bibliography Section -->
        <div class="bibliography-section">
          <div class="bibliography-content">
            ${midrashContent.bibliography.content.split('\n').filter(line => line.trim()).map(line => {
              if (line.startsWith('**') && line.endsWith('**')) {
                return `<h4>${line.replace(/\*\*/g, '')}</h4>`;
              } else {
                return `<div>${line}</div>`;
              }
            }).join('')}
          </div>
        </div>
        ` : ''}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 1500);
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
          <div key={index} className="mb-6 text-center">
                            <h4 className="text-lg font-semibold text-black mb-3 text-center">
              {section.title}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2 justify-center">
              {section.entries.map((entry, entryIndex) => (
                <div key={entryIndex} className="text-sm text-black p-2 bg-parchment/50 rounded text-center">
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
        <div>
          {sortedFootnotes.map(([id, content]) => {
            const footnoteNumber = id.slice(1); // Remove the ^ symbol
            return (
              <div key={id} id={`footnote-${footnoteNumber}`} className="footnote-item">
                <a 
                  href={`#footnote-ref-${footnoteNumber}`} 
                  className="footnote-number font-semibold text-blue-600 ml-1"
                  title="חזור לטקסט"
                >
                  {footnoteNumber}
                </a>
                <span className="footnote-text text-black">{cleanMarkdownEscapes(content)}</span>
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

  if (!midrashContent) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center" dir="rtl">
        <div className="text-biblical-brown text-xl font-hebrew">לא נמצא תוכן</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment" dir="rtl">
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
          {/* Desktop Layout - Button to the left */}
          <button
            onClick={downloadAsPDF}
            className="no-print hidden md:flex absolute left-0 top-1/2 transform -translate-y-1/2 items-center gap-2 px-4 py-2 bg-biblical-burgundy text-white rounded-lg hover:bg-biblical-burgundy/90 transition-colors duration-200"
            title="הורד כ-PDF"
          >
            <Download size={20} />
            <span className="font-hebrew">הורד PDF</span>
          </button>
          
          <h1 className="text-5xl font-bold text-black font-hebrew mb-2">
            {midrashContent.title}
          </h1>
          
          {/* Mobile Layout - Button below header */}
          <button
            onClick={downloadAsPDF}
            className="no-print flex md:hidden items-center gap-2 px-4 py-2 mt-4 mx-auto bg-biblical-burgundy text-white rounded-lg hover:bg-biblical-burgundy/90 transition-colors duration-200"
            title="הורד כ-PDF"
          >
            <Download size={20} />
            <span className="font-hebrew">הורד PDF</span>
          </button>
        </div>

        {/* Introduction Section */}
        {midrashContent.introduction && (
          <div className="introduction-section mb-12 bg-white/70 rounded-lg p-6 border border-biblical-gold/20">
            <div className="max-w-none text-black font-hebrew text-lg leading-relaxed">
              <p className="mb-0 text-right">
                {midrashContent.introduction.map(line => cleanMarkdownEscapes(line)).join(' ')}
              </p>
            </div>
          </div>
        )}

        {/* Table of Contents */}
        <div className="table-of-contents mb-16">
          <h2 className="text-3xl font-bold text-black mb-8 text-center">
            תוכן העניינים
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Right Container - Sefer Midrash HaAliyah */}
            <div className="bg-gradient-to-br from-white/90 to-parchment/70 rounded-lg p-6 border-2 border-biblical-gold/30 shadow-lg">
              <h3 className="text-xl font-bold text-biblical-brown mb-4 text-center border-b border-biblical-gold/30 pb-2">
                ספר מדרש העלייה
              </h3>
              <div className="text-sm font-hebrew text-center space-y-1">
                {midrashContent.chapters.map((chapter, index) => (
                  <a 
                    key={chapter.id} 
                    href={`#chapter-${chapter.id}`} 
                    className="block text-black hover:text-blue-600 hover:bg-blue-50 rounded px-2 py-1 transition-all duration-200"
                  >
                    {chapter.title}
                  </a>
                ))}
              </div>
            </div>

            {/* Middle Container - Bibliography */}
            <a href="#bibliography-section" className="block bg-gradient-to-br from-white/90 to-parchment/70 rounded-lg p-6 border-2 border-biblical-gold/30 shadow-lg hover:shadow-xl hover:border-biblical-gold/50 transition-all duration-300">
              <h3 className="text-xl font-bold text-biblical-brown mb-4 text-center border-b border-biblical-gold/30 pb-2">
                מפתח למדרש העלייה
              </h3>
              <div className="text-sm text-black font-hebrew text-center">
                <div>ביבליוגרפיה לכל המקורות המצוטטים בספר</div>
                <div>תורה, תלמוד, מדרשים, ראשונים ועוד</div>
              </div>
            </a>

            {/* Left Container - Footnotes */}
            <a href="#footnotes-section" className="block bg-gradient-to-br from-white/90 to-parchment/70 rounded-lg p-6 border-2 border-biblical-gold/30 shadow-lg hover:shadow-xl hover:border-biblical-gold/50 transition-all duration-300">
              <h3 className="text-xl font-bold text-biblical-brown mb-4 text-center border-b border-biblical-gold/30 pb-2">
                הערות
              </h3>
              <div className="text-sm text-black font-hebrew text-center">
                <div>הערות שוליים לכל המקורות המצוטטים בספר</div>
                <div>תורה, תלמוד, מדרשים, ראשונים ועוד</div>
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
          <h2 className="text-3xl font-bold text-black">
            ספר מדרש העלייה
          </h2>
        </div>

        {/* Main Content */}
        <div className="midrash-content-container">
          <div id="main-content" className="midrash-content font-hebrew text-lg leading-relaxed">
            {midrashContent.chapters.map((chapter) => (
              <div key={chapter.id} id={`chapter-${chapter.id}`} className="mb-12">
                {/* Chapter Title */}
                <h2 className="text-2xl font-bold text-black mb-6 text-center">
                  {chapter.title}
                </h2>
                
                {/* Chapter Sections */}
                {chapter.sections.map((section) => (
                  <div key={section.id} className="mb-8">
                    {/* Section Title */}
                    <h3 className="text-xl font-semibold text-black mb-4 text-center">
                      {section.title}
                    </h3>
                    
                    {/* Section Content */}
                    <div 
                      className="prose prose-lg max-w-none text-black text-right"
                      dangerouslySetInnerHTML={{ 
                        __html: renderContentWithFootnotes(section.content) 
                      }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Completion Phrase */}
          <div className="text-center mt-16 mb-8">
            <div className="text-3xl font-bold text-black font-hebrew">
              תושלב״ע - תם ונשלם שבח לא-ל בורא עולם
            </div>
          </div>

          {/* Bibliography Section */}
          {midrashContent.bibliography && (
            <>
              {/* Decorative section separator */}
              <div className="section-separator my-8">
                <div className="border-t-4 border-biblical-gold/40"></div>
              </div>
              
              <div className="bibliography-section mb-16">
                <h2 id="bibliography-section" className="text-3xl font-bold text-black mb-8 text-center">
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
                <h2 id="footnotes-section" className="text-3xl font-bold text-black mb-8 text-center">
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