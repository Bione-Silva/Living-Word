import os
import json
import pypdf

# Configuração dos alvos
PDF_FILES = [
    {"name": "35+Milagres+de+Jesus.pdf", "type": "miracles"},
    {"name": "40+Parábolas+de+JEsus.pdf", "type": "parables"},
    {"name": "200+PERSONAGENS+BÍBLICOS.pdf", "type": "characters"},
    {"name": "250+quiz+bíblico.pdf", "type": "quiz"},
    {"name": "Panorama+Bíblico.pdf", "type": "panorama"}
]

RAW_DIR = "data/biblical_base/raw"

def extract_pdf_text(filepath):
    text_content = []
    try:
        with open(filepath, 'rb') as f:
            reader = pypdf.PdfReader(f)
            total_pages = len(reader.pages)
            for i in range(total_pages):
                page = reader.pages[i]
                text = page.extract_text()
                if text:
                    text_content.append(f"--- PAGE {i+1} ---\n{text.strip()}")
        return "\n\n".join(text_content)
    except Exception as e:
        print(f"Erro ao processar {filepath}: {e}")
        return None

def main():
    print("Iniciando extração do Conhecimento Bíblico Essencial (Ouro Teológico)...")
    
    for pdf_info in PDF_FILES:
        filename = pdf_info["name"]
        doc_type = pdf_info["type"]
        
        # Procurar o arquivo no diretório raiz
        if not os.path.exists(filename):
            print(f"⚠️ Arquivo não localizado: {filename}")
            continue
            
        print(f"⏳ Processando: {filename}...")
        extracted_text = extract_pdf_text(filename)
        
        if extracted_text:
            output_file = os.path.join(RAW_DIR, f"{doc_type}_raw.json")
            data = {
                "source_file": filename,
                "document_type": doc_type,
                "total_length": len(extracted_text),
                "text": extracted_text
            }
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                
            print(f"✅ Concluído: {doc_type}_raw.json salvo com sucesso! ({len(extracted_text)} caracteres)")
            
    print("\n🎉 Extração Finalizada! Todo o conhecimento base está solto nos arquivos JSON.")

if __name__ == "__main__":
    main()
