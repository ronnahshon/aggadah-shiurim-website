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

export interface MidrashContent {
  title: string;
  chapters: MidrashChapter[];
  allFootnotes: Record<string, string>;
}

export function parseMidrashContent(markdownContent: string): MidrashContent {
  const lines = markdownContent.split('\n');
  const chapters: MidrashChapter[] = [];
  const allFootnotes: Record<string, string> = {};
  
  let currentChapter: MidrashChapter | null = null;
  let currentSection: MidrashSection | null = null;
  let currentContent = '';
  let inFootnotes = false;
  
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
    
    // Skip footnote definitions
    if (line.match(footnoteRegex)) {
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
  
  return {
    title: 'מדרש העלייה',
    chapters,
    allFootnotes
  };
}

export function renderContentWithFootnotes(content: string): string {
  // Convert footnote references to clickable superscript links
  return content.replace(/\[(\^[^\]]+)\]/g, (match, footnoteId) => {
    // Extract just the number/letter after the ^
    const footnoteNumber = footnoteId.slice(1); // Remove the ^ symbol
    return `<sup><a href="#footnote-${footnoteNumber}" class="footnote-link" data-footnote="${footnoteId}">${footnoteNumber}</a></sup>`;
  });
}

export function getHebrewNumerals(): Record<string, number> {
  return {
    'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9, 'י': 10,
    'יא': 11, 'יב': 12, 'יג': 13, 'יד': 14, 'טו': 15, 'טז': 16
  };
} 