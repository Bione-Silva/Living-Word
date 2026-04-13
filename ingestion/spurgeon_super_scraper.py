import requests
from bs4 import BeautifulSoup
import os
import json
import time
from pypdf import PdfReader
from tqdm import tqdm
import re

# Configurações
BASE_URL = "https://www.spurgeongems.org/spurgeon-sermons/"
PDF_BASE_URL = "https://www.spurgeongems.org/sermon/"
OUTPUT_DIR = "data/classics/spurgeon/raw"
MAPPING_FILE = os.path.join(OUTPUT_DIR, "sermon_mapping.json")

# Garantir diretórios
os.makedirs(OUTPUT_DIR, exist_ok=True)

def fetch_sermon_mapping():
    """Mapeia os títulos e IDs dos sermões a partir da página de índice."""
    if os.path.exists(MAPPING_FILE):
        print("✓ Mapa de sermões já existe. Carregando...")
        with open(MAPPING_FILE, 'r') as f:
            return json.load(f)
    
    print("🚀 Mapeando acervo no site spurgeongems.org...")
    try:
        response = requests.get(BASE_URL)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        mapping = {}
        # Seleciona todos os links que terminam em .pdf
        links = soup.select('a[href*=".pdf"]')
        
        for link in links:
            href = link.get('href', '')
            title = link.text.strip()
            # Padrão: chs1.pdf -> id 1
            match = re.search(r'chs(\d+)\.pdf', href)
            if match:
                s_id = match.group(1)
                mapping[s_id] = {
                    "title": title,
                    "url": href if href.startswith('http') else f"https://www.spurgeongems.org{href}",
                    "id": int(s_id)
                }
        
        with open(MAPPING_FILE, 'w') as f:
            json.dump(mapping, f, indent=2)
        
        print(f"✓ Mapeados {len(mapping)} sermões.")
        return mapping
    except Exception as e:
        print(f"❌ Erro ao mapear: {e}")
        return {}

def process_sermon(s_id, info):
    """Baixa o PDF e converte para JSON."""
    pdf_path = os.path.join(OUTPUT_DIR, f"chs{s_id}.pdf")
    json_path = os.path.join(OUTPUT_DIR, f"chs{s_id}.json")
    
    if os.path.exists(json_path):
        return True # Já processado
    
    try:
        # 1. Download do PDF (se não existir)
        if not os.path.exists(pdf_path):
            resp = requests.get(info['url'], timeout=30)
            resp.raise_for_status()
            with open(pdf_path, 'wb') as f:
                f.write(resp.content)
        
        # 2. Conversão para Texto
        reader = PdfReader(pdf_path)
        full_text = ""
        for page in reader.pages:
            full_text += page.extract_text() + "\n"
        
        # 3. Salvar JSON
        data = {
            "id": info['id'],
            "title": info['title'],
            "original_url": info['url'],
            "text": full_text.strip(),
            "source": "spurgeongems.org"
        }
        
        with open(json_path, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        return True
    except Exception as e:
        print(f"\n⚠️ Erro no sermão {s_id}: {e}")
        return False

def main(limit=None):
    mapping = fetch_sermon_mapping()
    if not mapping:
        return
    
    # Ordenar por ID
    sorted_ids = sorted(mapping.keys(), key=lambda x: int(x))
    
    if limit:
        sorted_ids = sorted_ids[:limit]
        print(f"⌛ Iniciando download de amostra: {limit} sermões...")
    else:
        print(f"⌛ Iniciando download completo de {len(sorted_ids)} sermões em modo TURBO (Paralelo)...")

    # Usando ThreadPoolExecutor para baixar mais rápido
    from concurrent.futures import ThreadPoolExecutor, as_completed
    
    success_count = 0
    max_workers = 10 # Baixar 10 simultaneamente
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Criar as tarefas
        futures = {executor.submit(process_sermon, s_id, mapping[s_id]): s_id for s_id in sorted_ids}
        
        # Monitorar progresso
        for future in tqdm(as_completed(futures), total=len(sorted_ids), desc="Ingestão de Sermões"):
            try:
                if future.result():
                    success_count += 1
            except Exception as e:
                pass

    print(f"\n📊 Resultado: {success_count}/{len(sorted_ids)} sermões finalizados.")
    print(f"📂 Dados salvos em: {OUTPUT_DIR}")

if __name__ == "__main__":
    # Para teste inicial, rodar apenas 5. Mudar para None para full.
    import sys
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 5
    main(limit=limit)
