import json
import os
import re
from tqdm import tqdm

RAW_DIR = "data/classics/spurgeon/raw"
CLEANED_DIR = "data/classics/spurgeon/cleaned"

os.makedirs(CLEANED_DIR, exist_ok=True)

# Listagem de sermões famosos (VIP Score 5)
FAMOUS_SERMONS = {
    1: "The Immutability of God",
    250: "Compel Them to Come In",
    573: "Baptismal Regeneration",
    18: "The Necessity of the Holy Spirit's Power",
    268: "The Blood-Shedding",
    518: "Faith What Is It?",
    2244: "The Infallibility of Scripture"
}

def clean_text(text):
    """Limpa cabeçalhos, rodapés e ruídos típicos dos PDFs do spurgeongems.org."""
    # Remover cabeçalhos de página (ex: "Sermon #1 The Immutability of God Volume 1 2 2")
    # Geralmente seguem o padrão: Nome do Sermão + Sermon #X + Volume Y + Página
    lines = text.split('\n')
    cleaned_lines = []
    
    for line in lines:
        # Pular linhas que parecem cabeçalhos/rodapés repetitivos
        if re.search(r'Sermon\s*#\d+', line, re.I) and len(line) < 100:
            continue
        if re.search(r'Volume\s*\d+', line, re.I) and len(line) < 50:
            continue
        if re.match(r'^\s*\d+\s*$', line): # Apenas número de página
            continue
        if "spurgeongems.org" in line.lower():
            continue
            
        cleaned_lines.append(line)
    
    # Juntar e remover espaços múltiplos
    text = '\n'.join(cleaned_lines)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def extract_reference(text):
    """Tenta extrair a referência bíblica principal do início do texto."""
    # Padrão comum: "Malachi 3:6" ou "John 3:16" após a introdução
    # Procurar por nomes de livros bíblicos seguidos de números
    # Esta é uma versão simplificada
    match = re.search(r'([1-2]\s)?([A-Z][a-z]+)\s(\d+):(\d+)', text)
    if match:
        return match.group(0)
    return None

def process_file(filename):
    if not filename.endswith('.json') or filename == "sermon_mapping.json":
        return
        
    raw_path = os.path.join(RAW_DIR, filename)
    clean_path = os.path.join(CLEANED_DIR, filename)
    
    try:
        with open(raw_path, 'r') as f:
            data = json.load(f)
            
        # Limpeza
        data['text_cleaned'] = clean_text(data['text'])
        
        # Atribuição de Score (1 a 5)
        s_id = int(data['id'])
        data['score'] = 5 if s_id in FAMOUS_SERMONS else 3
        
        # Referência Bíblica (se não veio no mapeamento)
        data['bible_reference'] = extract_reference(data['text'][:1000])
        
        with open(clean_path, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
    except Exception as e:
        print(f"Erro ao limpar {filename}: {e}")

def main():
    files = [f for f in os.listdir(RAW_DIR) if f.endswith('.json') and f != "sermon_mapping.json"]
    print(f"🧹 Iniciando limpeza de {len(files)} sermões...")
    
    for f in tqdm(files, desc="Limpando"):
        process_file(f)
        
    print(f"✅ Limpeza concluída. Arquivos em: {CLEANED_DIR}")

if __name__ == "__main__":
    main()
