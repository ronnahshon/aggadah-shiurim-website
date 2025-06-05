import React, { useState, useEffect } from 'react';
import { convertGoogleDocToContent } from '@/utils/documentUtils';

interface SourceSheetRendererProps {
  docUrl: string;
  isGoogleDoc?: boolean;
}

const SourceSheetRenderer: React.FC<SourceSheetRendererProps> = ({ 
  docUrl, 
  isGoogleDoc = false 
}) => {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!docUrl) return;
    
    const fetchContent = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (isGoogleDoc || docUrl.includes('docs.google.com')) {
          // Extract content from Google Doc
          const extractedContent = await convertGoogleDocToContent(docUrl);
          setContent(extractedContent);
        } else {
          // For non-Google docs, you might want to implement other content extraction methods
          // For now, fall back to a simple message
          setContent('<p>Content extraction not yet implemented for this document type.</p>');
        }
      } catch (err) {
        console.error('Error fetching source sheet content:', err);
        setError('Failed to load source sheet content. Please try downloading the PDF instead.');
        setContent(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContent();
  }, [docUrl, isGoogleDoc]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-biblical-burgundy mx-auto mb-2"></div>
          <p className="text-biblical-brown text-sm">Loading source sheet...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-biblical-brown mb-4">{error}</p>
      </div>
    );
  }
  
  return (
    <div>
      {content && (
        <div 
          className="google-doc-content max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </div>
  );
};

export default SourceSheetRenderer; 