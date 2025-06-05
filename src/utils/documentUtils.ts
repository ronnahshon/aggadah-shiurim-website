import axios from 'axios';

/**
 * Extracts text content from a Google Document URL.
 * This uses Google Docs' public preview/export capability to get the content.
 * 
 * @param docUrl The Google Document URL
 * @returns Promise resolving to the extracted content in HTML format
 */
export async function extractGoogleDocContent(docUrl: string): Promise<string> {
  try {
    // Convert edit URL to export URL for HTML format
    const exportUrl = docUrl
      .replace('/edit?usp=drive_link', '/export?format=html')
      .replace('/edit?usp=sharing', '/export?format=html');
    
    // Fetch the HTML content
    const response = await axios.get(exportUrl, {
      headers: {
        'Accept': 'text/html',
      },
    });
    
    // Return the HTML content
    return response.data;
  } catch (error) {
    console.error('Error extracting Google Doc content:', error);
    return '<p>Failed to load document content. Please view the PDF instead.</p>';
  }
}

/**
 * Fixes image URLs in Google Docs content to make them publicly accessible.
 * 
 * @param htmlContent HTML content containing image tags
 * @param docUrl Original Google Doc URL for context
 * @returns HTML content with fixed image URLs
 */
function fixImageUrls(htmlContent: string, docUrl: string): string {
  // Extract the document ID from the Google Doc URL
  const docIdMatch = docUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const docId = docIdMatch ? docIdMatch[1] : null;
  
  console.log('Processing images for document:', docId);
  
  return htmlContent.replace(/<img[^>]*>/gi, (imgTag) => {
    console.log('Processing image tag:', imgTag);
    
    // Extract the src attribute
    const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
    if (!srcMatch) {
      console.log('No src found in image tag');
      return imgTag;
    }
    
    let src = srcMatch[1];
    const originalSrc = src;
    console.log('Original image src:', src);
    
    // Handle different types of Google image URLs
    if (src.startsWith('https://lh') && src.includes('googleusercontent.com')) {
      // Google User Content URLs (both traditional and new docsz format) - keep as-is
      // These URLs should be publicly accessible if the document is public
      console.log('Processing googleusercontent URL (keeping original with key if present)');
      
      // Only remove size restrictions for URLs that don't have a key parameter
      if (!src.includes('?key=')) {
        src = src.replace(/=w\d+(-h\d+)?(-no)?(-c)?(-k)?$/, '');
        src = src.replace(/=h\d+(-no)?(-c)?(-k)?$/, '');
        src = src.replace(/=s\d+(-no)?(-c)?(-k)?$/, '');
        console.log('Removed size restrictions from googleusercontent URL:', src);
      } else {
        console.log('Keeping keyed googleusercontent URL as-is:', src);
      }
    } else if (src.includes('docs.google.com/drawings')) {
      // Google Drawings - usually publicly accessible if doc is public
      console.log('Google Drawings URL detected, keeping as-is');
    } else if (src.startsWith('data:image/')) {
      // Base64 encoded images - leave as is
      console.log('Base64 image detected, keeping as-is');
    } else if (src.startsWith('/') && docId) {
      // Relative URLs - convert to absolute but keep original path
      console.log('Processing relative URL');
      src = 'https://docs.google.com' + src;
      console.log('Converted to absolute URL:', src);
    } else if (!src.startsWith('http') && docId) {
      // Non-HTTP URLs that might be relative
      console.log('Processing non-HTTP URL');
      src = `https://docs.google.com/document/d/${docId}/${src}`;
      console.log('Constructed URL:', src);
    } else {
      console.log('Keeping URL as-is:', src);
    }
    
    console.log('Final processed src:', src);
    
    // Add responsive styling but don't hide images on error
    let styledImgTag = imgTag.replace(/src=["'][^"']*["']/i, `src="${src}"`);
    
    // Add loading attribute
    if (!styledImgTag.includes('loading=')) {
      styledImgTag = styledImgTag.replace(/<img/, '<img loading="lazy"');
    }
    
    // Add basic error handling without aggressive placeholder
    if (!styledImgTag.includes('onerror=')) {
      styledImgTag = styledImgTag.replace(/<img/, `<img onerror="console.log('Image failed to load:', this.src);"`);
    }
    
    // Handle existing style attribute
    if (styledImgTag.includes('style=')) {
      styledImgTag = styledImgTag.replace(/style=["']([^"']*)["']/i, (match, styles) => {
        let newStyles = styles;
        
        // Only add responsive styling if not already present
        if (!newStyles.includes('max-width') && !newStyles.includes('width')) {
          newStyles += '; max-width: 100%; height: auto;';
        } else if (newStyles.includes('width') && !newStyles.includes('max-width')) {
          newStyles += '; max-width: 100%;';
        }
        
        // Ensure height is auto for proper aspect ratio
        if (!newStyles.includes('height: auto') && newStyles.includes('width')) {
          newStyles += '; height: auto;';
        }
        
        return `style="${newStyles.replace(/^;\s*/, '')}"`;
      });
    } else {
      // Add responsive styling if no style attribute exists
      styledImgTag = styledImgTag.replace(/<img/, '<img style="max-width: 100%; height: auto;"');
    }
    
    console.log('Final styled image tag:', styledImgTag);
    return styledImgTag;
  });
}

