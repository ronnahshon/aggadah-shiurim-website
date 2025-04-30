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

  // Handle MP3 download by creating a temporary anchor and triggering a download
  const handleDownloadMp3 = () => {
    if (!shiur) return;
    
    const audioUrl = getAudioUrl(`${shiur.id}.mp3`);
    const fileName = `${shiur.english_title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`;
    
    // Create an anchor element and set the appropriate attributes
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Append to the document, click it, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div className="min-h-screen py-8">
      <div className="content-container">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb navigation */}
          <nav className="flex text-sm mb-6 text-biblical-brown/70">
            <Link to="/catalog" className="hover:text-biblical-burgundy">
              Catalog
            </Link>
            <span className="mx-2">/</span>
            <span>{formatTitle(shiur.category)}</span>
            <span className="mx-2">/</span>
            <span>{formatTitle(shiur.sub_category)}</span>
            <span className="mx-2">/</span>
            <span>{formatTitle(shiur.english_sefer)}</span>
          </nav>
          
          {/* Shiur header */}
          <div className="bg-white/90 rounded-lg p-6 shadow-md mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-biblical-burgundy mb-2">
              {shiur.english_title}
            </h1>
            
            {shiur.hebrew_title && (
              <h2 className="text-xl font-hebrew text-biblical-navy mb-4">
                {shiur.hebrew_title}
              </h2>
            )}
            
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="flex items-center text-sm text-biblical-brown">
                <Calendar size={16} className="mr-1" />
                <span>{shiur.hebrew_year} / {shiur.english_year}</span>
              </div>
              
              <div className="flex items-center text-sm text-biblical-brown">
                <Clock size={16} className="mr-1" />
                {loadingDuration ? (
                  <span>Loading...</span>
                ) : (
                  <span>{audioDuration || '--:--'}</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-biblical-brown/10 rounded text-biblical-brown text-sm">
                  {formatTitle(shiur.category)}
                </span>
                <span className="px-2 py-1 bg-biblical-brown/10 rounded text-biblical-brown text-sm">
                  {formatTitle(shiur.sub_category)}
                </span>
                <span className="px-2 py-1 bg-biblical-brown/10 rounded text-biblical-brown text-sm">
                  {formatTitle(shiur.english_sefer)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Audio player */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-biblical-navy flex items-center">
                <FileText size={18} className="mr-2" />
                Listen to the Shiur
              </h3>
              <button 
                onClick={handleDownloadMp3}
                className="flex items-center text-biblical-navy hover:text-biblical-burgundy cursor-pointer"
              >
                <Download size={18} className="mr-1" />
                Download MP3
              </button>
            </div>
            <AudioPlayer 
              audioSrc={audioUrl} 
            />
          </div>
          
          {/* Source document */}
          {shiur.source_sheet_link && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 text-biblical-navy flex items-center">
                <FileText size={18} className="mr-2" />
                Source Sheet
                {isGoogleDoc && (
                  <a 
                    href={shiur.source_sheet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-sm text-biblical-navy hover:text-biblical-burgundy flex items-center"
                  >
                    <ExternalLink size={14} className="mr-1" />
                    View in Google Docs
                  </a>
                )}
              </h3>
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
