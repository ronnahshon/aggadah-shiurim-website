import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { getDocumentUrl, getPdfUrl } from '@/utils/s3Utils';
import { convertGoogleDocToContent } from '@/utils/documentUtils';

interface DocumentViewerProps {
  docUrl: string;
  isGoogleDoc?: boolean;
}

const DocumentViewer: React.FC<DocumentViewerProps> = React.memo(({ docUrl, isGoogleDoc = false }) => {
  const [extractedContent, setExtractedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showIframe, setShowIframe] = useState<boolean>(true); // Default to embedded view
  
  // For Google Docs, we try to extract the content but keep it as non-default option
  useEffect(() => {
    if (isGoogleDoc || docUrl.includes('docs.google.com')) {
      setIsLoading(true);
      
      convertGoogleDocToContent(docUrl)
        .then(content => {
          setExtractedContent(content);
          // Keep showIframe as true by default (embedded view)
        })
        .catch(error => {
          console.error("Failed to extract content:", error);
          setShowIframe(true); // Fallback to iframe
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [docUrl, isGoogleDoc]);
  
  // For Google Docs, we use their embedded viewer as default
  const renderGoogleDocViewer = () => {
    // Convert edit URL to embedded URL
    const embeddedUrl = docUrl
      .replace('/edit?usp=drive_link', '/preview')
      .replace('/edit?usp=sharing', '/preview');
      
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-end mb-2">
          <a 
            href={getPdfUrl(docUrl)}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-xs sm:text-sm text-black hover:text-biblical-burgundy"
          >
            <Download size={14} className="mr-1" />
            <span className="hidden sm:inline">Download as PDF</span>
            <span className="sm:hidden">PDF</span>
          </a>
        </div>
        <div className="border border-parchment-dark rounded-lg overflow-hidden h-[400px] sm:h-[600px] w-full">
          <iframe 
            src={embeddedUrl} 
            title="Document Viewer"
            className="w-full h-full"
            allow="autoplay"
          ></iframe>
        </div>
      </div>
    );
  };
  
  // For regular documents from S3 (assuming they're in HTML or PDF format)
  const renderS3Document = () => {
    const viewerUrl = getDocumentUrl(docUrl);
    const downloadUrl = getPdfUrl(docUrl);
    
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-end mb-2">
          <a 
            href={downloadUrl}
            download
            className="flex items-center text-xs sm:text-sm text-black hover:text-biblical-burgundy"
          >
            <Download size={14} className="mr-1" />
            <span className="hidden sm:inline">Download</span>
            <span className="sm:hidden">DL</span>
          </a>
        </div>
        <div className="border border-parchment-dark rounded-lg overflow-hidden h-[400px] sm:h-[600px] w-full">
          <iframe 
            src={viewerUrl} 
            title="Document Viewer"
            className="w-full h-full"
          ></iframe>
        </div>
      </div>
    );
  };
  
  // For extracted Google Doc content (non-embedded view)
  const renderExtractedContent = () => {
    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
          <button
            onClick={() => setShowIframe(true)}
            className="text-xs sm:text-sm text-black hover:text-biblical-burgundy"
          >
            Switch to embedded view
          </button>
          <a 
            href={getPdfUrl(docUrl)}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-xs sm:text-sm text-black hover:text-biblical-burgundy"
          >
            <Download size={14} className="mr-1" />
            <span className="hidden sm:inline">Download as PDF</span>
            <span className="sm:hidden">PDF</span>
          </a>
        </div>
        <div className="border border-parchment-dark rounded-lg p-4 sm:p-6 overflow-auto max-h-[600px] sm:max-h-[800px] bg-white w-full">
          {isLoading ? (
            <div className="flex justify-center items-center h-[300px] sm:h-[400px]">
              <p className="text-sm">Loading document content...</p>
            </div>
          ) : (
            <div 
              className="source-content prose prose-biblical max-w-none text-sm sm:text-base" 
              dangerouslySetInnerHTML={{ __html: extractedContent || '' }}
            />
          )}
        </div>
      </div>
    );
  };
  
  // Main render logic - default to embedded view for Google Docs
  if (isGoogleDoc || docUrl.includes('docs.google.com')) {
    if (extractedContent && !showIframe) {
      return renderExtractedContent();
    }
    // Add toggle button for switching to non-embedded view if content is available
    if (showIframe && extractedContent) {
      return (
        <div className="flex flex-col h-full">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
            <button
              onClick={() => setShowIframe(false)}
              className="text-xs sm:text-sm text-black hover:text-biblical-burgundy"
            >
              Switch to non-embedded view
            </button>
            <a 
              href={getPdfUrl(docUrl)}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-xs sm:text-sm text-black hover:text-biblical-burgundy"
            >
              <Download size={14} className="mr-1" />
              <span className="hidden sm:inline">Download as PDF</span>
              <span className="sm:hidden">PDF</span>
            </a>
          </div>
          <div className="border border-parchment-dark rounded-lg overflow-hidden h-[400px] sm:h-[600px] w-full">
            <iframe 
              src={docUrl.replace('/edit?usp=drive_link', '/preview').replace('/edit?usp=sharing', '/preview')} 
              title="Document Viewer"
              className="w-full h-full"
              allow="autoplay"
            ></iframe>
          </div>
        </div>
      );
    }
    return renderGoogleDocViewer();
  }
  
  return renderS3Document();
});

export default DocumentViewer;
