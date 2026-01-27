import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Headphones, Book, ArrowUp, Clock, Download } from 'lucide-react';
import BackToTopButton from '@/components/common/BackToTopButton';
import { Category, Shiur, Sefer } from '@/types/shiurim';
import { organizeShiurimByHierarchy, getAudioDuration } from '@/utils/dataUtils';
import { generateMetaDescription, generateKeywords } from '@/utils/seoUtils';
import { generateEnhancedMetaDescription, generateContextualKeywords } from '@/utils/additionalSeoUtils';
import SEOHead from '@/components/seo/SEOHead';
import { getAudioUrl, getGoogleDriveDownloadUrl } from '@/utils/s3Utils';

const CatalogPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioDurations, setAudioDurations] = useState<Record<string, string>>({});
  const [loadingDurations, setLoadingDurations] = useState(false);
  const [selectedShiurim, setSelectedShiurim] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
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
    // Load shiurim data from public folder
    const loadShiurimData = async () => {
      try {
        const response = await fetch('/data/shiurim_data.json');
        if (!response.ok) {
          throw new Error('Failed to load shiurim data');
        }
        const data = await response.json();
        const shiurim = data as Shiur[];
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
      } catch (error) {
        console.error('Error loading shiurim data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadShiurimData();
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

  // Download functionality
  const downloadShiur = (shiur: Shiur) => {
    try {
      const googleDriveDownloadUrl = getGoogleDriveDownloadUrl(shiur.audio_recording_link);
      const a = document.createElement('a');
      a.href = googleDriveDownloadUrl;
      a.download = `${shiur.english_title}.mp3`;
      a.target = '_blank'; // Open in new tab to avoid navigation issues
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading shiur:', error);
    }
  };

  const downloadSelectedShiurim = async () => {
    if (selectedShiurim.size === 0) return;
    
    // Get all shiurim objects for selected IDs
    const allShiurim: Shiur[] = [];
    categories.forEach(category => {
      category.subCategories.forEach(subCategory => {
        subCategory.sefarim.forEach(sefer => {
          allShiurim.push(...sefer.shiurim);
        });
      });
    });
    
    const shiurimToDownload = allShiurim.filter(shiur => selectedShiurim.has(shiur.id));
    
    if (shiurimToDownload.length === 1) {
      // Single download - direct approach
      downloadShiur(shiurimToDownload[0]);
      setSelectedShiurim(new Set());
    } else {
      // Multiple downloads - show modal
      setShowDownloadModal(true);
    }
  };

  const downloadAllFromModal = async () => {
    setDownloading(true);
    
    try {
      // Get all shiurim objects for selected IDs
      const allShiurim: Shiur[] = [];
      categories.forEach(category => {
        category.subCategories.forEach(subCategory => {
          subCategory.sefarim.forEach(sefer => {
            allShiurim.push(...sefer.shiurim);
          });
        });
      });
      
      const shiurimToDownload = allShiurim.filter(shiur => selectedShiurim.has(shiur.id));
      
      // Use window.open approach with longer delays for better success rate
      for (let i = 0; i < shiurimToDownload.length; i++) {
        const shiur = shiurimToDownload[i];
        const googleDriveDownloadUrl = getGoogleDriveDownloadUrl(shiur.audio_recording_link);
        
        // Use window.open instead of anchor elements for better compatibility
        setTimeout(() => {
          window.open(googleDriveDownloadUrl, '_blank');
        }, i * 1000); // 1 second delay between each download
      }
      
      // Clear selections and close modal after a delay
      setTimeout(() => {
        setSelectedShiurim(new Set());
        setShowDownloadModal(false);
        setDownloading(false);
      }, shiurimToDownload.length * 1000 + 1000);
      
    } catch (error) {
      console.error('Error downloading selected shiurim:', error);
      setDownloading(false);
    }
  };

  // Handle individual shiur selection
  const handleShiurSelection = (shiurId: string, checked: boolean) => {
    setSelectedShiurim(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(shiurId);
      } else {
        newSet.delete(shiurId);
      }
      return newSet;
    });
  };

  // Handle select all for a sefer
  const handleSelectAllSefer = (sefer: Sefer, checked: boolean) => {
    setSelectedShiurim(prev => {
      const newSet = new Set(prev);
      sefer.shiurim.forEach(shiur => {
        if (checked) {
          newSet.add(shiur.id);
        } else {
          newSet.delete(shiur.id);
        }
      });
      return newSet;
    });
  };

  // Check if all shiurim in a sefer are selected
  const isAllSeferSelected = (sefer: Sefer): boolean => {
    return sefer.shiurim.every(shiur => selectedShiurim.has(shiur.id));
  };

  // Check if some shiurim in a sefer are selected (for indeterminate state)
  const isSomeSeferSelected = (sefer: Sefer): boolean => {
    return sefer.shiurim.some(shiur => selectedShiurim.has(shiur.id));
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://midrashaggadah.com';

  return (
    <div className="min-h-screen py-8 pt-20 md:pt-8">
      <SEOHead
        title="Browse Shiurim Catalog"
        description={generateEnhancedMetaDescription('catalog')}
        keywords={generateContextualKeywords('catalog')}
        canonicalUrl={`${baseUrl}/catalog`}
        ogType="website"
      />
      {/* Hidden audio element for metadata loading */}
      <audio ref={audioRef} preload="metadata" style={{ display: 'none' }} />
      
      {/* Download Button - Fixed Position */}
      {selectedShiurim.size > 0 && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={downloadSelectedShiurim}
            disabled={downloading}
            className="bg-biblical-brown text-white px-4 py-2 rounded-lg shadow-lg hover:bg-biblical-brown/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download size={16} />
            {downloading ? `Downloading... (${selectedShiurim.size})` : `Download (${selectedShiurim.size})`}
          </button>
        </div>
      )}

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-biblical-brown mb-2">Download Selected Shiurim</h2>
              <p className="text-gray-600">
                {selectedShiurim.size} shiurim selected. You can download them individually or all at once.
              </p>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {(() => {
                  const allShiurim: Shiur[] = [];
                  categories.forEach(category => {
                    category.subCategories.forEach(subCategory => {
                      subCategory.sefarim.forEach(sefer => {
                        allShiurim.push(...sefer.shiurim);
                      });
                    });
                  });
                  
                  const shiurimToDownload = allShiurim.filter(shiur => selectedShiurim.has(shiur.id));
                  
                  return shiurimToDownload.map((shiur, index) => (
                    <div key={shiur.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-biblical-brown truncate">
                          {shiur.english_title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {shiur.english_sefer} • {shiur.hebrew_year}
                        </p>
                      </div>
                      <button
                        onClick={() => downloadShiur(shiur)}
                        className="ml-3 px-3 py-1 bg-biblical-brown text-white rounded hover:bg-biblical-brown/90 text-sm flex items-center gap-1"
                      >
                        <Download size={14} />
                        Download
                      </button>
                    </div>
                  ));
                })()}
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={downloadAllFromModal}
                disabled={downloading}
                className="px-4 py-2 bg-biblical-brown text-white rounded-lg hover:bg-biblical-brown/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Download size={16} />
                {downloading ? 'Starting Downloads...' : 'Download All'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="content-container">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-biblical-brown">
          Shiurim Catalog
        </h1>

        {/* Table of Contents */}
        <div className="mb-12 bg-white/80 rounded-lg p-6 shadow-md">
          <h2 className="text-2xl font-semibold mb-6 text-biblical-brown text-center">
            Table of Contents
          </h2>
          
          <div className="flex flex-wrap justify-center gap-8">
            {categories.map(category => (
              <div key={category.name} className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-biblical-brown text-center">
                  {category.name}
                </h3>
                
                <div className="flex flex-wrap justify-center gap-6 mb-4">
                  {category.subCategories.map(subCategory => (
                    <div key={subCategory.name} className="mb-6">
                      <h4 className="font-medium text-lg mb-3 text-black text-center">
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
                              className="text-biblical-brown hover:text-biblical-brown hover:underline"
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
                        className="text-2xl font-semibold mb-4 text-center text-biblical-brown"
                      >
                        {sefer.name}
                      </h3>
                      {sefer.hebrewName && (
                        <h4 className="text-xl mb-6 text-center font-hebrew text-black">
                          {sefer.hebrewName}
                        </h4>
                      )}
                      
                      <div className="overflow-x-auto">
                        <table className="catalog-table">
                          <thead>
                            <tr>
                              <th className="w-12 text-center">
                                <input
                                  type="checkbox"
                                  checked={isAllSeferSelected(sefer)}
                                  ref={checkbox => {
                                    if (checkbox) {
                                      checkbox.indeterminate = !isAllSeferSelected(sefer) && isSomeSeferSelected(sefer);
                                    }
                                  }}
                                  onChange={(e) => handleSelectAllSefer(sefer, e.target.checked)}
                                  className="rounded border-gray-300"
                                />
                              </th>
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
                                <td className="text-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedShiurim.has(shiur.id)}
                                    onChange={(e) => handleShiurSelection(shiur.id, e.target.checked)}
                                    className="rounded border-gray-300"
                                  />
                                </td>
                                <td className="text-center">{index + 1}</td>
                                <td className="text-center">
                                  <Link 
                                    to={`/shiur/${shiur.id}`}
                                    className="text-black hover:text-biblical-brown hover:underline block"
                                  >
                                    {shiur.english_title}
                                  </Link>
                                </td>
                                <td className="font-hebrew text-center hidden sm:table-cell">{shiur.hebrew_title}</td>
                                <td className="text-center text-xs sm:text-sm">
                                  <div className="hidden sm:block">{shiur.hebrew_year}</div>
                                  <div className="sm:hidden">{shiur.hebrew_year}</div>
                                </td>
                                <td className="text-center">
                                  <div className="flex items-center justify-center">
                                    {loadingDurations && !getDuration(shiur) ? (
                                      <span className="text-black">Loading...</span>
                                    ) : (
                                      <>
                                        <Clock size={12} className="mr-1 text-black hidden sm:inline" />
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
