#!/usr/bin/env python3
"""
cea-local-ingest.py
Ingestão RAG local — processa PDFs localmente e salva no Supabase
Pipeline: PDF (pdftotext) → Chunks → Gemini embeddings → Supabase REST

Uso:
  python3 scripts/cea-local-ingest.py              # todos os PDFs
  python3 scripts/cea-local-ingest.py quiz          # apenas quiz
  python3 scripts/cea-local-ingest.py quiz --force  # re-ingerir

Dependências (pip install):
  requests
"""

import subprocess
import json
import sys
import os
import time
import uuid
from pathlib import Path
import urllib.request
import urllib.error

# ─── Config ───────────────────────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent
PDF_DIR = ROOT / "pdf-sources"  # pasta correta com PDFs descriptografados

SUPABASE_URL = "https://priumwdestycikzfcysg.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI"
GEMINI_API_KEY = "AIzaSyDjOsDyfBOv_m40UdjA8jBfd4slO0xPcIo"  # chave válida
GEMINI_MODEL = "gemini-embedding-001"
GEMINI_EMBED_BASE = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:embedContent?key={GEMINI_API_KEY}"

CHUNK_SIZE = 800
CHUNK_OVERLAP = 100
EMBED_BATCH_SIZE = 5   # menor batch para rate limit
EMBED_DELAY_S = 0.5   # delay entre embeddings
MIND = "cea"

# IMPORTANTE: schema 'knowledge' requer Content-Profile header no Supabase REST
SUPABASE_HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Content-Profile": "knowledge",
    "Accept-Profile": "knowledge",
    "Prefer": "return=minimal",
}

# ─── PDFs ─────────────────────────────────────────────────────────────────────
PDF_CONFIGS = [
    {"file": "parabolas.pdf",     "item_type": "parabola",   "title": "40 Parábolas de Jesus"},
    {"file": "personagens.pdf",   "item_type": "personagem", "title": "200 Personagens Bíblicos"},
    {"file": "panorama.pdf",      "item_type": "livro",      "title": "Panorama Bíblico (66 Livros)"},
    {"file": "quiz.pdf",          "item_type": "quiz",       "title": "250 Quiz Bíblico"},
    {"file": "plano_leitura.pdf", "item_type": "devocional", "title": "Plano de Leitura da Bíblia"},
    {"file": "milagres.pdf",      "item_type": "milagre",    "title": "35 Milagres de Jesus"},
]

# ─── Helpers ──────────────────────────────────────────────────────────────────

def extract_text(pdf_path: Path) -> str:
    """Extrai texto do PDF usando pdftotext com arquivo temporário."""
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as tmp:
        tmp_path = tmp.name
    try:
        result = subprocess.run(
            ["pdftotext", "-enc", "UTF-8", str(pdf_path), tmp_path],
            capture_output=True, timeout=180
        )
        if result.returncode != 0:
            raise ValueError(f"pdftotext erro: {result.stderr.decode()[:200]}")
        with open(tmp_path, "r", encoding="utf-8", errors="replace") as f:
            text = f.read()
    finally:
        try: os.unlink(tmp_path)
        except: pass
    if len(text.strip()) < 100:
        raise ValueError(f"Texto insuficiente: {len(text)} chars")
    return text


