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
    if (!srcMatch) {
      return imgTag;
    }
    
    let src = srcMatch[1];
    
    // Handle different types of Google image URLs
    if (src.startsWith('https://lh') && src.includes('googleusercontent.com')) {
      // Google User Content URLs (both traditional and new docsz format) - keep as-is
      // These URLs should be publicly accessible if the document is public
      
      // Only remove size restrictions for URLs that don't have a key parameter
      if (!src.includes('?key=')) {
        src = src.replace(/=w\d+(-h\d+)?(-no)?(-c)?(-k)?$/, '');
        src = src.replace(/=h\d+(-no)?(-c)?(-k)?$/, '');
        src = src.replace(/=s\d+(-no)?(-c)?(-k)?$/, '');
      }
    } else if (src.includes('docs.google.com/drawings')) {
      // Google Drawings - usually publicly accessible if doc is public
    } else if (src.startsWith('data:image/')) {
      // Base64 encoded images - leave as is
    } else if (src.startsWith('/') && docId) {
      // Relative URLs - convert to absolute but keep original path
      src = 'https://docs.google.com' + src;
    } else if (!src.startsWith('http') && docId) {
      // Non-HTTP URLs that might be relative
      src = `https://docs.google.com/document/d/${docId}/${src}`;
    }
    
    // Add responsive styling but don't hide images on error
    let styledImgTag = imgTag.replace(/src=["'][^"']*["']/i, `src="${src}"`);
    
    // Add loading attribute
    if (!styledImgTag.includes('loading=')) {
      styledImgTag = styledImgTag.replace(/<img/, '<img loading="lazy"');
    }
    
    // Add basic error handling
    if (!styledImgTag.includes('onerror=')) {
      styledImgTag = styledImgTag.replace(/<img/, `<img onerror="this.style.display='none';"`);
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
    
    return styledImgTag;
  });
}

/**
 * Safely removes blocks with nested braces (like @media queries) from CSS content.
 * Uses iterative brace-depth tracking to avoid catastrophic regex backtracking.
 * 
 * @param css CSS content
 * @param blockStart The block identifier to remove (e.g., '@media', '@page')
 * @returns CSS content with the specified blocks removed
 */
function removeNestedBlock(css: string, blockStart: string): string {
  let result = '';
  let i = 0;
  const blockStartLower = blockStart.toLowerCase();
  const blockLen = blockStart.length;
  
  while (i < css.length) {
    // Check if we're at the start of a block to remove
    if (css.substring(i, i + blockLen).toLowerCase() === blockStartLower) {
      // Find the opening brace
      let braceStart = css.indexOf('{', i);
      if (braceStart === -1) {
        // No opening brace found, just add character and continue
        result += css[i];
        i++;
        continue;
      }
      
      // Track brace depth to find the matching closing brace
      let depth = 1;
      let j = braceStart + 1;
      while (j < css.length && depth > 0) {
        if (css[j] === '{') depth++;
        else if (css[j] === '}') depth--;
        j++;
      }
      
      // Skip past the entire block
      i = j;
    } else {
      result += css[i];
      i++;
    }
  }
  
  return result;
}

/**
 * Safely removes script tags from HTML content.
 * Uses simple string searching to avoid catastrophic regex backtracking.
 * 
 * @param html HTML content
 * @returns HTML content with script tags removed
 */
function removeScriptTags(html: string): string {
  let result = '';
  let i = 0;
  
  while (i < html.length) {
    // Check for <script (case insensitive)
    if (html.substring(i, i + 7).toLowerCase() === '<script') {
      // Find the closing </script> tag
      const closeTag = html.toLowerCase().indexOf('</script>', i);
      if (closeTag === -1) {
        // No closing tag found, skip past <script and continue
        i += 7;
        continue;
      }
      // Skip past the entire script block including </script>
      i = closeTag + 9;
    } else {
      result += html[i];
      i++;
    }
  }
  
  return result;
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
  const headMatch = htmlContent.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headContent = headMatch ? headMatch[1] : '';
  
  const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : htmlContent;
  
  // Extract and clean up the style tag content
  let styleContent = '';
  const styleMatches = headContent.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  if (styleMatches) {
    styleContent = styleMatches.join('\n');
    
    // Remove @import statements (simple pattern, safe)
    styleContent = styleContent.replace(/@import[^;]*;/gi, '');
    
    // Use safe iterative function for removing @media and @page blocks
    styleContent = removeNestedBlock(styleContent, '@media');
    styleContent = removeNestedBlock(styleContent, '@page');
    
    // Remove kix-specific and docs-specific classes (simple patterns, safe)
    styleContent = styleContent.replace(/\.kix-[^{]*\{[^}]*\}/gi, '');
    styleContent = styleContent.replace(/\.docs-[^{]*\{[^}]*\}/gi, '');
    
    // Only remove font-family, preserve all colors, sizes, weights, etc.
    styleContent = styleContent.replace(/font-family:\s*["'][^"']*["']/gi, 'font-family: inherit');
    
    // Remove body margins and padding (simple patterns)
    styleContent = styleContent.replace(/body\s*\{[^}]*\}/gi, '');
    
    // Clean up excessive whitespace
    styleContent = styleContent.replace(/\s+/g, ' ');
    styleContent = styleContent.replace(/;\s*;/g, ';');
    styleContent = styleContent.replace(/\{\s*\}/g, '');
    styleContent = styleContent.trim();
  }
  
  // Clean up body content while preserving formatting
  let cleanedContent = bodyContent;
  
  // Use safe function to remove script tags
  cleanedContent = removeScriptTags(cleanedContent);
  
  // Remove Google Docs header/footer (simple patterns)
  cleanedContent = cleanedContent.replace(/<div id="header">[^]*?<\/div>/gi, '');
  cleanedContent = cleanedContent.replace(/<div id="footer">[^]*?<\/div>/gi, '');
  
  // Remove specific problematic Google Docs classes
  cleanedContent = cleanedContent.replace(/class="docs-gm[^"]*"/gi, '');
  cleanedContent = cleanedContent.replace(/class="kix-[^"]*"/gi, '');
  
  // Remove empty span and div elements (simple patterns)
  cleanedContent = cleanedContent.replace(/<span[^>]*>\s*<\/span>/gi, '');
  cleanedContent = cleanedContent.replace(/<div[^>]*>\s*<\/div>/gi, '');
  
  // Clean up excessive whitespace but preserve line breaks
  cleanedContent = cleanedContent.replace(/[ \t]+/g, ' ');
  cleanedContent = cleanedContent.replace(/(\r\n|\n|\r){3,}/gm, '\n\n');
  cleanedContent = cleanedContent.trim();
  
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
