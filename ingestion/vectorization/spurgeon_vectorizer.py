import os
import json
import time
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI

load_dotenv('../../.env.local')

# Setup Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Setup OpenAI
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

CHUNK_SIZE = 1500

def get_embedding(text):
    response = openai_client.embeddings.create(
        input=text,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def chunk_text(text, size):
    return [text[i:i+size] for i in range(0, len(text), size)]

def vectorize_spurgeon_knowledge():
    raw_dir = '../../data/classics/spurgeon/cleaned'
    mind_id = 'spurgeon'
    
    print("Iniciando Vetorização Completa dos Sermões de Spurgeon...")
    
    if not os.path.exists(raw_dir):
        print(f"Diretório não encontrado: {raw_dir}")
        return
        
    files = [f for f in os.listdir(raw_dir) if f.endswith('.json')]
    print(f"Total de arquivos encontrados: {len(files)}")
    
    for filename in files:
        filepath = os.path.join(raw_dir, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            title = data.get("title", f"Sermão {filename}")
            content = data.get("content", data.get("text", ""))
            
            if not content:
                print(f"Aviso: {filename} sem conteúdo.")
                continue
                
            chunks = chunk_text(content, CHUNK_SIZE)
            print(f"[{title}] Gerando {len(chunks)} chunks vetoriais...")
            
            for i, chunk in enumerate(chunks):
                emb = get_embedding(chunk)
                supabase.table('elite_mind_content').insert({
                    'mind_id': mind_id,
                    'title': f"{title} - Parte {i+1}",
                    'content_chunk': chunk,
                    'embedding': emb,
                    'metadata': {'type': 'sermon', 'source': filename, 'author': 'Charles Spurgeon'}
                }).execute()
                time.sleep(0.1) # rate limit protect API OpenAI
                
            print(f"✅ {title} finalizado com sucesso!")
            
        except Exception as e:
            print(f"Erro ao processar {filename}: {str(e)}")
            continue

if __name__ == "__main__":
    vectorize_spurgeon_knowledge()
    print("🎉 Ouro Teológico Injetado na Base RAG!")
