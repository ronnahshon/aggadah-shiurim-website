import React, { useState, useEffect, useRef } from 'react';
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
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Function to remove lines containing author references using string replacement (CSP-safe)
  const removeAuthorReferences = (htmlContent: string): string => {
    if (!htmlContent) return htmlContent;
    
    // Simple string-based approach to avoid DOM manipulation that might trigger CSP
    let cleanedContent = htmlContent;
    
         // Remove paragraphs, divs, and spans containing author references
     const authorPatterns = [
       /<p[^>]*>.*?רון נחשון.*?<\/p>/gi,
       /<p[^>]*>.*?Ron Nahshon.*?<\/p>/gi,
      /<div[^>]*>.*?רון נחשון.*?<\/div>/gi,
      /<div[^>]*>.*?Ron Nahshon.*?<\/div>/gi,
      /<span[^>]*>.*?רון נחשון.*?<\/span>/gi,
      /<span[^>]*>.*?Ron Nahshon.*?<\/span>/gi,
      // Handle cases where author name might be in plain text
      /.*?רון נחשון.*?\n/gi,
      /.*?Ron Nahshon.*?\n/gi
    ];
    
    authorPatterns.forEach(pattern => {
      cleanedContent = cleanedContent.replace(pattern, '');
    });
    
    // Clean up any empty paragraphs or divs that might be left
    cleanedContent = cleanedContent.replace(/<p[^>]*>\s*<\/p>/gi, '');
    cleanedContent = cleanedContent.replace(/<div[^>]*>\s*<\/div>/gi, '');
    
    return cleanedContent;
  };

  useEffect(() => {
    if (!docUrl) return;
    
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    const fetchContent = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (isGoogleDoc || docUrl.includes('docs.google.com')) {
          // Use a timeout and signal for better performance
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 15000); // 15 second timeout
          });
          
          const contentPromise = convertGoogleDocToContent(docUrl);
          
          // Race between content loading and timeout
          const extractedContent = await Promise.race([contentPromise, timeoutPromise]) as string;
          
          // Check if component is still mounted and request wasn't aborted
          if (!abortControllerRef.current?.signal.aborted) {
            // Remove author references before setting content
            const cleanedContent = removeAuthorReferences(extractedContent);
            setContent(cleanedContent);
          }
        } else {
          // For non-Google docs, you might want to implement other content extraction methods
          // For now, fall back to a simple message
          if (!abortControllerRef.current?.signal.aborted) {
            setContent('<p>Content extraction not yet implemented for this document type.</p>');
          }
        }
      } catch (err) {
        // Don't show error if request was aborted (component unmounted)
        if (!abortControllerRef.current?.signal.aborted) {
          console.error('Error fetching source sheet content:', err);
          setError('Failed to load source sheet content. Please try downloading the PDF instead.');
          setContent(null);
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setIsLoading(false);
        }
      }
    };
    
    // Use setTimeout to make this async and non-blocking
    const timeoutId = setTimeout(() => {
      fetchContent();
    }, 0);
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [docUrl, isGoogleDoc]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
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