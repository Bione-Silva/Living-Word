import os
import json
import requests
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor

BASE_URL = "https://billygraham.org/audio/sermons/page/{}/"
RAW_DIR = "data/classics/graham/raw"
os.makedirs(RAW_DIR, exist_ok=True)

def fetch_links(page_num):
    url = BASE_URL.format(page_num)
    try:
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
        if response.status_code != 200: return []
        soup = BeautifulSoup(response.text, "html.parser")
        links = []
        for a in soup.find_all('a', class_='post-thumbnail'):
            links.append({"title": a.get('aria-label', 'Sermon').strip(), "url": a.get('href')})
        return links
    except:
        return []

def download_sermon(sermon_info, index):
    url = sermon_info['url']
    title = sermon_info['title']
    safe_filename = f"graham_sermon_{index:03d}.json"
    filepath = os.path.join(RAW_DIR, safe_filename)
    
    if os.path.exists(filepath): return True
        
    try:
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Typically the sermon text is in the main body or a transcript div
        content_div = soup.find('div', class_='entry-content') or soup.find('article')
        if not content_div: return False
        
        text = content_div.get_text(separator="\n", strip=True)
        
        data = {
            "mind_id": "billy-graham",
            "title": title,
            "url": url,
            "original_text": text,
            "author": "Billy Graham",
            "source": "BGEA Archives"
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        print(f"✅ Capturado (Billy Graham): {title}")
        return True
    except Exception as e:
        print(f"❌ Erro baixando {url}: {e}")
        return False

def main():
    print("Iniciando varredura no BGEA (Billy Graham Evangelistic Association)...")
    sermons = []
    # Testar primeiras 20 páginas de áudio/sermões
    for page in range(1, 21):
        sermons.extend(fetch_links(page))
        print(f"Página {page} varrida. Total parcial: {len(sermons)}")
    
    print(f"Total de {len(sermons)} sermões encontrados. Iniciando downloads...")
    with ThreadPoolExecutor(max_workers=5) as executor:
        for i, s in enumerate(sermons, 1):
            executor.submit(download_sermon, s, i)
            
    print(f"\n🎉 Concluído! Sermões de Graham salvos em {RAW_DIR}")

if __name__ == "__main__":
    main()
