#!/usr/bin/env python3
"""
Enhanced scholarly PDF generator that properly handles footnotes from separate file.
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
    footnotes: List[Tuple[str, str]]

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
    all_footnotes: Dict[str, str]

class EnhancedScholarlyPDFGenerator:
    def __init__(self, main_file: str, footnotes_file: str, output_file: str):
        self.main_file = main_file
        self.footnotes_file = footnotes_file
        self.output_file = output_file
        self.footnotes = {}
        
    def parse_footnotes_file(self) -> Dict[str, str]:
        """Parse the footnotes markdown file"""
        try:
            with open(self.footnotes_file, 'r', encoding='utf-8') as f:
                content = f.read()
        except FileNotFoundError:
            print(f"Warning: Footnotes file {self.footnotes_file} not found.")
            return {}
        
        footnotes = {}
        lines = content.split('\n')
        current_footnote_num = ''
        current_footnote_content = ''
        
        for line in lines:
            line = line.strip()
            
            # Look for footnote number patterns like "**1.**" or "**123.**"
            footnote_match = re.match(r'\*\*(\d+)\.\*?\*?\s*(.*)', line)
            if footnote_match:
                # Save previous footnote if exists
                if current_footnote_num and current_footnote_content:
                    footnotes[current_footnote_num] = current_footnote_content.strip()
                
                # Start new footnote
                current_footnote_num = footnote_match.group(1)
                current_footnote_content = footnote_match.group(2)
            elif current_footnote_num and line:
                # Continue current footnote content
                current_footnote_content += ' ' + line
        
        # Save the last footnote
        if current_footnote_num and current_footnote_content:
            footnotes[current_footnote_num] = current_footnote_content.strip()
        
        print(f"Parsed {len(footnotes)} footnotes from {self.footnotes_file}")
        return footnotes
    
    def parse_main_content(self) -> Book:
        """Parse the main content file"""
        try:
            with open(self.main_file, 'r', encoding='utf-8') as f:
                content = f.read()
        except FileNotFoundError:
            print(f"Error: Main file {self.main_file} not found.")
            return None
        
        # Parse footnotes first
        self.footnotes = self.parse_footnotes_file()
        
        # Parse the main content structure
        book = Book(
            title="Darosh Darash Moshe",
            general_introduction="",
            chapters=[],
            all_footnotes=self.footnotes
        )
        
        # Extract general introduction
        gen_intro_match = re.search(r'\*\*\*General Introduction\*\*\*(.*?)(?=\*\*\*Chapter|$)', content, re.DOTALL)
        if gen_intro_match:
            book.general_introduction = gen_intro_match.group(1).strip()
        
        # Extract chapters
        chapter_pattern = r'\*\*\*Chapter ([IVX]+)\*\*\*(.*?)(?=\*\*\*Chapter|$)'
        chapters = re.findall(chapter_pattern, content, re.DOTALL)
        
        chapter_titles = {
            'I': 'Chapter I: Givat Rephidim',
            'II': 'Chapter II: Har Sinai', 
            'III': 'Chapter III: Hor HaHar'
        }
        
        for i, (chapter_num, chapter_content) in enumerate(chapters):
            if chapter_num in chapter_titles:
                chapter = self.parse_chapter(
                    chapter_content.strip(),
                    chapter_titles[chapter_num],
                    f"chapter-{chapter_num.lower()}"
                )
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
        
        # Split by parts
        part_pattern = r'\*Part (\d+): ([^*]+)\*'
        parts = re.split(part_pattern, content)
        
        # First part is general introduction
        if parts and parts[0].strip():
            chapter.general_introduction = parts[0].strip()
        
        # Process parts (groups of 3: part_num, part_title, part_content)
        for i in range(1, len(parts), 3):
            if i + 2 < len(parts):
                part_num = parts[i]
                part_title = parts[i + 1].strip()
                part_content = parts[i + 2]
                
                part = self.parse_part(
                    part_content,
                    f"Part {part_num}: {part_title}",
                    f"part-{part_num}"
                )
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
        
        # Split by sections
        section_pattern = r'\*\*\[([^\]]+)\]\{\.underline\}\*\*'
        sections = re.split(section_pattern, content)
        
        # First part is introduction
        if sections and sections[0].strip():
            part.introduction = sections[0].strip()
        
        # Process sections (groups of 2: section_title, section_content)
        for i in range(1, len(sections), 2):
            if i + 1 < len(sections):
                section_title = sections[i]
                section_content = sections[i + 1].strip()
                
                section = Section(
                    id=f"section-{i//2 + 1}",
                    title=section_title,
                    content=section_content,
                    footnotes=self.extract_footnotes_from_text(section_content)
                )
                part.sections.append(section)
        
        return part
    
    def extract_footnotes_from_text(self, text: str) -> List[Tuple[str, str]]:
        """Extract footnotes referenced in text"""
        footnote_refs = re.findall(r'\*\*\^?\[(\d+)\]\{\.underline\}\^?\*\*', text)
        footnotes = []
        
        for ref in footnote_refs:
            footnote_text = self.footnotes.get(ref, f"[Footnote {ref} not found]")
            footnotes.append((ref, footnote_text))
        
        return footnotes
    
    def clean_text_for_html(self, text: str) -> str:
        """Clean and format text for HTML"""
        # Remove markdown formatting and convert to HTML
        text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)
        text = re.sub(r'\*([^*]+)\*', r'<em>\1</em>', text)
        text = re.sub(r'\[([^\]]+)\]\{\.underline\}', r'<u>\1</u>', text)
        
        # Handle footnote references
        text = re.sub(r'\*\*\^?\[(\d+)\]\{\.underline\}\^?\*\*', r'<sup><a href="#footnote-\1" class="footnote-ref">\1</a></sup>', text)
        
        # Handle Hebrew/English content in divs - remove div tags but preserve content
        text = re.sub(r'<div[^>]*style="[^"]*flex[^"]*"[^>]*>(.*?)</div>', r'\1', text, flags=re.DOTALL)
        text = re.sub(r'<div[^>]*>(.*?)</div>', r'\1', text, flags=re.DOTALL)
        
        # Convert line breaks to paragraphs
        paragraphs = text.split('\n\n')
        formatted_paragraphs = []
        
        for para in paragraphs:
            para = para.strip()
            if para:
                # Check for Hebrew content
                if re.search(r'[\u0590-\u05FF]', para):
                    formatted_paragraphs.append(f'<p dir="rtl" style="text-align: justify;">{para}</p>')
                else:
                    formatted_paragraphs.append(f'<p style="text-align: justify;">{para}</p>')
        
        return '\n'.join(formatted_paragraphs)
    
    def generate_css(self) -> str:
        """Generate enhanced CSS for scholarly format"""
        return '''
        <style>
        @page {
            size: A4;
            margin: 2.5cm;
            @bottom-center {
                content: counter(page);
                font-family: "Times New Roman", serif;
                font-size: 11px;
                margin-top: 1cm;
            }
        }
        
        body {
            font-family: "Times New Roman", serif;
            font-size: 12pt;
            line-height: 1.7;
            text-align: justify;
            color: #000;
            margin: 0;
            padding: 0;
        }
        
        h1, h2, h3, h4, h5, h6 {
            text-align: center;
            font-weight: bold;
            margin-top: 2em;
            margin-bottom: 1.2em;
        }
        
        h1 {
            font-size: 24pt;
            margin-bottom: 2em;
            page-break-after: avoid;
        }
        
        h2 {
            font-size: 18pt;
            page-break-before: always;
            page-break-after: avoid;
        }
        
        h3 {
            font-size: 16pt;
            page-break-after: avoid;
        }
        
        h4 {
            font-size: 14pt;
            page-break-after: avoid;
        }
        
        .title-page {
            text-align: center;
            page-break-after: always;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        
        .title-page h1 {
            font-size: 36pt;
            margin-bottom: 1em;
        }
        
        .title-page h2 {
            font-size: 20pt;
            font-weight: normal;
            margin-bottom: 0.5em;
            page-break-before: auto;
        }
        
        .toc-page {
            page-break-after: always;
            padding: 2em 0;
        }
        
        .toc-entry {
            display: flex;
            align-items: baseline;
            margin-bottom: 0.7em;
            line-height: 1.4;
        }
        
        .toc-entry a {
            text-decoration: none;
            color: black;
        }
        
        .toc-entry.part {
            margin-left: 2em;
            font-size: 11pt;
        }
        
        .toc-entry.section {
            margin-left: 4em;
            font-size: 10pt;
        }
        
        .toc-dots {
            flex-grow: 1;
            border-bottom: 1px dotted #666;
            height: 0.8em;
            margin: 0 0.5em;
            min-width: 2em;
        }
        
        .page-num {
            font-weight: bold;
            font-size: 11pt;
        }
        
        .chapter {
            page-break-before: always;
        }
        
        .part {
            margin-top: 2.5em;
        }
        
        .section {
            margin-top: 2em;
        }
        
        .footnotes {
            border-top: 1px solid #333;
            margin-top: 2.5em;
            padding-top: 1em;
            font-size: 10pt;
            line-height: 1.5;
            page-break-inside: avoid;
        }
        
        .footnote {
            margin-bottom: 0.8em;
            text-align: justify;
            page-break-inside: avoid;
            display: block;
        }
        
        .footnote-number {
            font-weight: bold;
            color: #000;
            margin-right: 0.3em;
            font-size: 9pt;
            vertical-align: baseline;
        }
        
        .footnote-ref {
            text-decoration: none;
            color: #0066cc;
            font-weight: normal;
        }
        
        .footnote-ref:hover {
            text-decoration: underline;
        }
        
        sup {
            font-size: 9pt;
        }
        
        p {
            margin-bottom: 1.2em;
            text-align: justify;
            text-indent: 0;
            orphans: 2;
            widows: 2;
        }
        
        /* Hebrew text support */
        [dir="rtl"] {
            direction: rtl;
            text-align: right;
        }
        
        [dir="rtl"] p {
            text-align: justify;
        }
        
        /* Page breaks */
        .page-break {
            page-break-before: always;
        }
        
        .avoid-break {
            page-break-inside: avoid;
        }
        
        /* Print optimizations */
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            
            .footnotes {
                break-inside: avoid-page;
            }
            
            .footnote {
                break-inside: avoid-page;
            }
        }
        </style>
        '''
    
    def generate_table_of_contents_html(self, book: Book) -> str:
        """Generate enhanced table of contents"""
        toc_html = '''
        <div class="toc-page">
            <h1>Table of Contents</h1>
            <div class="toc-entries">
        '''
        
        # General Introduction
        toc_html += '''
            <div class="toc-entry">
                <a href="#general-introduction">General Introduction</a>
                <span class="toc-dots"></span>
                <span class="page-num">5</span>
            </div>
        '''
        
        page_num = 8
        for chapter in book.chapters:
            toc_html += f'''
                <div class="toc-entry chapter">
                    <a href="#{chapter.id}"><strong>{chapter.title}</strong></a>
                    <span class="toc-dots"></span>
                    <span class="page-num">{page_num}</span>
                </div>
            '''
            page_num += 2
            
            for part in chapter.parts:
                toc_html += f'''
                    <div class="toc-entry part">
                        <a href="#{part.id}">{part.title}</a>
                        <span class="toc-dots"></span>
                        <span class="page-num">{page_num}</span>
                    </div>
                '''
                page_num += 1
                
                for section in part.sections:
                    toc_html += f'''
                        <div class="toc-entry section">
                            <a href="#{section.id}">{section.title}</a>
                            <span class="toc-dots"></span>
                            <span class="page-num">{page_num}</span>
                        </div>
                    '''
                    page_num += 1
        
        toc_html += '''
            </div>
        </div>
        '''
        
        return toc_html
    
    def generate_html(self, book: Book) -> str:
        """Generate complete HTML document"""
        html = f'''
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{book.title}</title>
            {self.generate_css()}
        </head>
        <body>
        
        <!-- Title Page -->
        <div class="title-page">
            <h1>{book.title}</h1>
            <h2>A Meta-Midrashic Analysis of Three Ascents in the Torah</h2>
            <h2 style="font-size: 16pt; margin-top: 2em;">מנחם אב תשפ״ג / August 2023</h2>
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
                <div class="chapter-intro avoid-break">
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
                    <div class="part-intro avoid-break">
                        <h4>Introduction</h4>
                        {self.clean_text_for_html(part.introduction)}
                    </div>
                    '''
                
                # Add sections with footnotes
                for section in part.sections:
                    html += f'''
                    <div id="{section.id}" class="section">
                        <h4>{section.title}</h4>
                        {self.clean_text_for_html(section.content)}
                    '''
                    
                    # Add footnotes for this section
                    if section.footnotes:
                        html += '<div class="footnotes">'
                        html += '<div style="font-weight: bold; margin-bottom: 0.5em; text-align: center;">___________</div>'
                        for fn_num, fn_text in section.footnotes:
                            clean_footnote = self.clean_text_for_html(fn_text)
                            html += f'''
                            <div class="footnote" id="footnote-{fn_num}">
                                <span class="footnote-number">{fn_num}</span>{clean_footnote.replace('<p style="text-align: justify;">', '').replace('</p>', '')}
                            </div>
                            '''
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
        """Generate the enhanced scholarly PDF"""
        print("Parsing main content and footnotes...")
        book = self.parse_main_content()
        if not book:
            return
        
        print(f"Found {len(book.chapters)} chapters and {len(book.all_footnotes)} footnotes")
        
        print("Generating enhanced HTML...")
        html_content = self.generate_html(book)
        
        # Save HTML file
        html_file = self.output_file.replace('.pdf', '_enhanced.html')
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"Enhanced HTML generated: {html_file}")
        print(f"To generate PDF, run:")
        print(f"  python3 html_to_pdf.py {html_file} {self.output_file}")

def main():
    # Set up file paths
    main_file = "aggadah-shiurim-website/public/darosh-darash-moshe.md"
    footnotes_file = "aggadah-shiurim-website/public/darosh-darash-moshe-footnotes.md"
    output_file = "darosh_darash_moshe_enhanced.pdf"
    
    # Check if files exist
    if not os.path.exists(main_file):
        print(f"Error: Main file {main_file} not found.")
        return
    
    if not os.path.exists(footnotes_file):
        print(f"Warning: Footnotes file {footnotes_file} not found.")
    
    # Generate PDF
    generator = EnhancedScholarlyPDFGenerator(main_file, footnotes_file, output_file)
    generator.generate_pdf()

if __name__ == "__main__":
    main() 