/**
 * Cleans and formats the raw HTML content from Google Docs.
 * Preserves original formatting while removing unnecessary elements.
 * 
 * @param htmlContent Raw HTML content from Google Docs
 * @param docUrl Original Google Doc URL for image URL fixing
 * @returns Cleaned and formatted HTML content ready for display with preserved formatting
 */
export function formatDocContent(htmlContent: string, docUrl: string): string {
  if (!htmlContent) return '';
  
  // Extract both head and body content to preserve styles
  const headContent = htmlContent.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
  const bodyContent = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || htmlContent;
  
  // Extract and clean up the style tag content
  let styleContent = '';
  const styleMatches = headContent.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  if (styleMatches) {
    styleContent = styleMatches.join('\n')
      // Remove Google Docs specific imports and metadata
      .replace(/@import[^;]+;/gi, '') // Remove imports
      .replace(/@media[^{]*{[^{}]*(?:{[^{}]*}[^{}]*)*}/gi, '') // Remove media queries
      // Remove only the most problematic Google Docs classes, keep formatting ones
      .replace(/\.kix-[^{]*{[^}]*}/gi, '') // Remove kix-specific classes
      .replace(/\.docs-[^{]*{[^}]*}/gi, '') // Remove docs-specific classes
      // Only remove font-family, preserve all colors, sizes, weights, etc.
      .replace(/font-family:\s*["'][^"']*["']/gi, 'font-family: inherit')
      // Remove page-level styling that interferes with layout
      .replace(/body\s*{[^}]*margin[^}]*}/gi, '') // Remove body margins
      .replace(/body\s*{[^}]*padding[^}]*}/gi, '') // Remove body padding
      .replace(/@page[^{]*{[^}]*}/gi, '') // Remove page break styling
      // Clean up excessive whitespace
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/;\s*;/g, ';') // Remove duplicate semicolons
      .replace(/{\s*}/g, '') // Remove empty rules
      .trim();
      
    // Remove any remaining empty CSS rules
    styleContent = styleContent.replace(/[^{}]+{\s*}/g, '');
  }
  
  // Clean up body content while preserving formatting
  let cleanedContent = bodyContent
    // Remove Google Docs specific scripts
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove Google Docs header/footer
    .replace(/<div id="header">[\s\S]*?<\/div>/gi, '')
    .replace(/<div id="footer">[\s\S]*?<\/div>/gi, '')
    // Only remove specific problematic Google Docs classes, keep formatting ones
    .replace(/class="docs-gm[^"]*"/gi, '') // Remove docs-gm classes
    .replace(/class="kix-[^"]*"/gi, '') // Remove kix classes  
    // Remove empty span elements that don't have style attributes
    .replace(/<span(?!\s+style)([^>]*)>\s*<\/span>/gi, '')
    // Remove empty divs that don't have style attributes  
    .replace(/<div(?!\s+style)([^>]*)>\s*<\/div>/gi, '')
    // Clean up excessive whitespace but preserve line breaks
    .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
    .replace(/(\r\n|\n|\r){3,}/gm, '\n\n') // Limit to max 2 consecutive line breaks
    .trim();
  
  // Fix image URLs to make them publicly accessible
  cleanedContent = fixImageUrls(cleanedContent, docUrl);
  
  // Wrap content with preserved styles
  const result = `
    <div class="google-doc-content">
      ${styleContent ? `<style>${styleContent}</style>` : ''}
      ${cleanedContent}
    </div>
  `;
  
  return result;
}

/**
 * Converts a Google Doc to blog-style content that can be displayed in the app.
 * 
 * @param docUrl The Google Document URL
 * @returns Promise resolving to formatted HTML content
 */
export async function convertGoogleDocToContent(docUrl: string): Promise<string> {
  try {
    const rawHtml = await extractGoogleDocContent(docUrl);
    const formattedContent = formatDocContent(rawHtml, docUrl);
    return formattedContent;
  } catch (error) {
    console.error('Error converting Google Doc to content:', error);
    return '<p>Failed to convert document content. Please view the PDF instead.</p>';
  }
} 