#!/usr/bin/env python3
import re

def update_main_text_footnotes():
    """Update footnote numbers in the main text file"""
    print("Processing main text file...")
    
    with open('darosh-darash-moshe.md', 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')

    # Find chapter boundaries
    chapter2_start = None
    chapter3_start = None

    for i, line in enumerate(lines):
        if '***Chapter II***' in line:
            chapter2_start = i
        elif '***Chapter III***' in line:
            chapter3_start = i

    print(f'Chapter II starts at line: {chapter2_start + 1}')
    print(f'Chapter III starts at line: {chapter3_start + 1}')

    # Update Chapter II footnotes (add 126)
    if chapter2_start is not None and chapter3_start is not None:
        updated_count_ch2 = 0
        for i in range(chapter2_start, chapter3_start):
            original_line = lines[i]
            # Match footnote pattern ^[number]{.underline}^
            lines[i] = re.sub(r'\^\[(\d+)\]\{\.underline\}\^', 
                             lambda m: f'^[{int(m.group(1)) + 126}]{{.underline}}^', 
                             lines[i])
            if lines[i] != original_line:
                updated_count_ch2 += 1

        print(f'Updated {updated_count_ch2} footnotes in Chapter II')

    # Update Chapter III footnotes (add 245)
    if chapter3_start is not None:
        updated_count_ch3 = 0
        for i in range(chapter3_start, len(lines)):
            original_line = lines[i]
            lines[i] = re.sub(r'\^\[(\d+)\]\{\.underline\}\^', 
                             lambda m: f'^[{int(m.group(1)) + 245}]{{.underline}}^', 
                             lines[i])
            if lines[i] != original_line:
                updated_count_ch3 += 1

        print(f'Updated {updated_count_ch3} footnotes in Chapter III')

    # Write back the updated content
    with open('darosh-darash-moshe.md', 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

    print('Updated main text file successfully!')

def update_footnotes_file():
    """Update footnote numbers in the footnotes file"""
    print("\nProcessing footnotes file...")
    
    with open('darosh-darash-moshe-footnotes.md', 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')

    # Find chapter boundaries in footnotes file
    # Looking for where Chapter II footnotes start (around line 1442 with "Har Sinai")
    # and Chapter III footnotes start (line 3055)
    
    chapter2_footnotes_start = None
    chapter3_footnotes_start = None

    for i, line in enumerate(lines):
        if '**Har Sinai -**' in line and chapter2_footnotes_start is None:
            chapter2_footnotes_start = i
        elif '***Chapter III***' in line and chapter3_footnotes_start is None:
            chapter3_footnotes_start = i

    if chapter2_footnotes_start is None:
        # Try finding Chapter II start another way
        for i, line in enumerate(lines):
            if line.strip() == '***Chapter I***' and i > 1000:  # The second occurrence
                chapter2_footnotes_start = i
                break

    print(f'Chapter II footnotes start at line: {chapter2_footnotes_start + 1 if chapter2_footnotes_start else "Not found"}')
    print(f'Chapter III footnotes start at line: {chapter3_footnotes_start + 1 if chapter3_footnotes_start else "Not found"}')

    # Update Chapter II footnotes (add 126)
    if chapter2_footnotes_start is not None and chapter3_footnotes_start is not None:
        updated_count_ch2 = 0
        for i in range(chapter2_footnotes_start, chapter3_footnotes_start):
            original_line = lines[i]
            # Match footnote pattern **number.**
            lines[i] = re.sub(r'\*\*(\d+)\.\*\*', 
                             lambda m: f'**{int(m.group(1)) + 126}.**', 
                             lines[i])
            if lines[i] != original_line:
                updated_count_ch2 += 1

        print(f'Updated {updated_count_ch2} footnotes in Chapter II')

    # Update Chapter III footnotes (add 245)  
    if chapter3_footnotes_start is not None:
        updated_count_ch3 = 0
        for i in range(chapter3_footnotes_start, len(lines)):
            original_line = lines[i]
            lines[i] = re.sub(r'\*\*(\d+)\.\*\*', 
                             lambda m: f'**{int(m.group(1)) + 245}.**', 
                             lines[i])
            if lines[i] != original_line:
                updated_count_ch3 += 1

        print(f'Updated {updated_count_ch3} footnotes in Chapter III')

    # Write back the updated content
    with open('darosh-darash-moshe-footnotes.md', 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

    print('Updated footnotes file successfully!')

if __name__ == "__main__":
    update_main_text_footnotes()
    update_footnotes_file()
    print("\nFootnote refactoring completed!") 