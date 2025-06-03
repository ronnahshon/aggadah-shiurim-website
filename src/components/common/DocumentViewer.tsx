import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { getDocumentUrl, getPdfUrl } from '@/utils/s3Utils';
import { convertGoogleDocToContent } from '@/utils/documentUtils';

interface DocumentViewerProps {
  docUrl: string;
  isGoogleDoc?: boolean;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ docUrl, isGoogleDoc = false }) => {
  const [extractedContent, setExtractedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showIframe, setShowIframe] = useState<boolean>(true);
  
  // For Google Docs, we try to extract the content
  useEffect(() => {
    if (isGoogleDoc || docUrl.includes('docs.google.com')) {
      setIsLoading(true);
      
      convertGoogleDocToContent(docUrl)
        .then(content => {
          setExtractedContent(content);
          setShowIframe(false);
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
  
  // For Google Docs, we use their embedded viewer as fallback
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
            className="flex items-center text-sm text-biblical-navy hover:text-biblical-burgundy"
          >
            <Download size={16} className="mr-1" />
            Download PDF
          </a>
        </div>
        <div className="border border-parchment-dark rounded-lg overflow-hidden h-[600px]">
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
            className="flex items-center text-sm text-biblical-navy hover:text-biblical-burgundy"
          >
            <Download size={16} className="mr-1" />
            Download
          </a>
        </div>
        <div className="border border-parchment-dark rounded-lg overflow-hidden h-[600px]">
          <iframe 
            src={viewerUrl} 
            title="Document Viewer"
            className="w-full h-full"
          ></iframe>
        </div>
      </div>
    );
  };
  
  // For extracted Google Doc content
  const renderExtractedContent = () => {
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-2">
          <button
            onClick={() => setShowIframe(true)}
            className="text-sm text-biblical-navy hover:text-biblical-burgundy"
          >
            Switch to embedded view
          </button>
          <a 
            href={getPdfUrl(docUrl)}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-sm text-biblical-navy hover:text-biblical-burgundy"
          >
            <Download size={16} className="mr-1" />
            Download PDF
          </a>
        </div>
        <div className="border border-parchment-dark rounded-lg p-6 overflow-auto max-h-[800px] bg-white">
          {isLoading ? (
            <div className="flex justify-center items-center h-[400px]">
              <p>Loading document content...</p>
            </div>
          ) : (
            <div 
              className="source-content prose prose-biblical max-w-none" 
              dangerouslySetInnerHTML={{ __html: extractedContent || '' }}
            />
          )}
        </div>
      </div>
    );
  };
  
  // Main render logic
  if (isGoogleDoc || docUrl.includes('docs.google.com')) {
    if (extractedContent && !showIframe) {
      return renderExtractedContent();
    }
    return renderGoogleDocViewer();
  }
  
  return renderS3Document();
};

export default DocumentViewer;
