
import zipfile
import re
import sys
import os

def extract_text_regex(docx_path, out_file):
    try:
        with zipfile.ZipFile(docx_path) as z:
            xml_content = z.read("word/document.xml").decode("utf-8")
            # Remove XML tags and keep text content
            text_blocks = re.findall(r'<w:t[^>]*>(.*?)</w:t>', xml_content)
            
            with open(out_file, 'w', encoding='utf-8') as f:
                f.write('\n'.join(text_blocks))
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python extract_docx_regex.py <docx_path> <out_path>")
        sys.exit(1)
        
    extract_text_regex(sys.argv[1], sys.argv[2])
