import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, Download } from 'lucide-react';
import shiurimData from '@/data/shiurim_data.json';
import { Shiur } from '@/types/shiurim';
import { formatTitle, getAudioDuration } from '@/utils/dataUtils';
import { getAudioUrl, getGoogleDriveDownloadUrl, getPdfUrl } from '@/utils/s3Utils';
import AudioPlayer from '@/components/common/AudioPlayer';
import SourceSheetRenderer from '@/components/common/SourceSheetRenderer';

const ShiurPage: React.FC = () => {
  const { shiurId } = useParams<{ shiurId: string }>();
  const [shiur, setShiur] = useState<Shiur | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [audioDuration, setAudioDuration] = useState<string | null>(null);
  const [loadingDuration, setLoadingDuration] = useState(false);

  useEffect(() => {
    if (shiurId) {
      const foundShiur = (shiurimData as unknown as Shiur[]).find(s => s.id === shiurId);
      
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
            <h1 className="text-3xl font-bold text-biblical-burgundy mb-4">Shiur Not Found</h1>
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
      <div className="content-container">
        <div className="max-w-full sm:max-w-4xl mx-auto">
          {/* Breadcrumb navigation */}
          <nav className="flex flex-wrap text-xs sm:text-sm mb-4 sm:mb-6 text-biblical-brown/70 overflow-hidden">
            <Link to="/catalog" className="hover:text-biblical-burgundy flex-shrink-0">
              Catalog
            </Link>
            <span className="mx-1 sm:mx-2 flex-shrink-0">/</span>
            <span className="truncate flex-shrink min-w-0">{formatTitle(shiur.category)}</span>
            <span className="mx-1 sm:mx-2 flex-shrink-0">/</span>
            <span className="truncate flex-shrink min-w-0">{formatTitle(shiur.sub_category)}</span>
            <span className="mx-1 sm:mx-2 flex-shrink-0">/</span>
            <Link 
              to={`/catalog#${createCatalogAnchor()}`}
              className="truncate flex-shrink min-w-0 hover:text-biblical-burgundy"
            >
              {formatTitle(shiur.english_sefer)}
            </Link>
          </nav>
          
          {/* Shiur header */}
          <div className="bg-white/90 rounded-lg p-4 sm:p-6 shadow-md mb-6 sm:mb-8 relative pb-16 sm:pb-16">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-biblical-burgundy leading-none">
              {shiur.english_title}
            </h1>
            {shiur.hebrew_title && (
              <h2 className="text-lg sm:text-xl font-hebrew text-biblical-navy mb-4 -mt-2">
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

            {/* Download Buttons - Bottom Left Corner */}
            <div className="absolute bottom-4 left-4 flex flex-row gap-2">
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
                className="flex items-center gap-2 px-4 py-2 bg-biblical-navy text-white rounded-lg hover:bg-biblical-navy/90 transition-colors duration-200 text-sm"
                title="Download Audio"
              >
                <Download size={16} />
                <span>MP3</span>
              </a>
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
                    className="px-2 py-1 bg-biblical-navy/10 rounded-full text-sm text-biblical-navy"
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
