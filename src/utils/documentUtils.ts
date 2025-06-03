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
 * Cleans and formats the raw HTML content from Google Docs.
 * Removes unnecessary elements, fixes styles, and improves formatting.
 * 
 * @param htmlContent Raw HTML content from Google Docs
 * @returns Cleaned and formatted HTML content ready for display
 */
export function formatDocContent(htmlContent: string): string {
  if (!htmlContent) return '';
  
  // Extract the main content (typically inside the body tag)
  const bodyContent = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || htmlContent;
  
  // Clean up Google Docs specific elements and classes
  let cleanedContent = bodyContent
    // Remove Google Docs specific scripts
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove style tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove Google Docs specific classes but keep the elements
    .replace(/class="[^"]*"/gi, '')
    // Remove empty spans
    .replace(/<span>\s*<\/span>/gi, '')
    // Remove excessive line breaks
    .replace(/(\r\n|\n|\r){2,}/gm, '\n')
    // Remove Google Docs header/footer
    .replace(/<div id="header">[\s\S]*?<\/div>/gi, '')
    .replace(/<div id="footer">[\s\S]*?<\/div>/gi, '');
  
  // Add responsive styling
  cleanedContent = `
    <div class="google-doc-content">
      ${cleanedContent}
    </div>
  `;
  
  return cleanedContent;
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
    const formattedContent = formatDocContent(rawHtml);
    return formattedContent;
  } catch (error) {
    console.error('Error converting Google Doc to content:', error);
    return '<p>Failed to convert document content. Please view the PDF instead.</p>';
  }
} 