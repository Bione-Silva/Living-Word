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

def vectorize_biblical_knowledge():
    raw_dir = '../../data/biblical_base/raw'
    mind_id = 'base-biblica'
    
    print("Iniciando Vetorização da Base Bíblica de Conhecimento...")
    
    if not os.path.exists(raw_dir):
        print("Diretório de base bíblica não encontrado.")
        return
        
    for filename in os.listdir(raw_dir):
        if not filename.endswith('.json'):
            continue
            
        filepath = os.path.join(raw_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        title = data.get("document_type", filename).upper()
        content = data.get("text", "")
        
        chunks = chunk_text(content, CHUNK_SIZE)
        print(f"[{title}] Gerando {len(chunks)} chunks vetoriais...")
        
        for i, chunk in enumerate(chunks):
            try:
                emb = get_embedding(chunk)
                supabase.table('elite_mind_content').insert({
                    'mind_id': mind_id,
                    'title': f"{title} - Parte {i+1}",
                    'content_chunk': chunk,
                    'embedding': emb,
                    'metadata': {'type': 'biblical_base', 'source': filename}
                }).execute()
                time.sleep(0.01) # rate limit protect
            except Exception as e:
                print(f"Erro no chunk {i} de {title}: {str(e)}")
                
        print(f"✅ {title} finalizado com sucesso!")
        
if __name__ == "__main__":
    vectorize_biblical_knowledge()
    print("🎉 Ouro Teológico Injetado na Base RAG!")
