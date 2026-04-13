import os
import json
import time
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client, Client
from tqdm import tqdm
import textwrap

# 1. Carregar Variáveis de Ambiente
load_dotenv('.env.local')  # Tenta pegar do .local caso as chaves master estejam lá
load_dotenv('.env')

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
# Usamos a chave de SERVIÇO (role key) para ignorar o RLS de inserção no banco
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") 
OPENAI_KEY = os.environ.get("OPENAI_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or not OPENAI_KEY:
    print("❌ ERRO: Faltam chaves de ambiente. Certifique-se de configurar VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e OPENAI_API_KEY")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
client = OpenAI(api_key=OPENAI_KEY)

# Configurações do RAG
EMBEDDING_MODEL = "text-embedding-3-small"
CHUNK_SIZE = 1000  # Caracteres por fatia

def get_embedding(text):
    text = text.replace("\n", " ")
    response = client.embeddings.create(input=[text], model=EMBEDDING_MODEL)
    return response.data[0].embedding

def chunk_text(text, max_length=CHUNK_SIZE):
    return textwrap.wrap(text, width=max_length, break_long_words=False, replace_whitespace=False)

def vectorize_mind_corpus(mind_id, clean_dir):
    print(f"\n🧠 Iniciando Vetorização Mestra para a Mente: {mind_id}")
    print(f"📂 Lendo de: {clean_dir}")
    
    if not os.path.exists(clean_dir):
        print(f"❌ Diretório não encontrado: {clean_dir}")
        return

    files = [f for f in os.listdir(clean_dir) if f.endswith('.json')]
    print(f"📊 Encontrados {len(files)} arquivos.")

    # Teria um tqdm aqui rodando em tela
    for filename in tqdm(files, desc="Processando Documentos"):
        filepath = os.path.join(clean_dir, filename)
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        text = data.get('text') or data.get('original_text') or ''
        title = data.get('title', 'Documento Sem Título')
        metadata = data.get('metadata', {})
        
        if not text:
            continue
            
        chunks = chunk_text(text)
        
        for i, chunk in enumerate(chunks):
            # Verificar se o chunk já existe (idealmente pelo hash, mas aqui inserimos direto)
            try:
                embedding = get_embedding(chunk)
                
                # Inserir no Supabase (elite_mind_content)
                supabase.table('elite_mind_content').insert({
                    "mind_id": mind_id,
                    "title": f"{title} (Parte {i+1})",
                    "content_chunk": chunk,
                    "embedding": embedding,
                    "metadata": metadata
                }).execute()
                
                # Evitar Rate Limit OpenAI
                time.sleep(0.01)
                
            except Exception as e:
                print(f"❌ Erro na fatia de {title}: {e}")

if __name__ == "__main__":
    # Início da Ingestão do Squad of Elite
    
    # 1. Spurgeon (Os 3.528 limpos)
    vectorize_mind_corpus('charles-spurgeon', 'data/classics/spurgeon/cleaned')
    
    # 2. Wesley (Os 141)
    vectorize_mind_corpus('john-wesley', 'data/classics/wesley/raw')
    
    print("\n🎉 VETORIZAÇÃO CONCLUÍDA! As mentes agora estão ativas e com memória de longo prazo!")
