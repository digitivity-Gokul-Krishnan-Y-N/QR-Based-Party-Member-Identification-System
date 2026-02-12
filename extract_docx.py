
from docx import Document
import sys
import os

def extract_content(file_path):
    try:
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            return
            
        doc = Document(file_path)
        full_text = []
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text.strip())
        print('\n'.join(full_text))
        
    except Exception as e:
        print(f"Error reading docx: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_docx.py <docx_path>")
        sys.exit(1)
        
    extract_content(sys.argv[1])
