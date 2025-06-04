export interface MidrashSection {
  id: string;
  title: string;
  content: string;
  footnotes: Record<string, string>;
}

export interface MidrashChapter {
  id: string;
  title: string;
  sections: MidrashSection[];
}

export interface MidrashBibliography {
  title: string;
  content: string;
}

export interface MidrashFootnotes {
  title: string;
  footnotes: Record<string, string>;
}

export interface MidrashContent {
  title: string;
  chapters: MidrashChapter[];
  bibliography?: MidrashBibliography;
  footnotesSection?: MidrashFootnotes;
  allFootnotes: Record<string, string>;
}

export function parseMidrashContent(markdownContent: string): MidrashContent {
  const lines = markdownContent.split('\n');
  const chapters: MidrashChapter[] = [];
  const allFootnotes: Record<string, string> = {};
  
  let currentChapter: MidrashChapter | null = null;
  let currentSection: MidrashSection | null = null;
  let currentContent = '';
  let inBibliography = false;
  let inFootnotes = false;
  let bibliographyContent = '';
  let bibliographyTitle = '';
  
  // First pass: extract footnotes
  let footnoteRegex = /^\[(\^[^\]]+)\]:\s*(.+)$/;
  for (const line of lines) {
    const footnoteMatch = line.match(footnoteRegex);
    if (footnoteMatch) {
      allFootnotes[footnoteMatch[1]] = footnoteMatch[2];
    }
  }
  
  // Second pass: extract content structure
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip footnote definitions during main parsing
    if (line.match(footnoteRegex)) {
      inFootnotes = true;
      continue;
    }
    
    // Check for bibliography section
    if (line === '**מפתח למדרש העלייה**') {
      // Save current section if exists
      if (currentSection && currentChapter) {
        currentSection.content = currentContent.trim();
        currentChapter.sections.push(currentSection);
      }
      
      // Save current chapter if exists
      if (currentChapter) {
        chapters.push(currentChapter);
      }
      
      inBibliography = true;
      bibliographyTitle = line.replace(/\*\*/g, '');
      bibliographyContent = '';
      currentChapter = null;
      currentSection = null;
      currentContent = '';
      continue;
    }
    
    // Check for footnotes section header (optional - might be missing)
    if (line === '**הערות**') {
      inBibliography = false;
      inFootnotes = true;
      continue;
    }
    
    // If we're in bibliography section and encounter a footnote line, end bibliography
    if (inBibliography && line.match(footnoteRegex)) {
      inBibliography = false;
      inFootnotes = true;
      continue;
    }
    
    // If we're in bibliography section
    if (inBibliography && !inFootnotes) {
      if (line && !line.match(footnoteRegex)) {
        bibliographyContent += line + '\n';
      }
      continue;
    }
    
    // If we're in footnotes section, skip (already processed)
    if (inFootnotes) {
      continue;
    }
    
    // Check for chapter header (פרק followed by Hebrew letter)
    if (line.startsWith('**פרק ')) {
      // Save current section if exists
      if (currentSection && currentChapter) {
        currentSection.content = currentContent.trim();
        currentChapter.sections.push(currentSection);
      }
      
      // Save current chapter if exists
      if (currentChapter) {
        chapters.push(currentChapter);
      }
      
      // Start new chapter
      const chapterTitle = line.replace(/\*\*/g, '');
      const chapterMatch = chapterTitle.match(/פרק ([א-ת])/);
      const chapterLetter = chapterMatch ? chapterMatch[1] : '';
      
      currentChapter = {
        id: `chapter-${chapterLetter}`,
        title: chapterTitle,
        sections: []
      };
      
      currentSection = null;
      currentContent = '';
      continue;
    }
    
    // Check for section header (משנה followed by Hebrew letter)
    if (line.startsWith('**משנה ')) {
      // Save current section if exists
      if (currentSection && currentChapter) {
        currentSection.content = currentContent.trim();
        currentChapter.sections.push(currentSection);
      }
      
      // Start new section
      const sectionTitle = line.replace(/\*\*/g, '');
      const sectionMatch = sectionTitle.match(/משנה ([א-ת])/);
      const sectionLetter = sectionMatch ? sectionMatch[1] : '';
      
      currentSection = {
        id: `section-${sectionLetter}`,
        title: sectionTitle,
        content: '',
        footnotes: {}
      };
      
      currentContent = '';
      continue;
    }
    
    // Add line to current content
    if (currentSection && line) {
      currentContent += line + '\n';
      
      // Extract footnotes for this section
      const footnoteMatches = line.matchAll(/\[(\^[^\]]+)\]/g);
      for (const match of footnoteMatches) {
        const footnoteId = match[1];
        if (allFootnotes[footnoteId]) {
          currentSection.footnotes[footnoteId] = allFootnotes[footnoteId];
        }
      }
    }
  }
  
  // Save final section and chapter
  if (currentSection && currentChapter) {
    currentSection.content = currentContent.trim();
    currentChapter.sections.push(currentSection);
  }
  
  if (currentChapter) {
    chapters.push(currentChapter);
  }
  
  const result: MidrashContent = {
    title: 'מדרש העלייה',
    chapters,
    allFootnotes
  };
  
  // Add bibliography if found
  if (bibliographyTitle && bibliographyContent.trim()) {
    result.bibliography = {
      title: bibliographyTitle,
      content: bibliographyContent.trim()
    };
  }
  
  // Add footnotes section if we have footnotes
  if (Object.keys(allFootnotes).length > 0) {
    result.footnotesSection = {
      title: 'הערות',
      footnotes: allFootnotes
    };
  }
  
  return result;
}

export function renderContentWithFootnotes(content: string): string {
  // First clean markdown escapes
  const cleanedContent = cleanMarkdownEscapes(content);
  
  // Convert footnote references to clickable superscript links
  return cleanedContent.replace(/\[(\^[^\]]+)\]/g, (match, footnoteId) => {
    // Extract just the number/letter after the ^
    const footnoteNumber = footnoteId.slice(1); // Remove the ^ symbol
    return `<sup><a href="#footnote-${footnoteNumber}" class="footnote-link" data-footnote="${footnoteId}">${footnoteNumber}</a></sup>`;
  });
}

export function cleanMarkdownEscapes(content: string): string {
  // Remove backslashes before common punctuation marks that are often escaped in markdown
  return content
    .replace(/\\-/g, '-')  // Remove backslashes before dashes
    .replace(/\\:/g, ':')  // Remove backslashes before colons
    .replace(/\\,/g, ',')  // Remove backslashes before commas
    .replace(/\\;/g, ';')  // Remove backslashes before semicolons
    .replace(/\\'/g, "'")  // Remove backslashes before apostrophes
    .replace(/\\"/g, '"')  // Remove backslashes before quotes
    .replace(/\\\./g, '.')  // Remove backslashes before periods
    .replace(/\\\!/g, '!')  // Remove backslashes before exclamation marks
    .replace(/\\\?/g, '?'); // Remove backslashes before question marks
}

export function getHebrewNumerals(): Record<string, number> {
  return {
    'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9, 'י': 10,
    'יא': 11, 'יב': 12, 'יג': 13, 'יד': 14, 'טו': 15, 'טז': 16
  };
} 