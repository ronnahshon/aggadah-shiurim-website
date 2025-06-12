export interface DaroshSection {
  id: string;
  title: string;
  content: string;
}

export interface DaroshPart {
  id: string;
  title: string;
  introduction: string;
  sections: DaroshSection[];
}

export interface DaroshChapter {
  id: string;
  title: string;
  generalIntroduction: string;
  parts: DaroshPart[];
}

export interface DaroshFootnoteSection {
  id: string;
  title: string;
  footnotes: Array<{
    number: string;
    content: string;
  }>;
}

export interface DaroshFootnoteChapter {
  id: string;
  title: string;
  sections: DaroshFootnoteSection[];
}

export interface DaroshContent {
  title: string;
  generalIntroduction: string;
  chapters: DaroshChapter[];
  allFootnotes: Record<string, string>;
  footnoteStructure: DaroshFootnoteChapter[];
}

export interface DaroshTableOfContents {
  generalIntroduction: { title: string; id: string };
  chapters: Array<{
    id: string;
    title: string;
    parts: Array<{
      id: string;
      title: string;
      sections: Array<{
        id: string;
        title: string;
      }>;
    }>;
  }>;
}

export function parseDaroshDarashMosheContent(
  mainContent: string,
  footnotesContent: string
): DaroshContent {
  const mainLines = mainContent.split('\n');
  const footnoteLines = footnotesContent.split('\n');
  
  // Parse footnotes first
  const { allFootnotes, footnoteStructure } = parseFootnotes(footnoteLines);
  
  // Parse main content
  const chapters: DaroshChapter[] = [];
  let generalIntroduction = '';
  
  let currentState = 'start';
  let currentChapter: DaroshChapter | null = null;
  let currentPart: DaroshPart | null = null;
  let currentSection: DaroshSection | null = null;
  let currentContent = '';
  
  for (let i = 0; i < mainLines.length; i++) {
    const line = mainLines[i].trim();
    
    // Skip empty lines and structural elements
    if (!line || line.startsWith('![') || 
        line.startsWith('**[Foreword]') || line.startsWith('**(') ||
        line.includes('p. ') || line.startsWith('***Table of Contents***') ||
        line.includes('......') || line.startsWith('>') ||
        line.match(/^\d+\\\.\s/) || line.startsWith('*Part ') ||
        line.includes('[גבעת רפידים]') || line.includes('◆') ||
        line.startsWith('**Givat Rephidim') || line.startsWith('**Table of Contents**') ||
        line.startsWith('**Notes for ')) {
      continue;
    }
    
    // Detect General Introduction
    if (line === '***General Introduction***') {
      currentState = 'general_intro';
      continue;
    }
    
    // Detect Chapter start
    if (line === '***Chapter I***' || line === '***Chapter II***' || line === '***Chapter III***') {
      // Save previous content
      if (currentState === 'general_intro') {
        generalIntroduction = currentContent.trim();
      }
      saveCurrentSection();
      saveCurrentPart();
      saveCurrentChapter();
      
      // Start new chapter
      const chapterMatch = line.match(/\*\*\*Chapter ([IVX]+)\*\*\*/);
      if (chapterMatch) {
        const chapterNum = chapterMatch[1];
        let chapterTitle = '';
        
        // Get the title based on chapter number
        if (chapterNum === 'I') {
          chapterTitle = 'Givat Rephidim';
        } else if (chapterNum === 'II') {
          chapterTitle = 'Har Sinai';
        } else if (chapterNum === 'III') {
          chapterTitle = 'Hor HaHar';
        }
        
        currentChapter = {
          id: `chapter-${chapterNum.toLowerCase()}`,
          title: `Chapter ${chapterNum}: ${chapterTitle}`,
          generalIntroduction: '',
          parts: []
        };
        currentState = 'chapter_intro';
        currentContent = '';
      }
      continue;
    }
    
    // Detect General Introduction within chapter
    if (line === '**[General Introduction]{.underline}**') {
      currentState = 'chapter_general_intro';
      currentContent = '';
      continue;
    }
    
    // Detect Part start (bold format)
    if (line.startsWith('**Part ') && line.includes(':') && line.endsWith('**')) {
      // If we're still in general intro and this is the first Part, save the general intro
      if (currentState === 'chapter_general_intro' && currentChapter) {
        currentChapter.generalIntroduction = currentContent.trim();
      }
      
      saveCurrentSection();
      saveCurrentPart();
      
      const partMatch = line.match(/\*\*Part (\d+): (.+)\*\*/);
      if (partMatch) {
        const partNum = partMatch[1];
        const partTitle = partMatch[2];
        currentPart = {
          id: `part-${partNum}`,
          title: `Part ${partNum}: ${partTitle}`,
          introduction: '',
          sections: []
        };
        currentState = 'part_intro';
        currentContent = '';
      }
      continue;
    }
    
    // Detect section start with underline format
    if (line.startsWith('**[') && line.includes(']{.underline}**')) {
      // If we're transitioning from part intro to first section, save the part intro
      if (currentState === 'part_intro' && currentPart && currentContent.trim()) {
        currentPart.introduction = currentContent.trim();
      }
      
      saveCurrentSection();
      
      const sectionMatch = line.match(/\*\*\[(.+)\]\{\.underline\}\*\*/);
      if (sectionMatch) {
        const sectionTitle = sectionMatch[1];
        // Generate a simple ID from the title
        const sectionId = sectionTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        currentSection = {
          id: sectionId,
          title: sectionTitle,
          content: ''
        };
        currentState = 'section';
        currentContent = '';
      }
      continue;
    }
    
    // Detect numbered section start (alternative format)
    if (line.match(/^\d+\.\s+[A-Z]/)) {
      saveCurrentSection();
      
      const sectionMatch = line.match(/^(\d+)\.\s+(.+)$/);
      if (sectionMatch) {
        const sectionNum = sectionMatch[1];
        const sectionTitle = sectionMatch[2];
        currentSection = {
          id: `section-${sectionNum}`,
          title: `${sectionNum}. ${sectionTitle}`,
          content: ''
        };
        currentState = 'section';
        currentContent = '';
      }
      continue;
    }
    
    // Detect Notes sections (end of parts)
    if (line.startsWith('**Notes for ')) {
      saveCurrentSection();
      saveCurrentPart();
      currentState = 'notes';
      continue;
    }
    
    // Skip notes content
    if (currentState === 'notes') {
      continue;
    }
    
    // Skip table of contents content in italic format and other structural elements
    if ((line.startsWith('*Part ') && !line.startsWith('**Part ')) ||
        line.startsWith('[(') ||
        line.startsWith('***(') ||
        line.match(/^\([0-9]\)/) ||
        line.includes('***') && !line.includes('Chapter')) {
      continue;
    }
    
    // Add line to current content
    if (line) {
      currentContent += line + '\n';
    }
  }
  
  // Save final content
  if (currentState === 'general_intro') {
    generalIntroduction = currentContent.trim();
  } else if (currentState === 'chapter_general_intro' && currentChapter) {
    currentChapter.generalIntroduction = currentContent.trim();
  }
  
  saveCurrentSection();
  saveCurrentPart();
  saveCurrentChapter();
  
  function saveCurrentSection() {
    if (currentSection && currentPart && currentContent.trim()) {
      currentSection.content = currentContent.trim();
      currentPart.sections.push(currentSection);
      currentSection = null;
    }
  }
  
  function saveCurrentPart() {
    if (currentPart && currentChapter) {
      if (currentState === 'part_intro' && currentContent.trim()) {
        currentPart.introduction = currentContent.trim();
      }
      if (currentPart.sections.length > 0 || currentPart.introduction) {
        currentChapter.parts.push(currentPart);
      }
      currentPart = null;
    }
  }
  
  function saveCurrentChapter() {
    if (currentChapter) {
      if (currentState === 'chapter_general_intro' && currentContent.trim()) {
        currentChapter.generalIntroduction = currentContent.trim();
      }
      if (currentChapter.parts.length > 0 || currentChapter.generalIntroduction) {
        chapters.push(currentChapter);
      }
      currentChapter = null;
    }
  }
  
  return {
    title: 'Darosh Darash Moshe',
    generalIntroduction,
    chapters,
    allFootnotes,
    footnoteStructure
  };
}