def create_chunks(text: str) -> list[dict]:
    """Divide texto em chunks com overlap."""
    import re
    cleaned = re.sub(r"\r\n", "\n", text)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    cleaned = re.sub(r"[ \t]{2,}", " ", cleaned)
    cleaned = cleaned.strip()

    # Limitar a 800k chars
    if len(cleaned) > 800_000:
        cleaned = cleaned[:800_000]

    chunks = []
    position = 0
    chunk_index = 0

    while position < len(cleaned):
        end = min(position + CHUNK_SIZE, len(cleaned))
        chunk_end = end

        if end < len(cleaned):
            para_break = cleaned.rfind("\n\n", position, end)
            if para_break > position + CHUNK_SIZE * 0.6:
                chunk_end = para_break + 2
            else:
                sent_break = cleaned.rfind(". ", position, end)
                if sent_break > position + CHUNK_SIZE * 0.5:
                    chunk_end = sent_break + 2

        content = cleaned[position:chunk_end].strip()
        if len(content) > 50:
            chunks.append({
                "content": content,
                "chunk_index": chunk_index,
                "page_estimate": (position // 3000) + 1,
                "char_start": position,
                "char_end": chunk_end,
            })
            chunk_index += 1

        next_position = chunk_end - CHUNK_OVERLAP
        # Garantir que SEMPRE avançamos (evita loop infinito no final do texto)
        if next_position <= position:
            position = chunk_end
        else:
            position = next_position

    return chunks


def generate_embedding(text: str) -> list[float]:
    """Gera embedding individual via gemini-embedding-001 com 768d."""
    payload = json.dumps({
        "content": {"parts": [{"text": text[:2048]}]},
        "taskType": "RETRIEVAL_DOCUMENT",
        "outputDimensionality": 768,  # 768d compatível com vector(768)
    }).encode("utf-8")
    req = urllib.request.Request(
        GEMINI_EMBED_BASE,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data["embedding"]["values"]


def supabase_post(path: str, payload: dict, extra_headers: dict = None) -> tuple[int, str]:
    """POST genérico para a API REST do Supabase."""
    headers = {**SUPABASE_HEADERS, **(extra_headers or {})}
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{SUPABASE_URL}{path}",
        data=body,
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")


def supabase_get(path: str) -> tuple[int, any]:
    """GET genérico para a API REST do Supabase."""
    req = urllib.request.Request(
        f"{SUPABASE_URL}{path}",
        headers={**SUPABASE_HEADERS, "Accept": "application/json"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, {}


# ─── Ingestão principal ───────────────────────────────────────────────────────

def ingest_pdf(config: dict, force_reingest: bool = False) -> bool:
    pdf_path = PDF_DIR / config["file"]
    item_type = config["item_type"]
    title = config["title"]

    print(f"\n{'─'*55}")
    print(f"  📄 {title}")
    print(f"     item_type: {item_type} | arquivo: {config['file']}")
    print(f"{'─'*55}")

    if not pdf_path.exists():
        print(f"  ❌ Arquivo não encontrado: {pdf_path}")
        return False

    # 1. Extrair texto
    print("  📖 Extraindo texto do PDF...", end="", flush=True)
    try:
        text = extract_text(pdf_path)
        print(f" {len(text):,} chars")
    except Exception as e:
        print(f"\n  ❌ Extração falhou: {e}")
        return False

    # 2. Chunking
    chunks = create_chunks(text)
    print(f"  ✂️  Chunks criados: {len(chunks)}")

    # 3. Criar documento (colunas: title, mind, item_type, source_path)
    status, resp = supabase_post(
        "/rest/v1/documents",
        {
            "title": title,
            "mind": MIND,
            "item_type": item_type,
            "source_path": config["file"],
        },
        extra_headers={"Prefer": "return=representation"},
    )

    if status not in (200, 201):
        print(f"  ❌ Falha ao criar documento ({status}): {resp[:200]}")
        return False

    docs = json.loads(resp)
    doc_id = docs[0]["id"] if docs else None
    if not doc_id:
        print("  ❌ Documento criado mas sem ID")
        return False
    print(f"  🗂️  Documento criado: {doc_id}")

    # 4. Embeddings + insert (um chunk por vez)
    total = len(chunks)
    print(f"  🧠 Gerando embeddings e salvando {total} chunks...")

    chunks_inserted = 0
    for i, chunk in enumerate(chunks):
        # Gerar embedding individual
        try:
            embedding = generate_embedding(chunk["content"])
        except Exception as e:
            print(f"\n  ⚠️  Chunk {i} embedding falhou: {e}")
            time.sleep(2)
            continue

        # Inserir chunk
        row = {
            "document_id": doc_id,
            "content": chunk["content"],
            "embedding": f"[{','.join(str(v) for v in embedding)}]",
            "metadata": {
                "mind": MIND,
                "item_type": item_type,
                "chunk_index": chunk["chunk_index"],
                "page_estimate": chunk["page_estimate"],
            },
        }
        status, resp = supabase_post("/rest/v1/chunks", row)
        if status in (200, 201):
            chunks_inserted += 1
        elif "duplicate" not in resp:
            sys.stdout.write(f"\n  ⚠️  Chunk {i}: {status} {resp[:80]}")

        # Progresso
        progress = (i + 1) / total * 100
        sys.stdout.write(f"\r  📊 {i+1}/{total} ({progress:.0f}%) — {chunks_inserted} salvos   ")
        sys.stdout.flush()
        time.sleep(EMBED_DELAY_S)

    print(f"\n  ✅ Concluído: {chunks_inserted}/{len(chunks)} chunks salvos")
    return True


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    filter_type = next((a for a in sys.argv[1:] if not a.startswith("-")), None)
    force = "--force" in sys.argv

    print("=" * 55)
    print("  CEA — Ingestão RAG Local (Python)")
    print("  Pipeline: PDF → Texto → Chunks → Gemini → Supabase")
    if force:
        print("  ⚠️  Modo FORCE ativado")
    print("=" * 55)

    configs = [c for c in PDF_CONFIGS if not filter_type or c["item_type"] == filter_type]

    if not configs:
        print(f"Nenhum PDF para item_type: {filter_type}")
        print(f"Tipos: {', '.join(c['item_type'] for c in PDF_CONFIGS)}")
        sys.exit(1)

    results = []
    for config in configs:
        success = ingest_pdf(config, force)
        results.append({**config, "success": success})

    print("\n" + "=" * 55)
    print("  RESUMO FINAL")
    print("=" * 55)
    for r in results:
        icon = "✅" if r["success"] else "❌"
        print(f"  {icon}  {r['item_type']:<12} {r['title']}")

    ok = sum(1 for r in results if r["success"])
    print(f"\n  {ok}/{len(results)} PDFs processados com sucesso")

    if ok == len(results):
        print("\n🎉 CEA Knowledge Base completa!")
        print("\nVerificação — execute no Supabase SQL Editor:")
        print("https://supabase.com/dashboard/project/priumwdestycikzfcysg/editor")
        print("""
SELECT metadata->>'item_type' AS item_type, COUNT(*) AS chunks
FROM knowledge.chunks
WHERE metadata->>'mind' = 'cea'
GROUP BY metadata->>'item_type'
ORDER BY item_type;""")


if __name__ == "__main__":
    main()
