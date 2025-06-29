import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, Download } from 'lucide-react';
import { Shiur } from '@/types/shiurim';
import { formatTitle, getAudioDuration } from '@/utils/dataUtils';
import { generateShiurStructuredData, generateBreadcrumbStructuredData, generateMetaDescription, generateKeywords } from '@/utils/seoUtils';
import { getAudioUrl, getGoogleDriveDownloadUrl, getPdfUrl } from '@/utils/s3Utils';
import SEOHead from '@/components/seo/SEOHead';
import AudioPlayer from '@/components/common/AudioPlayer';
import SourceSheetRenderer from '@/components/common/SourceSheetRenderer';
import SocialShareButtons from '@/components/common/SocialShareButtons';
import { useIsMobile } from '@/hooks/use-mobile';

const ShiurPage: React.FC = () => {
  const { shiurId } = useParams<{ shiurId: string }>();
  const [shiur, setShiur] = useState<Shiur | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [audioDuration, setAudioDuration] = useState<string | null>(null);
  const [loadingDuration, setLoadingDuration] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (shiurId) {
      // Load shiurim data from public folder
      const loadShiurData = async () => {
        try {
          const response = await fetch('/data/shiurim_data.json');
          if (!response.ok) {
            throw new Error('Failed to load shiurim data');
          }
          const data = await response.json();
          const shiurimData = data as Shiur[];
          const foundShiur = shiurimData.find(s => s.id === shiurId);
          
          if (foundShiur) {
            setShiur(foundShiur);
            
            // First check if the shiur has a pre-loaded length in the data
            if ('length' in foundShiur && foundShiur.length) {
              setAudioDuration(foundShiur.length as string);
            }
            // If not, fetch it dynamically
            else {
              fetchAudioDuration(foundShiur.id);
            }
          } else {
            setNotFound(true);
          }
        } catch (error) {
          console.error('Error loading shiur data:', error);
          setNotFound(true);
        } finally {
          setLoading(false);
        }
      };

      loadShiurData();
    }
  }, [shiurId]);

  // Fetch the actual audio duration from the file
  const fetchAudioDuration = async (shiurId: string) => {
    try {
      setLoadingDuration(true);
      const duration = await getAudioDuration(shiurId);
      setAudioDuration(duration);
    } catch (error) {
      console.error('Error fetching audio duration:', error);
      setAudioDuration("--:--");
    } finally {
      setLoadingDuration(false);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen py-12">
        <div className="content-container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-biblical-brown mb-4">Shiur Not Found</h1>
            <p className="text-biblical-brown mb-6">The shiur you're looking for doesn't exist or has been moved.</p>
            <Link 
              to="/catalog" 
              className="px-6 py-3 bg-biblical-burgundy text-white rounded-md hover:bg-opacity-90 transition-colors"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!shiur) {
    return (
      <div className="min-h-screen py-12">
        <div className="content-container">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-biblical-brown">Loading shiur...</p>
          </div>
        </div>
      </div>
    );
  }

  const isGoogleDoc = shiur.source_sheet_link && shiur.source_sheet_link.includes('docs.google.com');
  const audioUrl = getAudioUrl(`${shiur.id}.mp3`);
  const googleDriveDownloadUrl = getGoogleDriveDownloadUrl(shiur.audio_recording_link);

  // SEO data
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://midrashaggadah.com';
  const structuredData = generateShiurStructuredData(shiur, baseUrl);
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Catalog', url: '/catalog' },
    { name: formatTitle(shiur.category) },
    { name: formatTitle(shiur.sub_category) },
    { name: formatTitle(shiur.english_sefer) },
    { name: shiur.english_title }
  ];
  const breadcrumbStructuredData = generateBreadcrumbStructuredData(breadcrumbs, baseUrl);

  // Create catalog anchor link for the sefer
  const createCatalogAnchor = () => {
    const categoryName = formatTitle(shiur.category);
    const displayCategoryName = categoryName === 'Ein Yaakov' ? 'Ein Yaakov (Talmud)' : categoryName;
    const subCategoryName = formatTitle(shiur.sub_category);
    const seferName = formatTitle(shiur.english_sefer);
    
    return `${displayCategoryName}-${subCategoryName}-${seferName}`
      .replace(/\s+/g, '-')
      .replace(/[()]/g, '')
      .replace(/[^a-zA-Z0-9\-]/g, '')
      .toLowerCase();
  };

  return (
    <div className="min-h-screen py-4 sm:py-8">
      <SEOHead
        title={shiur.english_title}
        description={generateMetaDescription('shiur', shiur)}
        keywords={generateKeywords('shiur', shiur)}
        canonicalUrl={`${baseUrl}/shiur/${shiur.id}`}
        structuredData={[structuredData, breadcrumbStructuredData]}
        ogType="article"
      />
      <div className="content-container">
        <div className="max-w-full sm:max-w-4xl mx-auto">
          {/* Breadcrumb navigation */}
          <nav className={`flex flex-wrap text-xs sm:text-sm mb-4 sm:mb-6 text-black overflow-hidden ${isMobile ? 'mt-6' : ''}`}>
            <Link to="/catalog" className="text-biblical-burgundy hover:text-biblical-brown flex-shrink-0">
              Catalog
            </Link>
            <span className="mx-1 sm:mx-2 flex-shrink-0 text-gray-500">/</span>
            <span className="truncate flex-shrink min-w-0 text-gray-600">{formatTitle(shiur.category)}</span>
            <span className="mx-1 sm:mx-2 flex-shrink-0 text-gray-500">/</span>
            <span className="truncate flex-shrink min-w-0 text-gray-600">{formatTitle(shiur.sub_category)}</span>
            <span className="mx-1 sm:mx-2 flex-shrink-0 text-gray-500">/</span>
            <Link 
              to={`/catalog#${createCatalogAnchor()}`}
              className="truncate flex-shrink min-w-0 text-biblical-burgundy hover:text-biblical-brown"
            >
              {formatTitle(shiur.english_sefer)}
            </Link>
          </nav>
          
          {/* Shiur header */}
          <div className="bg-white/90 rounded-lg p-4 sm:p-6 shadow-md mb-6 sm:mb-8 relative pb-16 sm:pb-16">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-biblical-brown leading-none">
              {shiur.english_title}
            </h1>
            {shiur.hebrew_title && (
              <h2 className="text-lg sm:text-xl font-hebrew text-black mb-4 -mt-2">
                {shiur.hebrew_title}
              </h2>
            )}
            
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="flex items-center text-xs sm:text-sm text-biblical-brown">
                <Calendar size={14} className="mr-1" />
                <span>{shiur.hebrew_year} / {shiur.english_year}</span>
              </div>
              
              <div className="flex items-center text-xs sm:text-sm text-biblical-brown">
                <Clock size={14} className="mr-1" />
                {loadingDuration ? (
                  <span>Loading...</span>
                ) : (
                  <span>{audioDuration || '--:--'}</span>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex flex-wrap gap-1 sm:gap-2">
                <span className="px-2 py-1 bg-biblical-brown/10 rounded text-biblical-brown text-xs sm:text-sm">
                  {formatTitle(shiur.category)}
                </span>
                <span className="px-2 py-1 bg-biblical-brown/10 rounded text-biblical-brown text-xs sm:text-sm">
                  {formatTitle(shiur.sub_category)}
                </span>
                <span className="px-2 py-1 bg-biblical-brown/10 rounded text-biblical-brown text-xs sm:text-sm">
                  {formatTitle(shiur.english_sefer)}
                </span>
              </div>
            </div>

            {/* Action Buttons - Bottom Corner */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-row justify-between items-end">
              {/* Download Buttons - Left Side */}
              <div className="flex flex-row gap-2">
                {/* Download PDF Button */}
                {shiur.source_sheet_link && (
                  <a
                    href={getPdfUrl(shiur.source_sheet_link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-biblical-burgundy text-white rounded-lg hover:bg-biblical-burgundy/90 transition-colors duration-200 text-sm"
                    title="Download as PDF"
                  >
                    <Download size={16} />
                    <span>PDF</span>
                  </a>
                )}
                
                {/* Download Audio Button */}
                <a
                  href={googleDriveDownloadUrl}
                  download={`${shiur.english_title}.mp3`}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-700/90 transition-colors duration-200 text-sm"
                  title="Download Audio"
                >
                  <Download size={16} />
                  <span>MP3</span>
                </a>
              </div>
              
              {/* Social Share Buttons - Right Side */}
              <div>
                <SocialShareButtons
                  title={shiur.english_title}
                  description={generateMetaDescription('shiur', shiur)}
                  url={`${baseUrl}/shiur/${shiur.id}`}
                  variant="compact"
                  showLabel={false}
                />
              </div>
            </div>
          </div>
          
          {/* Audio player - moved up and titles removed */}
          <div className="mb-6 sm:mb-8">
            <AudioPlayer 
              audioSrc={audioUrl}
              downloadUrl={googleDriveDownloadUrl}
              fileName={`${shiur.english_title}.mp3`}
            />
          </div>
          
          {/* Source document - rendered as content */}
          {shiur.source_sheet_link && (
            <div className="mb-6 sm:mb-8">
              <SourceSheetRenderer 
                docUrl={shiur.source_sheet_link} 
                isGoogleDoc={isGoogleDoc} 
              />
            </div>
          )}
          
          {/* Tags */}
          {shiur.tags && shiur.tags.length > 0 && (
            <div className="mt-8">
              <div className="flex flex-wrap gap-2">
                {shiur.tags.map(tag => (
                  <span 
                    key={tag}
                    className="px-2 py-1 bg-gray-700/10 rounded-full text-sm text-black"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiurPage;
