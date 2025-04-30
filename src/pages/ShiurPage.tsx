
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, Calendar, Clock } from 'lucide-react';
import shiurimData from '@/data/shiurim_data.json';
import { Shiur } from '@/types/shiurim';
import { formatTitle } from '@/utils/dataUtils';
import { getPdfUrl } from '@/utils/s3Utils';
import AudioPlayer from '@/components/common/AudioPlayer';
import DocumentViewer from '@/components/common/DocumentViewer';

const ShiurPage: React.FC = () => {
  const { shiurId } = useParams<{ shiurId: string }>();
  const [shiur, setShiur] = useState<Shiur | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [audioDuration, setAudioDuration] = useState<string | null>(null);

  useEffect(() => {
    if (shiurId) {
      const foundShiur = (shiurimData as unknown as Shiur[]).find(s => s.id === shiurId);
      
      if (foundShiur) {
        setShiur(foundShiur);
        // Attempt to get audio duration (this would be more accurate with actual audio files)
        fetchAudioDuration(foundShiur.audio_recording_link);
      } else {
        setNotFound(true);
      }
    }
  }, [shiurId]);

  // In a real application, this would correctly fetch the duration from the audio file
  const fetchAudioDuration = (audioLink: string) => {
    // Simulate getting audio duration (would actually load the audio and get its duration)
    setTimeout(() => {
      // Random duration between 30 and 90 minutes for demo purposes
      const minutes = Math.floor(Math.random() * 60) + 30;
      const seconds = Math.floor(Math.random() * 60);
      setAudioDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 500);
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
              
              {audioDuration && (
                <div className="flex items-center text-sm text-biblical-brown">
                  <Clock size={16} className="mr-1" />
                  <span>{audioDuration}</span>
                </div>
              )}
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
              
              <a 
                href={getPdfUrl(shiur.source_sheet_link)}
                target="_blank"
                rel="noopener noreferrer" 
                className="flex items-center text-biblical-navy hover:text-biblical-burgundy"
              >
                <Download size={18} className="mr-1" />
                Download PDF
              </a>
            </div>
          </div>
          
          {/* Audio player */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-biblical-navy">
              Listen to the Shiur
            </h3>
            <AudioPlayer 
              audioSrc={shiur.audio_recording_link} 
            />
          </div>
          
          {/* Source document */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-biblical-navy">
              Source Sheet
            </h3>
            <DocumentViewer 
              docUrl={shiur.source_sheet_link} 
              isGoogleDoc={shiur.source_sheet_link.includes('docs.google.com')} 
            />
          </div>
          
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
