#!/usr/bin/env python3
"""
Generate a scholarly PDF from the Darosh Darash Moshe content.
Extracts content from the three containers (left: TOC, middle: main content, right: footnotes)
and formats it as a scholarly book with footnotes at the bottom of each page.
"""

import re
import os
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

@dataclass
class Section:
    id: str
    title: str
    content: str
    footnotes: List[Tuple[str, str]]  # (footnote_number, footnote_text)

@dataclass
class Part:
    id: str
    title: str
    introduction: str
    sections: List[Section]

@dataclass
class Chapter:
    id: str
    title: str
    general_introduction: str
    parts: List[Part]

@dataclass
class Book:
    title: str
    general_introduction: str
    chapters: List[Chapter]
    table_of_contents: List[Tuple[str, int]]  # (title, page_number)

class ScholarlyPDFGenerator:
    def __init__(self, input_file: str, output_file: str):
        self.input_file = input_file
        self.output_file = output_file
        self.footnotes = {}
        self.toc_entries = []
        
    def parse_markdown_file(self) -> Book:
        """Parse the markdown file and extract the three-container structure"""
        try:
            with open(self.input_file, 'r', encoding='utf-8') as f:
                content = f.read()
        except FileNotFoundError:
            print(f"Error: File {self.input_file} not found.")
            return None
        except Exception as e:
            print(f"Error reading file: {e}")
            return None
            
        # Parse footnotes first
        self.parse_footnotes_from_content(content)
        
        # Split content into sections
        sections = self.split_into_major_sections(content)
        
        # Parse the content
        book = self.parse_content_structure(sections)
        
        return book
    
    def parse_footnotes_from_content(self, content: str):
        """Extract footnotes from the content"""
        # Find footnote references and try to match them with content
        footnote_refs = re.findall(r'\*\*\^?\[(\d+)\]\{\.underline\}\^?\*\*', content)
        
        # For now, create placeholder footnotes
        # In a real implementation, you'd parse the separate footnotes file
        for ref in set(footnote_refs):
            self.footnotes[ref] = f"Footnote {ref} - Source and explanation would go here."
    
    def split_into_major_sections(self, content: str) -> Dict[str, str]:
        """Split content into major sections"""
        sections = {
            'general_introduction': '',
            'chapter_1': '',
            'chapter_2': '',
            'chapter_3': ''
        }
        
        # Find the general introduction
        gen_intro_match = re.search(r'\*\*\*General Introduction\*\*\*(.*?)(?=\*\*\*Chapter|$)', content, re.DOTALL)
        if gen_intro_match:
            sections['general_introduction'] = gen_intro_match.group(1).strip()
        
        # Find chapters
        chapters = re.findall(r'\*\*\*Chapter ([IVX]+)\*\*\*(.*?)(?=\*\*\*Chapter|$)', content, re.DOTALL)
        for i, (chapter_num, chapter_content) in enumerate(chapters):
            if i < 3:  # Only handle first 3 chapters
                sections[f'chapter_{i+1}'] = chapter_content.strip()
        
        return sections
    
    def parse_content_structure(self, sections: Dict[str, str]) -> Book:
        """Parse the content structure"""
        book = Book(
            title="Darosh Darash Moshe",
            general_introduction=sections.get('general_introduction', ''),
            chapters=[],
            table_of_contents=[]
        )
        
        # Parse chapters
        chapter_titles = ["Chapter I: Givat Rephidim", "Chapter II: Har Sinai", "Chapter III: Hor HaHar"]
        
        for i in range(1, 4):
            chapter_key = f'chapter_{i}'
            if chapter_key in sections and sections[chapter_key]:
                chapter = self.parse_chapter(sections[chapter_key], chapter_titles[i-1], f"chapter-{i}")
                if chapter:
                    book.chapters.append(chapter)
        
        return book
    
    def parse_chapter(self, content: str, title: str, chapter_id: str) -> Chapter:
        """Parse a single chapter"""
        chapter = Chapter(
            id=chapter_id,
            title=title,
            general_introduction="",
            parts=[]
        )
        
        # Split into parts
        parts = re.split(r'\*Part (\d+): ([^*]+)\*', content)
        
        # First part might be general introduction
        if parts and parts[0].strip():
            chapter.general_introduction = parts[0].strip()
        
        # Process parts (groups of 3: part_num, part_title, part_content)
        for i in range(1, len(parts), 3):
            if i + 2 < len(parts):
                part_num = parts[i]
                part_title = parts[i + 1]
                part_content = parts[i + 2]
                
                part = self.parse_part(part_content, f"Part {part_num}: {part_title}", f"part-{part_num}")
                if part:
                    chapter.parts.append(part)
        
        return chapter
    
    def parse_part(self, content: str, title: str, part_id: str) -> Part:
        """Parse a single part"""
        part = Part(
            id=part_id,
            title=title,
            introduction="",
            sections=[]
        )
        
        # Split into sections by looking for section headers
        section_pattern = r'\*\*\[([^\]]+)\]\{\.underline\}\*\*'
        sections = re.split(section_pattern, content)
        
        # First part might be introduction
        if sections and sections[0].strip():
            part.introduction = sections[0].strip()
        
        # Process sections (groups of 2: section_title, section_content)
        for i in range(1, len(sections), 2):
            if i + 1 < len(sections):
                section_title = sections[i]
                section_content = sections[i + 1]
                
                section = Section(
                    id=f"section-{i//2 + 1}",
                    title=section_title,
                    content=section_content.strip(),
                    footnotes=[]
                )
                
                # Extract footnotes for this section
                section.footnotes = self.extract_footnotes_from_text(section_content)
                part.sections.append(section)
        
        return part
    
    def extract_footnotes_from_text(self, text: str) -> List[Tuple[str, str]]:
        """Extract footnotes from a text"""
        footnote_refs = re.findall(r'\*\*\^?\[(\d+)\]\{\.underline\}\^?\*\*', text)
        footnotes = []
        
        for ref in footnote_refs:
            footnote_text = self.footnotes.get(ref, f"Footnote {ref} content")
            footnotes.append((ref, footnote_text))
        
        return footnotes
    
    def clean_text_for_html(self, text: str) -> str:
        """Clean and format text for HTML"""
        # Remove markdown formatting and convert to HTML
        text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)  # Bold
        text = re.sub(r'\*([^*]+)\*', r'<em>\1</em>', text)      # Italic
        text = re.sub(r'\[([^\]]+)\]\{\.underline\}', r'<u>\1</u>', text)  # Underline
        
        # Handle footnote references
        text = re.sub(r'\*\*\^?\[(\d+)\]\{\.underline\}\^?\*\*', r'<sup><a href="#footnote-\1">\1</a></sup>', text)
        
        # Handle Hebrew/English content in divs
        text = re.sub(r'<div[^>]*style="[^"]*flex[^"]*"[^>]*>', '', text)
        text = re.sub(r'<div[^>]*>', '', text)
        text = re.sub(r'</div>', '', text)
        
        # Convert line breaks to paragraphs
        paragraphs = text.split('\n\n')
        formatted_paragraphs = []
        for para in paragraphs:
            para = para.strip()
            if para:
                # Handle Hebrew text alignment
                if re.search(r'[\u0590-\u05FF]', para):  # Contains Hebrew
                    formatted_paragraphs.append(f'<p dir="rtl" style="text-align: justify;">{para}</p>')
                else:
                    formatted_paragraphs.append(f'<p style="text-align: justify;">{para}</p>')
        
        return '\n'.join(formatted_paragraphs)
    
    def generate_table_of_contents_html(self, book: Book) -> str:
        """Generate HTML for table of contents"""
        toc_html = '''
        <div class="toc-page">
            <h1>Table of Contents</h1>
            <div class="toc-entries">
        '''
        
        # General Introduction
        toc_html += '<div class="toc-entry"><a href="#general-introduction">General Introduction</a> <span class="toc-dots">........................</span> <span class="page-num">5</span></div>\n'
        
        page_num = 10
        for chapter in book.chapters:
            toc_html += f'<div class="toc-entry chapter"><a href="#{chapter.id}">{chapter.title}</a> <span class="toc-dots">........................</span> <span class="page-num">{page_num}</span></div>\n'
            page_num += 2
            
            for part in chapter.parts:
                toc_html += f'<div class="toc-entry part"><a href="#{part.id}">{part.title}</a> <span class="toc-dots">........................</span> <span class="page-num">{page_num}</span></div>\n'
                page_num += 1
                
                for section in part.sections:
                    toc_html += f'<div class="toc-entry section"><a href="#{section.id}">{section.title}</a> <span class="toc-dots">........................</span> <span class="page-num">{page_num}</span></div>\n'
                    page_num += 1
        
        toc_html += '''
            </div>
        </div>
        '''
        
        return toc_html
    
    def generate_css(self) -> str:
        """Generate CSS for the scholarly format"""
        return '''
        <style>
        @page {
            size: A4;
            margin: 2cm;
            @bottom-left {
                content: counter(page);
                font-family: "Times New Roman", serif;
                font-size: 12px;
            }
        }
        
        body {
            font-family: "Times New Roman", serif;
            font-size: 12pt;
            line-height: 1.6;
            text-align: justify;
            color: #000;
        }
        
        h1, h2, h3, h4, h5, h6 {
            text-align: center;
            font-weight: bold;
            margin-top: 2em;
            margin-bottom: 1em;
        }
        
        h1 {
            font-size: 24pt;
            margin-bottom: 2em;
        }
        
        h2 {
            font-size: 18pt;
            page-break-before: always;
        }
        
        h3 {
            font-size: 16pt;
        }
        
        h4 {
            font-size: 14pt;
        }
        
        .title-page {
            text-align: center;
            page-break-after: always;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .title-page h1 {
            font-size: 36pt;
            margin-bottom: 1em;
        }
        
        .title-page h2 {
            font-size: 18pt;
            font-weight: normal;
            margin-bottom: 0.5em;
        }
        
        .toc-page {
            page-break-after: always;
        }
        
        .toc-entry {
            display: flex;
            margin-bottom: 0.5em;
        }
        
        .toc-entry a {
            text-decoration: none;
            color: black;
        }
        
        .toc-entry.part {
            margin-left: 2em;
        }
        
        .toc-entry.section {
            margin-left: 4em;
        }
        
        .toc-dots {
            flex-grow: 1;
            border-bottom: 1px dotted black;
            height: 1em;
            margin: 0 0.5em;
        }
        
        .page-num {
            font-weight: bold;
        }
        
        .chapter {
            page-break-before: always;
        }
        
        .part {
            margin-top: 2em;
        }
        
        .section {
            margin-top: 1.5em;
        }
        
        .footnotes {
            border-top: 1px solid black;
            margin-top: 2em;
            padding-top: 1em;
            font-size: 10pt;
            line-height: 1.4;
        }
        
        .footnote {
            margin-bottom: 0.5em;
        }
        
        .footnote-number {
            vertical-align: super;
            font-size: 8pt;
            margin-right: 0.3em;
        }
        
        sup a {
            text-decoration: none;
            color: blue;
            font-size: 8pt;
        }
        
        p {
            margin-bottom: 1em;
            text-align: justify;
        }
        
        /* Hebrew text support */
        [dir="rtl"] {
            direction: rtl;
            text-align: right;
        }
        
        .page-break {
            page-break-before: always;
        }
        </style>
        '''
    
    def generate_html(self, book: Book) -> str:
        """Generate complete HTML document"""
        html = f'''
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>{book.title}</title>
            {self.generate_css()}
        </head>
        <body>
        
        <!-- Title Page -->
        <div class="title-page">
            <h1>{book.title}</h1>
            <h2>A Meta-Midrashic Analysis</h2>
            <h2>of Three Ascents in the Torah</h2>
        </div>
        
        <!-- Table of Contents -->
        {self.generate_table_of_contents_html(book)}
        
        <!-- General Introduction -->
        <div id="general-introduction" class="page-break">
            <h2>General Introduction</h2>
            {self.clean_text_for_html(book.general_introduction)}
        </div>
        '''
        
        # Add chapters
        for chapter in book.chapters:
            html += f'''
            <div id="{chapter.id}" class="chapter">
                <h2>{chapter.title}</h2>
            '''
            
            if chapter.general_introduction:
                html += f'''
                <div class="chapter-intro">
                    <h3>General Introduction</h3>
                    {self.clean_text_for_html(chapter.general_introduction)}
                </div>
                '''
            
            # Add parts
            for part in chapter.parts:
                html += f'''
                <div id="{part.id}" class="part">
                    <h3>{part.title}</h3>
                '''
                
                if part.introduction:
                    html += f'''
                    <div class="part-intro">
                        <h4>Introduction</h4>
                        {self.clean_text_for_html(part.introduction)}
                    </div>
                    '''
                
                # Add sections
                for section in part.sections:
                    html += f'''
                    <div id="{section.id}" class="section">
                        <h4>{section.title}</h4>
                        {self.clean_text_for_html(section.content)}
                    '''
                    
                    # Add footnotes for this section
                    if section.footnotes:
                        html += '<div class="footnotes">'
                        for fn_num, fn_text in section.footnotes:
                            html += f'<div class="footnote" id="footnote-{fn_num}"><span class="footnote-number">{fn_num}</span>{fn_text}</div>'
                        html += '</div>'
                    
                    html += '</div>'  # Close section
                
                html += '</div>'  # Close part
            
            html += '</div>'  # Close chapter
        
        html += '''
        </body>
        </html>
        '''
        
        return html
    
    def generate_pdf(self):
        """Generate the complete scholarly PDF"""
        print("Parsing markdown file...")
        book = self.parse_markdown_file()
        if not book:
            return
        
        print("Generating HTML...")
        html_content = self.generate_html(book)
        
        # Save HTML file for debugging
        html_file = self.output_file.replace('.pdf', '.html')
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"HTML generated: {html_file}")
        print(f"To generate PDF, use a tool like wkhtmltopdf or Chrome's print-to-pdf:")
        print(f"  wkhtmltopdf {html_file} {self.output_file}")
        print(f"  Or open {html_file} in Chrome and print to PDF")

def main():
    # Set up file paths
    input_file = "aggadah-shiurim-website/public/darosh-darash-moshe.md"
    output_file = "darosh_darash_moshe_scholarly.pdf"
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"Error: Input file {input_file} not found.")
        print("Please make sure the file exists in the correct location.")
        return
    
    # Generate PDF
    generator = ScholarlyPDFGenerator(input_file, output_file)
    generator.generate_pdf()

if __name__ == "__main__":
    main() 