import os
import json
import requests
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor

BASE_URL = "https://www.ccel.org/ccel/calvin/institutes/institutes.html"
RAW_DIR = "data/classics/calvin/raw"
os.makedirs(RAW_DIR, exist_ok=True)

def fetch_links():
    try:
        response = requests.get(BASE_URL, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
        if response.status_code != 200: return []
        soup = BeautifulSoup(response.text, "html.parser")
        links = []
        for a in soup.find_all('a', href=True):
            href = a['href']
            # O CCEL costuma usar números de páginas/documentos, ex: institutes.iii.i.html
            if "institutes." in href and href.endswith(".html"):
                full_url = requests.compat.urljoin(BASE_URL, href)
                links.append({"title": a.text.strip(), "url": full_url})
        return links
    except:
        return []

def download_section(section_info, index):
    url = section_info['url']
    title = section_info['title']
    if not title:
        title = f"Institutes Section {index}"
        
    safe_filename = f"calvin_institutes_{index:03d}.json"
    filepath = os.path.join(RAW_DIR, safe_filename)
    
    if os.path.exists(filepath): return True
        
    try:
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        
        content_div = soup.find('div', id='content') or soup.body
        if not content_div: return False
        
        text = content_div.get_text(separator="\n", strip=True)
        
        data = {
            "mind_id": "joao-calvino",
            "title": title,
            "url": url,
            "original_text": text,
            "author": "João Calvino",
            "source": "CCEL (Institutes of the Christian Religion)"
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        print(f"✅ Capturado (Calvino): {title}")
        return True
    except Exception as e:
        print(f"❌ Erro baixando {url}: {e}")
        return False

def main():
    print("Iniciando busca do acervo de João Calvino (Institutas)...")
    sections = fetch_links()
    
    print(f"Total de {len(sections)} capítulos/seções encontrados. Iniciando downloads...")
    with ThreadPoolExecutor(max_workers=5) as executor:
        for i, s in enumerate(sections, 1):
            executor.submit(download_section, s, i)
            
    print(f"\n🎉 Concluído! Institutas de Calvino salvas em {RAW_DIR}")

if __name__ == "__main__":
    main()
