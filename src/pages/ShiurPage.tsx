import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, Calendar, Clock, FileText, ExternalLink } from 'lucide-react';
import shiurimData from '@/data/shiurim_data.json';
import { Shiur } from '@/types/shiurim';
import { formatTitle, getAudioDuration } from '@/utils/dataUtils';
import { getPdfUrl, getAudioUrl } from '@/utils/s3Utils';
import AudioPlayer from '@/components/common/AudioPlayer';
import DocumentViewer from '@/components/common/DocumentViewer';

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

  return (
    <div className="min-h-screen py-4 sm:py-8">
      <div className="content-container">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb navigation */}
          <nav className="flex flex-wrap text-xs sm:text-sm mb-4 sm:mb-6 text-biblical-brown/70">
            <Link to="/catalog" className="hover:text-biblical-burgundy">
              Catalog
            </Link>
            <span className="mx-1 sm:mx-2">/</span>
            <span className="truncate">{formatTitle(shiur.category)}</span>
            <span className="mx-1 sm:mx-2">/</span>
            <span className="truncate">{formatTitle(shiur.sub_category)}</span>
            <span className="mx-1 sm:mx-2">/</span>
            <span className="truncate">{formatTitle(shiur.english_sefer)}</span>
          </nav>
          
          {/* Shiur header */}
          <div className="bg-white/90 rounded-lg p-4 sm:p-6 shadow-md mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-biblical-burgundy mb-2 leading-tight">
              {shiur.english_title}
            </h1>
            
            {shiur.hebrew_title && (
              <h2 className="text-lg sm:text-xl font-hebrew text-biblical-navy mb-4">
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
          </div>
          
          {/* Audio player */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-biblical-navy flex items-center">
                <FileText size={16} className="mr-2" />
                Listen to the Shiur
              </h3>
              <a 
                href={audioUrl}
                download={`${shiur.english_title}.mp3`}
                className="flex items-center text-biblical-navy hover:text-biblical-burgundy text-sm"
              >
                <Download size={16} className="mr-1" />
                Download MP3
              </a>
            </div>
            <AudioPlayer 
              audioSrc={audioUrl} 
            />
          </div>
          
          {/* Source document */}
          {shiur.source_sheet_link && (
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center mb-3 gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-biblical-navy flex items-center">
                  <FileText size={16} className="mr-2" />
                  Source Sheet
                </h3>
                {isGoogleDoc && (
                  <a 
                    href={shiur.source_sheet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm text-biblical-navy hover:text-biblical-burgundy flex items-center"
                  >
                    <ExternalLink size={12} className="mr-1" />
                    View in Google Docs
                  </a>
                )}
              </div>
              <DocumentViewer 
                docUrl={shiur.source_sheet_link} 
                isGoogleDoc={isGoogleDoc} 
              />
            </div>
          )}
          
          {/* Tags */}
          {shiur.tags && shiur.tags.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-medium mb-2 text-biblical-brown/70">
                Tags
              </h3>
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
