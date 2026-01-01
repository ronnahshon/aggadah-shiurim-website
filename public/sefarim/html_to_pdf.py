#!/usr/bin/env python3
"""
Convert HTML to PDF using Playwright
"""

import asyncio
from playwright.async_api import async_playwright
import sys
import os

async def html_to_pdf(html_file: str, pdf_file: str):
    """Convert HTML file to PDF using Playwright"""
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        # Get absolute path to HTML file
        html_path = os.path.abspath(html_file)
        html_url = f"file://{html_path}"
        
        await page.goto(html_url)
        
        # Generate PDF with proper options for scholarly formatting
        await page.pdf(
            path=pdf_file,
            format='A4',
            margin={
                'top': '2cm',
                'right': '2cm',
                'bottom': '2cm',
                'left': '2cm'
            },
            print_background=True,
            display_header_footer=True,
            header_template='',
            footer_template='''
                <div style="font-size:10px; text-align:center; width:100%; margin:0;">
                    <span class="pageNumber"></span>
                </div>
            '''
        )
        
        await browser.close()
        print(f"PDF generated successfully: {pdf_file}")

def main():
    if len(sys.argv) != 3:
        print("Usage: python html_to_pdf.py <input.html> <output.pdf>")
        sys.exit(1)
    
    html_file = sys.argv[1]
    pdf_file = sys.argv[2]
    
    if not os.path.exists(html_file):
        print(f"Error: HTML file {html_file} not found.")
        sys.exit(1)
    
    asyncio.run(html_to_pdf(html_file, pdf_file))

if __name__ == "__main__":
    main() 