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
  
  return htmlContent.replace(/<img[^>]*>/gi, (imgTag) => {
    // Extract the src attribute
    const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
    if (!srcMatch) return imgTag;
    
    let src = srcMatch[1];
    
    // Handle different types of Google image URLs
    if (src.startsWith('https://lh3.googleusercontent.com/') || 
        src.startsWith('https://lh4.googleusercontent.com/') ||
        src.startsWith('https://lh5.googleusercontent.com/') ||
        src.startsWith('https://lh6.googleusercontent.com/') ||
        src.startsWith('https://lh7.googleusercontent.com/')) {
      // These are already public Google User Content URLs, but we might need to adjust them
      // Remove any size restrictions to get full size images
      src = src.replace(/=w\d+/, '').replace(/=h\d+/, '').replace(/=s\d+/, '');
    } else if (src.includes('docs.google.com/drawings')) {
      // Google Drawings - these should already be publicly accessible if the doc is public
      // No modification needed
    } else if (src.startsWith('https://docs.google.com/') && docId) {
      // Internal Google Docs URLs - try to convert to public format
      if (src.includes('/images/')) {
        // Try to extract image ID and convert to public URL
        const imageIdMatch = src.match(/images\/([^\/\?]+)/);
        if (imageIdMatch) {
          src = `https://docs.google.com/document/d/${docId}/export?format=png&id=${imageIdMatch[1]}`;
        }
      }
    } else if (src.startsWith('/')) {
      // Relative URLs - make them absolute with Google Docs domain
      src = 'https://docs.google.com' + src;
    }
    
    // Add error handling and styling to images
    const styledImgTag = imgTag
      .replace(/src=["'][^"']*["']/i, `src="${src}"`)
      .replace(/<img/, '<img loading="lazy" onerror="this.style.display=\'none\'"')
      .replace(/style=["']([^"']*)["']/i, (match, styles) => {
        // Ensure images are responsive and maintain aspect ratio
        const hasMaxWidth = styles.includes('max-width');
        const hasWidth = styles.includes('width') && !hasMaxWidth;
        let newStyles = styles;
        
        if (!hasMaxWidth && !hasWidth) {
          newStyles += '; max-width: 100%; height: auto;';
        } else if (hasWidth && !hasMaxWidth) {
          newStyles += '; max-width: 100%;';
        }
        
        return `style="${newStyles}"`;
      });
    
    // If no style attribute exists, add responsive styling
    if (!styledImgTag.includes('style=')) {
      return styledImgTag.replace(/<img/, '<img style="max-width: 100%; height: auto;"');
    }
    
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
      // Remove specific Google Docs classes we don't want
      .replace(/\.kix-[^{]*{[^}]*}/gi, '') // Remove kix-specific classes
      .replace(/\.docs-[^{]*{[^}]*}/gi, '') // Remove docs-specific classes
      .replace(/\.lst-[^{]*{[^}]*}/gi, '') // Remove list-specific classes
      // Clean up fonts but allow custom font sizes and weights  
      .replace(/font-family:\s*["'][^"']*["']/gi, 'font-family: inherit') // Use site fonts
      // Remove page-specific styling
      .replace(/margin:\s*[^;]+;?/gi, '') // Remove margins
      .replace(/padding:\s*[^;]+;?/gi, '') // Remove padding from root elements
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