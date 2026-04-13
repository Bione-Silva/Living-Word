import os
import time
import json
import requests
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor

BASE_URL = "http://wesley.nnu.edu/"
INDEX_URL = "http://wesley.nnu.edu/john-wesley/the-sermons-of-john-wesley-1872-edition/the-sermons-of-john-wesley-thomas-jacksons-numbering/"
RAW_DIR = "data/classics/wesley/raw"
os.makedirs(RAW_DIR, exist_ok=True)

def fetch_index():
    print(f"Buscando índice de sermões de Wesley em {INDEX_URL}")
    response = requests.get(INDEX_URL, headers={"User-Agent": "Mozilla/5.0"})
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    
    sermon_links = []
    # Os links normalmente segu0em o padrão sermon-XX
    for a in soup.find_all('a', href=True):
        href = a['href']
        if "sermon-" in href.lower() and not href.startswith("http"):
            full_url = requests.compat.urljoin(BASE_URL, href)
            if full_url not in [link['url'] for link in sermon_links] and 'introduction' not in href:
                sermon_links.append({"title": a.text.strip(), "url": full_url})
                
    print(f"Total de {len(sermon_links)} sermões encontrados no índice.")
    return sermon_links

def download_sermon(sermon_info, index):
    url = sermon_info['url']
    title = sermon_info['title']
    safe_filename = f"wesley_sermon_{index:03d}.json"
    filepath = os.path.join(RAW_DIR, safe_filename)
    
    if os.path.exists(filepath):
        return True
        
    try:
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Tentativa de extrair o conteúdo principal
        content_div = soup.find('div', class_='field-item') or soup.find('div', id='content') or soup.body
        text = content_div.get_text(separator="\n", strip=True) if content_div else soup.get_text(separator="\n", strip=True)
        
        data = {
            "mind_id": "john-wesley",
            "title": title,
            "url": url,
            "original_text": text,
            "author": "John Wesley",
            "source": "Wesley Center Online (1872 Edition)"
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        print(f"✅ Capturado: {title}")
        return True
    except Exception as e:
        print(f"❌ Erro baixando {url}: {e}")
        return False

def main():
    sermons = fetch_index()
    print("Iniciando captura em massa (Modo Turbo ativo)...")
    
    with ThreadPoolExecutor(max_workers=5) as executor:
        for i, s in enumerate(sermons, 1):
            executor.submit(download_sermon, s, i)
            
    print(f"\n🎉 Concluído! Sermões salvos em {RAW_DIR}")

if __name__ == "__main__":
    main()
