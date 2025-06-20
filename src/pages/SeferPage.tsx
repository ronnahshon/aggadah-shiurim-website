
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Download } from 'lucide-react';
import DocumentViewer from '@/components/common/DocumentViewer';

interface SeferInfo {
  id: string;
  title: string;
  hebrewTitle: string;
  description: string;
  docLink: string;
}

const SEFARIM_DATA: Record<string, SeferInfo> = {
  'midrashim-about-moshe-rabbeinu': {
    id: 'midrashim-about-moshe-rabbeinu',
    title: 'Midrashim about Moshe Rabbeinu',
    hebrewTitle: 'מדרשים על משה רבינו',
    description: 'A comprehensive collection of midrashic texts about Moses, our teacher, exploring his life and legacy.',
    docLink: 'https://docs.google.com/document/d/1NeRjLlGqhlqRPO2pJ1F48VmZzkmLOTCbCKehJQg-WB4/edit?usp=drive_link'
  }
};

const SeferPage: React.FC = () => {
  const { seferId } = useParams<{ seferId: string }>();
  const [sefer, setSefer] = useState<SeferInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(350); // Example value

  useEffect(() => {
    if (seferId) {
      const foundSefer = SEFARIM_DATA[seferId];
      
      if (foundSefer) {
        setSefer(foundSefer);
        // In a real implementation, you'd fetch the actual page count
        setTotalPages(350); // Example value
      } else {
        setNotFound(true);
      }
    }
  }, [seferId]);

  // This would be connected to the scroll position in a real implementation
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrollPosition = element.scrollTop;
    const maxScroll = element.scrollHeight - element.clientHeight;
    
    // Calculate current page based on scroll position
    const newPage = Math.ceil((scrollPosition / maxScroll) * totalPages);
    setCurrentPage(newPage > 0 ? newPage : 1);
  };

  if (notFound) {
    return (
      <div className="min-h-screen py-12">
        <div className="content-container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-biblical-burgundy mb-4">Sefer Not Found</h1>
            <p className="text-biblical-brown mb-6">The sefer you're looking for doesn't exist or has been moved.</p>
            <Link 
              to="/sefarim" 
              className="px-6 py-3 bg-biblical-burgundy text-white rounded-md hover:bg-opacity-90 transition-colors"
            >
              View All Sefarim
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!sefer) {
    return (
      <div className="min-h-screen py-12">
        <div className="content-container">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-biblical-brown">Loading sefer...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="content-container">
        <div className="max-w-5xl mx-auto">
          {/* Navigation */}
          <div className="mb-6">
            <Link 
              to="/sefarim" 
              className="flex items-center text-black hover:text-biblical-burgundy"
            >
              <ChevronLeft size={16} className="mr-1" />
              Back to Sefarim
            </Link>
          </div>
          
          {/* Sefer header */}
          <div className="bg-white/90 rounded-lg p-6 shadow-md mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-biblical-burgundy mb-2">
              {sefer.title}
            </h1>
            
            <h2 className="text-xl font-hebrew text-black mb-4">
              {sefer.hebrewTitle}
            </h2>
            
            <p className="text-biblical-brown mb-4">
              {sefer.description}
            </p>
            
            <a 
              href={sefer.docLink.replace('/edit?usp=drive_link', '/export?format=pdf')}
              target="_blank"
              rel="noopener noreferrer" 
              className="flex items-center text-black hover:text-biblical-burgundy w-fit"
            >
              <Download size={18} className="mr-1" />
              Download PDF
            </a>
          </div>
          
          {/* Document viewer with page counter */}
          <div className="relative">
            <div className="h-[700px] overflow-y-auto border border-parchment-dark rounded-lg shadow-md" onScroll={handleScroll}>
              <DocumentViewer 
                docUrl={sefer.docLink} 
                isGoogleDoc={true} 
              />
            </div>
            
            {/* Page counter */}
            <div className="absolute bottom-4 right-4 bg-white/90 px-3 py-1 rounded-full shadow-md text-sm text-biblical-brown">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeferPage;
