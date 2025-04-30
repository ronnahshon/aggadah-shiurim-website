
import React from 'react';
import { Download } from 'lucide-react';
import { getDocumentUrl, getPdfUrl } from '@/utils/s3Utils';

interface DocumentViewerProps {
  docUrl: string;
  isGoogleDoc?: boolean;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ docUrl, isGoogleDoc = false }) => {
  // For Google Docs, we use their embedded viewer
  if (isGoogleDoc || docUrl.includes('docs.google.com')) {
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
  }
  
  // For regular documents from S3 (assuming they're in HTML or PDF format)
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

export default DocumentViewer;
