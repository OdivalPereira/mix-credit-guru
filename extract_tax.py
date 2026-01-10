import zipfile
import xml.etree.ElementTree as ET
import os

def extract_text_from_docx(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as z:
            xml_content = z.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            # Namespace for Word XML
            namespace = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            texts = []
            for paragraph in tree.findall('.//w:p', namespace):
                p_text = ""
                for run in paragraph.findall('.//w:r', namespace):
                    for t in run.findall('.//w:t', namespace):
                        if t.text:
                            p_text += t.text
                if p_text:
                    texts.append(p_text)
            return "\n".join(texts)
    except Exception as e:
        return f"Error extracting {docx_path}: {str(e)}"

tax_rules_dir = 'tax_rules'
output_dir = 'tax_rules_extracted'
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

for f in os.listdir(tax_rules_dir):
    if f.endswith('.docx'):
        print(f"Extracting {f}...")
        text = extract_text_from_docx(os.path.join(tax_rules_dir, f))
        output_name = f.replace('.docx', '.txt')
        with open(os.path.join(output_dir, output_name), 'w', encoding='utf-8') as out:
            out.write(text)
        print(f"Saved to {os.path.join(output_dir, output_name)}")