function parseFootnotes(footnoteLines: string[]): {
  allFootnotes: Record<string, string>;
  footnoteStructure: DaroshFootnoteChapter[];
} {
  const allFootnotes: Record<string, string> = {};
  const footnoteStructure: DaroshFootnoteChapter[] = [];
  
  let currentChapter: DaroshFootnoteChapter | null = null;
  let currentSection: DaroshFootnoteSection | null = null;
  let currentFootnoteNum = '';
  let currentFootnoteContent = '';
  
  const saveCurrentFootnote = () => {
    if (currentFootnoteNum && currentFootnoteContent && currentSection) {
      const footnoteContent = currentFootnoteContent.trim();
      allFootnotes[currentFootnoteNum] = footnoteContent;
      currentSection.footnotes.push({
        number: currentFootnoteNum,
        content: footnoteContent
      });
      currentFootnoteNum = '';
      currentFootnoteContent = '';
    }
  };
  
  const saveCurrentSection = () => {
    if (currentSection && currentChapter && currentSection.footnotes.length > 0) {
      currentChapter.sections.push(currentSection);
      currentSection = null;
    }
  };
  
  const saveCurrentChapter = () => {
    if (currentChapter && currentChapter.sections.length > 0) {
      footnoteStructure.push(currentChapter);
      currentChapter = null;
    }
  };
  
  for (const line of footnoteLines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) continue;
    
    // Check for chapter header (e.g., "***Chapter I***")
    const chapterMatch = trimmedLine.match(/^\*\*\*Chapter ([IVX]+)\*\*\*$/);
    if (chapterMatch) {
      saveCurrentFootnote();
      saveCurrentSection();
      saveCurrentChapter();
      
      const chapterNum = chapterMatch[1];
      let chapterTitle = '';
      if (chapterNum === 'I') {
        chapterTitle = 'Chapter I: Givat Rephidim';
      } else if (chapterNum === 'II') {
        chapterTitle = 'Chapter II: Har Sinai';
      } else if (chapterNum === 'III') {
        chapterTitle = 'Chapter III: Hor HaHar';
      }
      
      currentChapter = {
        id: `footnotes-chapter-${chapterNum.toLowerCase()}`,
        title: chapterTitle,
        sections: []
      };
      continue;
    }
    
    // Check for section header (e.g., "**[Notes for General Introduction]{.underline}**" or "**[Notes for Part 1]{.underline}**")
    const sectionMatch = trimmedLine.match(/^\*\*\[Notes for ([^\]]+)\]\{\.underline\}\*\*$/);
    if (sectionMatch) {
      saveCurrentFootnote();
      saveCurrentSection();
      
      const sectionTitle = sectionMatch[1];
      currentSection = {
        id: `footnotes-${sectionTitle.toLowerCase().replace(/\s+/g, '-')}`,
        title: `Notes for ${sectionTitle}`,
        footnotes: []
      };
      continue;
    }
    
    // Check for footnote number start (e.g., "**1. Pesikta DeRav Kahana 3:8**" or "**3.** While na'ar...")
    const footnoteMatch = trimmedLine.match(/^\*\*(\d+)\.\*?\s*(.*)$/);
    if (footnoteMatch) {
      saveCurrentFootnote();
      
      // Start new footnote
      currentFootnoteNum = footnoteMatch[1];
      currentFootnoteContent = footnoteMatch[2] + '\n';
      continue;
    }
    
    // Add content to current footnote
    if (currentFootnoteNum && trimmedLine) {
      currentFootnoteContent += trimmedLine + '\n';
    }
  }
  
  // Save final footnote, section, and chapter
  saveCurrentFootnote();
  saveCurrentSection();
  saveCurrentChapter();
  
  return { allFootnotes, footnoteStructure };
}

