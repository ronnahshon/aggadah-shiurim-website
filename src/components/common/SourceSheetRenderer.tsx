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
  
  // Function to remove lines containing author references using string replacement (CSP-safe)
  // Uses safe string operations to avoid catastrophic regex backtracking
  const removeAuthorReferences = (htmlContent: string): string => {
    if (!htmlContent) return htmlContent;
    
    const authorNames = ['רון נחשון', 'Ron Nahshon'];
    let cleanedContent = htmlContent;
    
    // Process line by line for plain text author references
    const lines = cleanedContent.split('\n');
    const filteredLines = lines.filter(line => {
      const lineLower = line.toLowerCase();
      return !authorNames.some(name => lineLower.includes(name.toLowerCase()));
    });
    cleanedContent = filteredLines.join('\n');
    
    // For HTML elements containing author names, use simple indexOf checks
    // and remove the containing element
    for (const authorName of authorNames) {
      // Simple approach: if content contains author name, we've already filtered lines
      // For remaining embedded cases, do targeted removal
      let idx = cleanedContent.toLowerCase().indexOf(authorName.toLowerCase());
      while (idx !== -1) {
        // Find the enclosing tag
        let tagStart = cleanedContent.lastIndexOf('<', idx);
        let tagEnd = cleanedContent.indexOf('>', idx);
        
        if (tagStart !== -1 && tagEnd !== -1) {
          // Find the tag name
          const tagMatch = cleanedContent.substring(tagStart + 1, tagEnd).match(/^(\w+)/);
          if (tagMatch) {
            const tagName = tagMatch[1];
            const closeTag = `</${tagName}>`;
            const closeIdx = cleanedContent.toLowerCase().indexOf(closeTag.toLowerCase(), tagEnd);
            
            if (closeIdx !== -1) {
              // Remove the entire element
              cleanedContent = cleanedContent.substring(0, tagStart) + 
                              cleanedContent.substring(closeIdx + closeTag.length);
              idx = cleanedContent.toLowerCase().indexOf(authorName.toLowerCase());
              continue;
            }
          }
        }
        
        // If we couldn't find proper tags, just move past this occurrence
        idx = cleanedContent.toLowerCase().indexOf(authorName.toLowerCase(), idx + 1);
      }
    }
    
    // Clean up any empty paragraphs or divs that might be left
    cleanedContent = cleanedContent.replace(/<p[^>]*>\s*<\/p>/gi, '');
    cleanedContent = cleanedContent.replace(/<div[^>]*>\s*<\/div>/gi, '');
    
    return cleanedContent;
  };

  useEffect(() => {
    if (!docUrl) return;
    
    const fetchContent = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (isGoogleDoc || docUrl.includes('docs.google.com')) {
          // Extract content from Google Doc
          const extractedContent = await convertGoogleDocToContent(docUrl);
          // Remove author references before setting content
          const cleanedContent = removeAuthorReferences(extractedContent);
          setContent(cleanedContent);
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