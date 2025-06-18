import React, { useState, useEffect } from 'react';
import { ArrowUp, Download } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import {
  parseDaroshDarashMosheContent,
  generateTableOfContents,
  renderContentWithFootnotes,
  cleanMarkdownFormatting,
  type DaroshContent,
  type DaroshTableOfContents
} from '../utils/daroshDarashMosheParser';

const DaroshDarashMoshePage: React.FC = () => {
  const [daroshContent, setDaroshContent] = useState<DaroshContent | null>(null);
  const [tableOfContents, setTableOfContents] = useState<DaroshTableOfContents | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  
  // Resizable columns state
  const [tocWidth, setTocWidth] = useState(18); // percentage
  const [mainWidth, setMainWidth] = useState(50); // percentage
  const [footnotesWidth, setFootnotesWidth] = useState(32); // percentage
  const [isResizing, setIsResizing] = useState<'toc-main' | 'main-footnotes' | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const timestamp = new Date().getTime();
        
        // Load main content and footnotes
        const [mainResponse, footnotesResponse] = await Promise.all([
          fetch(`/darosh-darash-moshe.md?v=${timestamp}`, {
            cache: 'no-cache',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          }),
          fetch(`/darosh-darash-moshe-footnotes.md?v=${timestamp}`, {
            cache: 'no-cache',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          })
        ]);

        if (!mainResponse.ok || !footnotesResponse.ok) {
          throw new Error('Failed to load sefer content');
        }

        const mainText = await mainResponse.text();
        const footnotesText = await footnotesResponse.text();

        const parsed = parseDaroshDarashMosheContent(mainText, footnotesText);
        const toc = generateTableOfContents(parsed);

        setDaroshContent(parsed);
        setTableOfContents(toc);
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
      
      // Update active section based on scroll position
      const sections = document.querySelectorAll('[data-section-id]');
      let currentSection = '';
      
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 100) {
          currentSection = section.getAttribute('data-section-id') || '';
        }
      });
      
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleFootnoteClick = (footnoteNum: string, chapterContext?: string) => {
    const footnoteId = chapterContext ? `footnote-${chapterContext}-${footnoteNum}` : `footnote-${footnoteNum}`;
    const footnoteElement = document.getElementById(footnoteId);
    if (footnoteElement) {
      footnoteElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the footnote briefly
      footnoteElement.classList.add('highlight-footnote');
      setTimeout(() => {
        footnoteElement.classList.remove('highlight-footnote');
      }, 2000);
    }
  };

  // Add click handlers for footnote links
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('footnote-link')) {
        e.preventDefault();
        const footnoteNum = target.getAttribute('data-footnote');
        const chapterContext = target.getAttribute('data-chapter');
        if (footnoteNum) {
          handleFootnoteClick(footnoteNum, chapterContext || undefined);
        }
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  // Resize functionality
  const handleMouseDown = (divider: 'toc-main' | 'main-footnotes') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(divider);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const containerWidth = window.innerWidth;
      const mouseX = e.clientX;
      const mousePercentage = (mouseX / containerWidth) * 100;

      if (isResizing === 'toc-main') {
        // Constrain TOC width between 10% and 30%
        const newTocWidth = Math.max(10, Math.min(30, mousePercentage));
        const remainingWidth = 100 - newTocWidth;
        const mainFootnotesRatio = mainWidth / (mainWidth + footnotesWidth);
        
        setTocWidth(newTocWidth);
        setMainWidth(remainingWidth * mainFootnotesRatio);
        setFootnotesWidth(remainingWidth * (1 - mainFootnotesRatio));
      } else if (isResizing === 'main-footnotes') {
        // Calculate based on the current TOC width
        const availableWidth = 100 - tocWidth;
        const dividerPosition = mousePercentage - tocWidth;
        const mainPercentage = Math.max(20, Math.min(60, (dividerPosition / availableWidth) * 100));
        
        setMainWidth((availableWidth * mainPercentage) / 100);
        setFootnotesWidth((availableWidth * (100 - mainPercentage)) / 100);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, tocWidth, mainWidth, footnotesWidth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-biblical-cream via-biblical-sand to-biblical-cream">
        <div className="text-biblical-brown text-xl">Loading sefer...</div>
      </div>
    );
  }

  if (error || !daroshContent || !tableOfContents) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-biblical-cream via-biblical-sand to-biblical-cream">
        <div className="text-red-600 text-xl">Error: {error || 'Failed to load content'}</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Darosh Darash Moshe - Midrash Aggadah</title>
        <meta name="description" content="The life and legacy of Moshe Rabbeinu through the lens of Midrash Aggadah - A comprehensive work exploring three ascents of Moshe Rabbeinu." />
        <link rel="canonical" href="https://www.midrashaggadah.com/sefer/darosh-darash-moshe" />
      </Helmet>

      {/* Note: No Layout wrapper as specified - no global side menu */}
      <div className="min-h-screen bg-gradient-to-br from-biblical-cream via-biblical-sand to-biblical-cream">
        {/* Three-column layout */}
        <div className="flex max-w-full w-full">
          {/* Left Column - Table of Contents */}
          <div 
            style={{ width: `${tocWidth}%` }}
            className="min-w-[200px] bg-biblical-sage/10 sticky top-0 h-screen overflow-y-auto"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-biblical-brown mb-6 border-b-2 border-biblical-brown/30 pb-2">
                Table of Contents
              </h2>
              


              {/* Chapters */}
              {tableOfContents.chapters.map((chapter) => (
                <div key={chapter.id} className="mb-4">
                  <button
                    onClick={() => scrollToSection(chapter.id)}
                    className={`block w-full text-left p-2 font-semibold rounded hover:bg-biblical-brown/10 transition-colors ${
                      activeSection === chapter.id ? 'bg-biblical-brown/15' : ''
                    }`}
                  >
                    {chapter.title}
                  </button>
                  
                  {/* Parts */}
                  <div className="ml-4 mt-2">
                    {chapter.parts.map((part) => (
                      <div key={part.id} className="mb-2">
                        <button
                          onClick={() => scrollToSection(part.id)}
                          className={`block w-full text-left p-1 text-sm rounded hover:bg-biblical-brown/10 transition-colors ${
                            activeSection === part.id ? 'bg-biblical-brown/15 font-medium' : ''
                          }`}
                        >
                          {part.title}
                        </button>
                        
                        {/* Sections - Filter out Introduction sections */}
                        <div className="ml-4 mt-1">
                          {part.sections
                            .filter((section) => !section.title.toLowerCase().includes('introduction'))
                            .map((section) => (
                            <button
                              key={section.id}
                              onClick={() => scrollToSection(section.id)}
                              className={`block w-full text-left p-1 text-xs text-biblical-brown/80 rounded hover:bg-biblical-brown/10 transition-colors ${
                                activeSection === section.id ? 'bg-biblical-brown/15 font-medium' : ''
                              }`}
                            >
                              {section.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resize Handle - TOC/Main */}
          <div
            className="w-1 bg-biblical-brown/30 hover:bg-biblical-brown/50 cursor-col-resize transition-colors duration-200 group relative"
            onMouseDown={handleMouseDown('toc-main')}
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-8 bg-biblical-brown/40 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>

          {/* Middle Column - Main Content */}
          <div 
            style={{ width: `${mainWidth}%` }}
            className="min-w-[480px] pl-8 pr-2 py-6 h-screen overflow-y-auto"
          >
            <div className="w-full text-center">
              {/* Disclaimer */}
              <div className="mb-6 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-md">
                <p className="text-sm text-yellow-800 font-medium">
                  Note: This page is still a work in progress
                </p>
              </div>

              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-biblical-brown mb-2">
                  {daroshContent.title}
                </h1>
                <p className="text-xl text-biblical-brown/80 italic">
                  The life and legacy of Moshe Rabbeinu through the lens of Midrash Aggadah
                </p>
              </div>

              {/* General Introduction */}
              <section id="general-introduction" data-section-id="general-introduction" className="mb-16">
                <div className="text-center mb-10 py-8 px-6 bg-gradient-to-r from-biblical-brown/20 via-biblical-brown/25 to-biblical-brown/20 rounded-xl border-2 border-biblical-brown/30 shadow-md">
                  <h2 className="text-3xl font-bold text-biblical-brown mb-3">
                    General Introduction
                  </h2>
                  <div className="w-32 h-1.5 bg-biblical-brown/50 mx-auto rounded"></div>
                </div>
                              <div
                className="prose prose-biblical max-w-none text-biblical-brown leading-relaxed text-justify"
                dangerouslySetInnerHTML={{
                  __html: cleanMarkdownFormatting(
                    renderContentWithFootnotes(daroshContent.generalIntroduction, daroshContent.allFootnotes, 'general')
                  )
                }}
              />
              </section>

              {/* Chapters */}
              {daroshContent.chapters.map((chapter) => (
                <section key={chapter.id} id={chapter.id} data-section-id={chapter.id} className="mb-16">
                  <div className="text-center mb-12 py-10 px-8 bg-gradient-to-r from-biblical-brown/25 via-biblical-brown/35 to-biblical-brown/25 rounded-2xl border-3 border-biblical-brown/40 shadow-lg">
                    <h2 className="text-4xl font-bold text-biblical-brown mb-4">
                      {chapter.title}
                    </h2>
                    <div className="w-40 h-2 bg-biblical-brown/60 mx-auto rounded-full"></div>
                  </div>

                  {/* Chapter General Introduction */}
                  {chapter.generalIntroduction && (
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-biblical-brown mb-3">General Introduction</h3>
                      <div
                        className="prose prose-biblical max-w-none text-biblical-brown leading-relaxed text-justify"
                        dangerouslySetInnerHTML={{
                          __html: cleanMarkdownFormatting(
                            renderContentWithFootnotes(chapter.generalIntroduction, daroshContent.allFootnotes, chapter.id)
                          )
                        }}
                      />
                    </div>
                  )}

                  {/* Parts */}
                  {chapter.parts.map((part) => (
                    <div key={part.id} id={part.id} data-section-id={part.id} className="mb-12">
                      <div className="text-center mb-8 py-6 px-4 bg-gradient-to-r from-biblical-brown/10 via-biblical-brown/15 to-biblical-brown/10 rounded-lg border-2 border-biblical-brown/20 shadow-sm">
                        <h3 className="text-2xl font-bold text-biblical-brown mb-2">
                          {part.title}
                        </h3>
                        <div className="w-24 h-1 bg-biblical-brown/40 mx-auto rounded"></div>
                      </div>

                      {/* Part Introduction */}
                      {part.introduction && (
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-biblical-brown mb-2">Introduction</h4>
                          <div
                            className="prose prose-biblical max-w-none text-biblical-brown leading-relaxed text-justify"
                            dangerouslySetInnerHTML={{
                              __html: cleanMarkdownFormatting(
                                renderContentWithFootnotes(part.introduction, daroshContent.allFootnotes, chapter.id)
                              )
                            }}
                          />
                        </div>
                      )}

                      {/* Sections */}
                      {part.sections.map((section) => (
                        <div key={section.id} id={section.id} data-section-id={section.id} className="mb-10">
                          <div className="text-center mb-6 py-4 px-3 bg-biblical-cream/80 rounded-md border border-biblical-brown/15 shadow-xs">
                            <h4 className="text-xl font-semibold text-biblical-brown mb-1">
                              {section.title}
                            </h4>
                            <div className="w-16 h-0.5 bg-biblical-brown/30 mx-auto rounded"></div>
                          </div>
                          <div
                            className="prose prose-biblical max-w-none text-biblical-brown leading-relaxed text-justify"
                            dangerouslySetInnerHTML={{
                              __html: cleanMarkdownFormatting(
                                renderContentWithFootnotes(section.content, daroshContent.allFootnotes, chapter.id)
                              )
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </section>
              ))}
            </div>
          </div>

          {/* Resize Handle - Main/Footnotes */}
          <div
            className="w-1 bg-biblical-brown/30 hover:bg-biblical-brown/50 cursor-col-resize transition-colors duration-200 group relative"
            onMouseDown={handleMouseDown('main-footnotes')}
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-8 bg-biblical-brown/40 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>

          {/* Right Column - Footnotes */}
          <div 
            style={{ width: `${footnotesWidth}%` }}
            className="min-w-[480px] bg-biblical-brown/5 sticky top-0 h-screen overflow-y-auto"
          >
            <div className="p-6 footnotes-content">
              <h2 className="text-xl font-bold text-biblical-brown mb-6 border-b-2 border-biblical-brown/30 pb-2">
                Footnotes
              </h2>
              
              {/* Render hierarchical footnotes */}
              {daroshContent.footnoteStructure.map((chapter) => {
                // Extract chapter context from footnote chapter ID
                // footnotes-chapter-i -> chapter-i, footnotes-chapter-ii -> chapter-ii, etc.
                const chapterContext = chapter.id.replace('footnotes-', '');
                
                return (
                  <div key={chapter.id} className="mb-8">
                    {/* Chapter Header */}
                    <h3 className="text-lg font-bold text-biblical-brown mb-4 border-b border-biblical-brown/20 pb-1">
                      {chapter.title}
                    </h3>
                    
                    {/* Sections within Chapter */}
                    {chapter.sections.map((section) => (
                      <div key={section.id} className="mb-6">
                        {/* Section Header */}
                        <h4 className="text-md font-semibold text-biblical-brown mb-3 pl-2 border-l-2 border-biblical-brown/30">
                          {section.title}
                        </h4>
                        
                        {/* Footnotes within Section */}
                        {section.footnotes.map((footnote) => (
                          <div key={footnote.number} className="mb-6 ml-4 relative">
                            {/* Footnote Number - Above Container */}
                            <div 
                              id={`footnote-${chapterContext}-${footnote.number}`}
                              className="mb-2 ml-2"
                            >
                              <span className="inline-block px-3 py-1 bg-biblical-brown text-white text-sm font-bold rounded-t-md border-2 border-biblical-brown/20 border-b-0">
                                {footnote.number}
                              </span>
                            </div>
                            
                                                         {/* Footnote Content Container */}
                             <div className="p-4 bg-white/80 rounded-lg rounded-tl-none shadow-md border-2 border-biblical-brown/20 transition-colors duration-500">
                               <div
                                 className="text-sm text-biblical-brown/90 leading-relaxed"
                                 dangerouslySetInnerHTML={{
                                   __html: cleanMarkdownFormatting(footnote.content).replace(/^\*+|\*+$/g, '').replace(/\*+/g, '')
                                 }}
                               />
                             </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Back to Top Button */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 bg-biblical-brown text-white p-3 rounded-full shadow-lg hover:bg-biblical-brown/90 transition-all duration-300 z-50"
            aria-label="Back to top"
          >
            <ArrowUp size={20} />
          </button>
        )}

      </div>

      {/* Custom styles for footnote highlighting */}
      <style>{`
        .highlight-footnote {
          background-color: rgba(139, 69, 19, 0.15) !important;
          border-color: rgba(139, 69, 19, 0.3) !important;
        }
        
        .footnote-link {
          color: #8B4513;
          text-decoration: none;
          font-weight: 600;
        }
        
        .footnote-link:hover {
          text-decoration: underline;
          color: #654321;
        }
        
        .prose-biblical {
          color: #654321;
          text-align: justify !important;
          text-align-last: left !important;
        }
        
        .prose-biblical p {
          margin-bottom: 1rem;
          text-align: justify !important;
          text-align-last: left !important;
        }
        
        .prose-biblical h1,
        .prose-biblical h2,
        .prose-biblical h3,
        .prose-biblical h4,
        .prose-biblical h5,
        .prose-biblical h6 {
          text-align: center !important;
        }
        
        .prose-biblical strong {
          color: #8B4513;
          font-weight: 600;
        }
        
        .prose-biblical em {
          font-style: italic;
        }
        
        /* Override italics in footnotes section */
        .footnotes-content em,
        .footnotes-content i {
          font-style: normal !important;
        }
        
        /* Left justify footnotes */
        .footnotes-content p,
        .footnotes-content div {
          text-align: left !important;
          text-align-last: left !important;
        }
      `}</style>
    </>
  );
};

export default DaroshDarashMoshePage; 