export function generateTableOfContents(content: DaroshContent): DaroshTableOfContents {
  return {
    generalIntroduction: {
      title: 'General Introduction',
      id: 'general-introduction'
    },
    chapters: content.chapters.map(chapter => ({
      id: chapter.id,
      title: chapter.title,
      parts: chapter.parts.map(part => ({
        id: part.id,
        title: part.title,
        sections: part.sections.map(section => ({
          id: section.id,
          title: section.title
        }))
      }))
    }))
  };
}

export function renderContentWithFootnotes(
  content: string,
  footnotes: Record<string, string>
): string {
  // Replace footnote references like ^[1] with clickable links
  return content.replace(/\^?\[(\d+)\](\{\.underline\})?/g, (match, footnoteNum) => {
    return `<sup><a href="#footnote-${footnoteNum}" class="footnote-link" data-footnote="${footnoteNum}">${footnoteNum}</a></sup>`;
  });
}

export function cleanMarkdownFormatting(content: string): string {
  return content
    .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*([^*]+)\*\*/g, '<br/><strong>$1</strong><br/>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\{\.underline\}/g, '<u>$1</u>')
    .replace(/\[([^\]]+)\]\{dir="rtl"\}/g, '<span dir="rtl">$1</span>')
    .replace(/^\s*\-\s+/gm, '• ')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/^(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<br\/><br\/>/g, '<br/>') // Clean up double line breaks
    .replace(/^<br\/>/g, '') // Remove line break at the very beginning
    .replace(/<br\/>$/g, ''); // Remove line break at the very end
} 