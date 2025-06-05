import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Headphones, Book, ArrowUp, Clock } from 'lucide-react';
import BackToTopButton from '@/components/common/BackToTopButton';
import { Category, Shiur } from '@/types/shiurim';
import { organizeShiurimByHierarchy, getAudioDuration } from '@/utils/dataUtils';
import shiurimData from '@/data/shiurim_data.json';
import { getAudioUrl } from '@/utils/s3Utils';

const CatalogPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [audioDurations, setAudioDurations] = useState<Record<string, string>>({});
  const [loadingDurations, setLoadingDurations] = useState(false);
  const tocRefs = useRef<Record<string, HTMLHeadingElement | null>>({});
  const audioRef = useRef<HTMLAudioElement>(null);
  const location = useLocation();

  // Create URL-safe anchor ID
  const createAnchorId = (category: string, subCategory: string, sefer: string) => {
    const categoryName = category === 'Ein Yaakov' ? 'Ein Yaakov (Talmud)' : category;
    return `${categoryName}-${subCategory}-${sefer}`
      .replace(/\s+/g, '-')
      .replace(/[()]/g, '')
      .replace(/[^a-zA-Z0-9\-]/g, '')
      .toLowerCase();
  };

  // Function to load duration for a single shiur if not available in data
  const loadDuration = useCallback(async (shiurId: string) => {
    try {
      if (!audioRef.current) return;

      return new Promise<void>((resolve) => {
        const audioUrl = getAudioUrl(`${shiurId}.mp3`);
        audioRef.current.src = audioUrl;
        
        const handleLoadedMetadata = () => {
          if (!audioRef.current) return;
          const minutes = Math.floor(audioRef.current.duration / 60);
          const seconds = Math.floor(audioRef.current.duration % 60);
          const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          
          setAudioDurations(prev => ({
            ...prev,
            [shiurId]: formattedDuration
          }));
          
          audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audioRef.current.removeEventListener('error', handleError);
          resolve();
        };
        
        const handleError = () => {
          setAudioDurations(prev => ({
            ...prev,
            [shiurId]: '--:--'
          }));
          
          if (audioRef.current) {
            audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audioRef.current.removeEventListener('error', handleError);
          }
          resolve();
        };
        
        audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.addEventListener('error', handleError);
      });
    } catch (error) {
      console.error(`Error loading duration for ${shiurId}:`, error);
      setAudioDurations(prev => ({
        ...prev,
        [shiurId]: '--:--'
      }));
    }
  }, []);

  useEffect(() => {
    // Convert the imported JSON to the required type
    const shiurim = shiurimData as unknown as Shiur[];
    const organizedData = organizeShiurimByHierarchy(shiurim);
    setCategories(organizedData);
    
    // First, collect all pre-loaded lengths from the data
    const preloadedDurations: Record<string, string> = {};
    let shiurimNeedingDurations: string[] = [];
    
    shiurim.forEach(shiur => {
      // Check if the shiur has a pre-loaded length
      if ('length' in shiur && shiur.length) {
        preloadedDurations[shiur.id] = shiur.length as string;
      } else {
        shiurimNeedingDurations.push(shiur.id);
      }
    });
    
    // Set all preloaded durations immediately
    setAudioDurations(preloadedDurations);
    
    // If any shiurim need dynamic duration loading
    if (shiurimNeedingDurations.length > 0) {
      setLoadingDurations(true);
      
      // Load durations for shiurim without pre-loaded lengths
      const loadMissingDurations = async () => {
        // Process 3 shiurim at a time to be gentler on the browser
        for (let i = 0; i < shiurimNeedingDurations.length; i += 3) {
          const batch = shiurimNeedingDurations.slice(i, i + 3);
          await Promise.all(batch.map(id => loadDuration(id)));
        }
        
        setLoadingDurations(false);
      };
      
      loadMissingDurations();
    }
  }, [loadDuration]);

  // Handle anchor scrolling when page loads or hash changes
  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.slice(1); // Remove the # symbol
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        // Add a small delay to ensure the page has rendered
        setTimeout(() => {
          targetElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }, 100);
      }
    }
  }, [location.hash, categories]); // Re-run when categories load

  const scrollToSefer = (seferId: string) => {
    const element = tocRefs.current[seferId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Helper to get duration from either preloaded data or dynamically loaded data
  const getDuration = (shiur: Shiur): string => {
    // First check in audioDurations state (dynamically loaded or from preload)
    if (audioDurations[shiur.id]) {
      return audioDurations[shiur.id];
    }
    
    // Then check if it exists in the original data
    if ('length' in shiur && shiur.length) {
      return shiur.length as string;
    }
    
    // Default if nothing is available
    return '--:--';
  };

  return (
    <div className="min-h-screen py-8 pt-20 md:pt-8">
      {/* Hidden audio element for metadata loading */}
      <audio ref={audioRef} preload="metadata" style={{ display: 'none' }} />
      
      <div className="content-container">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-biblical-burgundy hidden md:block">
          Shiurim Catalog
        </h1>

        {/* Table of Contents */}
        <div className="mb-12 bg-white/80 rounded-lg p-6 shadow-md">
          <h2 className="text-2xl font-semibold mb-6 text-biblical-burgundy text-center">
            Table of Contents
          </h2>
          
          <div className="flex flex-wrap justify-center gap-8">
            {categories.map(category => (
              <div key={category.name} className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-biblical-burgundy text-center">
                  {category.name}
                </h3>
                
                <div className="flex flex-wrap justify-center gap-6 mb-4">
                  {category.subCategories.map(subCategory => (
                    <div key={subCategory.name} className="mb-6">
                      <h4 className="font-medium text-lg mb-3 text-biblical-navy text-center">
                        {subCategory.name}
                      </h4>
                      
                      <ul className="space-y-2">
                        {subCategory.sefarim.map(sefer => (
                          <li key={sefer.name}>
                            <button 
                              onClick={() => {
                                const anchorId = createAnchorId(category.name, subCategory.name, sefer.name);
                                const element = document.getElementById(anchorId);
                                if (element) {
                                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                              }}
                              className="text-biblical-brown hover:text-biblical-burgundy hover:underline"
                            >
                              {sefer.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shiurim Tables */}
        <div className="space-y-12">
          {categories.map(category => (
            <div key={category.name} className="space-y-10">
              {category.subCategories.map(subCategory => (
                <div key={subCategory.name} className="space-y-8">
                  {subCategory.sefarim.map(sefer => (
                    <div key={sefer.name} className="mb-12">
                      <h3 
                        ref={el => {
                          const anchorId = createAnchorId(category.name, subCategory.name, sefer.name);
                          tocRefs.current[anchorId] = el;
                        }}
                        id={createAnchorId(category.name, subCategory.name, sefer.name)}
                        className="text-2xl font-semibold mb-4 text-center text-biblical-burgundy"
                      >
                        {sefer.name}
                      </h3>
                      {sefer.hebrewName && (
                        <h4 className="text-xl mb-6 text-center font-hebrew text-biblical-navy">
                          {sefer.hebrewName}
                        </h4>
                      )}
                      
                      <div className="overflow-x-auto">
                        <table className="catalog-table">
                          <thead>
                            <tr>
                              <th className="w-8 sm:w-12 text-center">#</th>
                              <th className="text-center">English Title</th>
                              <th className="text-center hidden sm:table-cell">Hebrew Title</th>
                              <th className="w-16 sm:w-32 text-center">Year</th>
                              <th className="w-16 sm:w-24 text-center">Length</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sefer.shiurim.map((shiur, index) => (
                              <tr key={shiur.id}>
                                <td className="text-center">{index + 1}</td>
                                <td className="text-center">
                                  <Link 
                                    to={`/shiur/${shiur.id}`}
                                    className="text-biblical-navy hover:text-biblical-burgundy hover:underline block"
                                  >
                                    {shiur.english_title}
                                  </Link>
                                </td>
                                <td className="font-hebrew text-center hidden sm:table-cell">{shiur.hebrew_title}</td>
                                <td className="text-center text-xs sm:text-sm">
                                  <div className="hidden sm:block">{shiur.english_year} ({shiur.hebrew_year})</div>
                                  <div className="sm:hidden">{shiur.english_year}</div>
                                </td>
                                <td className="text-center">
                                  <div className="flex items-center justify-center">
                                    {loadingDurations && !getDuration(shiur) ? (
                                      <span className="text-biblical-brown/70">Loading...</span>
                                    ) : (
                                      <>
                                        <Clock size={12} className="mr-1 text-biblical-brown/70 hidden sm:inline" />
                                        <span className="text-xs sm:text-sm">{getDuration(shiur)}</span>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <BackToTopButton />
    </div>
  );
};

export default CatalogPage;
