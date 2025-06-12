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

  const handleFootnoteClick = (footnoteNum: string) => {
    const footnoteElement = document.getElementById(`footnote-${footnoteNum}`);
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
        if (footnoteNum) {
          handleFootnoteClick(footnoteNum);
        }
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

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
          <div className="w-[15%] min-w-[200px] bg-biblical-sage/10 border-r-2 border-biblical-brown/20 sticky top-0 h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-biblical-brown mb-6 border-b-2 border-biblical-brown/30 pb-2">
                Table of Contents
              </h2>
              
              {/* General Introduction */}
              <div className="mb-4">
                <button
                  onClick={() => scrollToSection('general-introduction')}
                  className={`block w-full text-left p-2 rounded hover:bg-biblical-brown/10 transition-colors ${
                    activeSection === 'general-introduction' ? 'bg-biblical-brown/15 font-semibold' : ''
                  }`}
                >
                  General Introduction
                </button>
              </div>

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
                        
                        {/* Sections */}
                        <div className="ml-4 mt-1">
                          {part.sections.map((section) => (
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

          {/* Middle Column - Main Content */}
          <div className="w-[42.5%] min-w-[480px] px-8 py-6 h-screen overflow-y-auto">
            <div className="max-w-4xl">
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
              <section id="general-introduction" data-section-id="general-introduction" className="mb-12">
                <h2 className="text-2xl font-bold text-biblical-brown mb-4 border-b-2 border-biblical-brown/30 pb-2">
                  General Introduction
                </h2>
                <div
                  className="prose prose-biblical max-w-none text-biblical-brown leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: cleanMarkdownFormatting(
                      renderContentWithFootnotes(daroshContent.generalIntroduction, daroshContent.allFootnotes)
                    )
                  }}
                />
              </section>

              {/* Chapters */}
              {daroshContent.chapters.map((chapter) => (
                <section key={chapter.id} id={chapter.id} data-section-id={chapter.id} className="mb-12">
                  <h2 className="text-3xl font-bold text-biblical-brown mb-6 border-b-2 border-biblical-brown/30 pb-2">
                    {chapter.title}
                  </h2>

                  {/* Chapter General Introduction */}
                  {chapter.generalIntroduction && (
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-biblical-brown mb-3">General Introduction</h3>
                      <div
                        className="prose prose-biblical max-w-none text-biblical-brown leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: cleanMarkdownFormatting(
                            renderContentWithFootnotes(chapter.generalIntroduction, daroshContent.allFootnotes)
                          )
                        }}
                      />
                    </div>
                  )}

                  {/* Parts */}
                  {chapter.parts.map((part) => (
                    <div key={part.id} id={part.id} data-section-id={part.id} className="mb-10">
                      <h3 className="text-2xl font-semibold text-biblical-brown mb-4 border-l-4 border-biblical-brown/40 pl-4">
                        {part.title}
                      </h3>

                      {/* Part Introduction */}
                      {part.introduction && (
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-biblical-brown mb-2">Introduction</h4>
                          <div
                            className="prose prose-biblical max-w-none text-biblical-brown leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: cleanMarkdownFormatting(
                                renderContentWithFootnotes(part.introduction, daroshContent.allFootnotes)
                              )
                            }}
                          />
                        </div>
                      )}

                      {/* Sections */}
                      {part.sections.map((section) => (
                        <div key={section.id} id={section.id} data-section-id={section.id} className="mb-8">
                          <h4 className="text-xl font-medium text-biblical-brown mb-3">
                            {section.title}
                          </h4>
                          <div
                            className="prose prose-biblical max-w-none text-biblical-brown leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: cleanMarkdownFormatting(
                                renderContentWithFootnotes(section.content, daroshContent.allFootnotes)
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

          {/* Right Column - Footnotes */}
          <div className="w-[42.5%] min-w-[480px] bg-biblical-brown/5 border-l-2 border-biblical-brown/20 sticky top-0 h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-biblical-brown mb-6 border-b-2 border-biblical-brown/30 pb-2">
                Footnotes
              </h2>
              
              {/* Render hierarchical footnotes */}
              {daroshContent.footnoteStructure.map((chapter) => (
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
                          <div
                            key={footnote.number}
                            id={`footnote-${footnote.number}`}
                            className="mb-6 ml-4 p-4 bg-white/80 rounded-lg shadow-md border-2 border-biblical-brown/20 transition-colors duration-500"
                          >
                            <div
                              className="text-sm text-biblical-brown/90 leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: `<strong>${footnote.number}.</strong> ${cleanMarkdownFormatting(footnote.content)}`
                              }}
                            />
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              ))}
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
        }
        
        .prose-biblical p {
          margin-bottom: 1rem;
        }
        
        .prose-biblical strong {
          color: #8B4513;
          font-weight: 600;
        }
        
        .prose-biblical em {
          font-style: italic;
        }
      `}</style>
    </>
  );
};

export default DaroshDarashMoshePage; 