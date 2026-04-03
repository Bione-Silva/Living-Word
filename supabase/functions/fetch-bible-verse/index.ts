/**
 * Living Word — fetch-bible-verse
 * 
 * Busca o texto bíblico oficial na API correta para a versão selecionada.
 * Função interna (chamada pelas funções de geração), pode ser testada via POST.
 * 
 * Roteamento por versão:
 *   PT: ARA (wldeh), ACF (wldeh), NVI-PT (fallback → modelo)
 *   EN: NIV (API.Bible), ESV (ESV API), NLT (API.Bible), KJV (API.Bible)
 *   ES: RVR60 (ApiBiblia), NVI-ES (ApiBiblia), DHH (API.Bible)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors, jsonResponse, errorResponse } from "../common/utils.ts"

// ============================================================
// Types
// ============================================================
export type BibleVersion = 
  "ARA" | "ACF" | "NVI-PT" | 
  "NIV" | "ESV" | "NLT" | "KJV" | 
  "RVR60" | "NVI-ES" | "DHH"

export interface VerseResult {
  text: string
  source: string
  version: BibleVersion
  is_official: boolean
}

// ============================================================
// Book Name → Code Mapping (PT/EN/ES)
// ============================================================
const BOOK_MAP: Record<string, string> = {
  // Antigo Testamento (PT)
  "gênesis": "GEN", "genesis": "GEN", "êxodo": "EXO", "exodo": "EXO",
  "levítico": "LEV", "levitico": "LEV", "números": "NUM", "numeros": "NUM",
  "deuteronômio": "DEU", "deuteronomio": "DEU",
  "josué": "JOS", "josue": "JOS", "juízes": "JDG", "juizes": "JDG",
  "rute": "RUT", "ruth": "RUT",
  "1 samuel": "1SA", "2 samuel": "2SA",
  "1 reis": "1KI", "2 reis": "2KI", "1 kings": "1KI", "2 kings": "2KI",
  "1 crônicas": "1CH", "1 cronicas": "1CH", "2 crônicas": "2CH", "2 cronicas": "2CH",
  "esdras": "EZR", "neemias": "NEH", "ester": "EST", "esther": "EST",
  "jó": "JOB", "jo": "JOB", "job": "JOB",
  "salmos": "PSA", "salmo": "PSA", "psalms": "PSA", "psalm": "PSA",
  "provérbios": "PRO", "proverbios": "PRO", "proverbs": "PRO",
  "eclesiastes": "ECC", "cantares": "SNG", "cânticos": "SNG",
  "isaías": "ISA", "isaias": "ISA", "isaiah": "ISA",
  "jeremias": "JER", "jeremiah": "JER",
  "lamentações": "LAM", "lamentacoes": "LAM",
  "ezequiel": "EZK", "ezekiel": "EZK",
  "daniel": "DAN", "oséias": "HOS", "oseias": "HOS", "hosea": "HOS",
  "joel": "JOL", "amós": "AMO", "amos": "AMO",
  "obadias": "OBA", "jonas": "JON", "jonah": "JON",
  "miquéias": "MIC", "miqueias": "MIC", "micah": "MIC",
  "naum": "NAM", "nahum": "NAM",
  "habacuque": "HAB", "habakkuk": "HAB",
  "sofonias": "ZEP", "zephaniah": "ZEP",
  "ageu": "HAG", "haggai": "HAG",
  "zacarias": "ZEC", "zechariah": "ZEC",
  "malaquias": "MAL", "malachi": "MAL",
  // Novo Testamento (PT/EN)
  "mateus": "MAT", "matthew": "MAT",
  "marcos": "MRK", "mark": "MRK",
  "lucas": "LUK", "luke": "LUK",
  "joão": "JHN", "joao": "JHN", "john": "JHN",
  "atos": "ACT", "acts": "ACT",
  "romanos": "ROM", "romans": "ROM",
  "1 coríntios": "1CO", "1 corintios": "1CO", "1 corinthians": "1CO",
  "2 coríntios": "2CO", "2 corintios": "2CO", "2 corinthians": "2CO",
  "gálatas": "GAL", "galatas": "GAL", "galatians": "GAL",
  "efésios": "EPH", "efesios": "EPH", "ephesians": "EPH",
  "filipenses": "PHP", "philippians": "PHP",
  "colossenses": "COL", "colossians": "COL",
  "1 tessalonicenses": "1TH", "1 thessalonians": "1TH",
  "2 tessalonicenses": "2TH", "2 thessalonians": "2TH",
  "1 timóteo": "1TI", "1 timoteo": "1TI", "1 timothy": "1TI",
  "2 timóteo": "2TI", "2 timoteo": "2TI", "2 timothy": "2TI",
  "tito": "TIT", "titus": "TIT",
  "filemom": "PHM", "philemon": "PHM",
  "hebreus": "HEB", "hebrews": "HEB",
  "tiago": "JAS", "james": "JAS",
  "1 pedro": "1PE", "1 peter": "1PE",
  "2 pedro": "2PE", "2 peter": "2PE",
  "1 joão": "1JN", "1 joao": "1JN", "1 john": "1JN",
  "2 joão": "2JN", "2 joao": "2JN", "2 john": "2JN",
  "3 joão": "3JN", "3 joao": "3JN", "3 john": "3JN",
  "judas": "JUD", "jude": "JUD",
  "apocalipse": "REV", "revelation": "REV",
  // ES
  "génesis": "GEN", "éxodo": "EXO",
  "mateo": "MAT", "marcos": "MRK", "juan": "JHN",
  "hechos": "ACT", "romanos": "ROM",
  "gálatas": "GAL", "efesios": "EPH",
  "filipenses": "PHP", "colosenses": "COL",
  "hebreos": "HEB", "santiago": "JAS",
  "apocalipsis": "REV",
}

function parsePassage(passage: string): { bookCode: string; ref: string } | null {
  const lower = passage.toLowerCase().trim()
  
  // Ordena por tamanho (mais longo primeiro) para evitar match parcial
  const sorted = Object.entries(BOOK_MAP).sort((a, b) => b[0].length - a[0].length)
  
  for (const [book, code] of sorted) {
    if (lower.startsWith(book)) {
      const ref = passage.slice(book.length).trim()
      return { bookCode: code, ref }
    }
  }
  return null
}

// ============================================================
// API Fetchers
// ============================================================

async function fetchFromWldeh(passage: string, lang: "pt_AA" | "pt_ACF"): Promise<string | null> {
  try {
    const parsed = parsePassage(passage)
    if (!parsed) return null
    
    // Extrair capítulo e versículos
    const chapterMatch = parsed.ref.match(/^(\d+):?(.*)$/)
    if (!chapterMatch) return null
    
    const chapter = chapterMatch[1]
    const versesStr = chapterMatch[2]
    
    // Para API wldeh a URL é diferente por verso
    // Buscamos o capítulo inteiro e filtramos
    const bookLower = parsed.bookCode.toLowerCase()
    const bookNameMap: Record<string, string> = {
      "GEN": "genesis", "EXO": "exodus", "LEV": "leviticus",
      "PSA": "psalms", "PRO": "proverbs", "ISA": "isaiah",
      "JER": "jeremiah", "MAT": "matthew", "MRK": "mark",
      "LUK": "luke", "JHN": "john", "ACT": "acts",
      "ROM": "romans", "1CO": "1corinthians", "2CO": "2corinthians",
      "GAL": "galatians", "EPH": "ephesians", "PHP": "philippians",
      "COL": "colossians", "HEB": "hebrews", "JAS": "james",
      "REV": "revelation",
    }
    
    const bookSlug = bookNameMap[parsed.bookCode] ?? bookLower
    const url = `https://cdn.jsdelivr.net/gh/wldeh/bible-api@main/bibles/${lang}/books/${bookSlug}/chapters/${chapter}.json`
    
    const res = await fetch(url)
    if (!res.ok) return null
    
    const data = await res.json()
    
    // Se há versículos especificados, filtrar
    if (versesStr && data.verses) {
      const [startVerse, endVerse] = versesStr.split("-").map(Number)
      const filtered = data.verses
        .filter((v: { verse: number }) => 
          v.verse >= startVerse && v.verse <= (endVerse || startVerse)
        )
        .map((v: { verse: number; text: string }) => `${v.verse} ${v.text}`)
        .join(" ")
      return filtered || null
    }
    
    // Retornar capítulo inteiro
    if (data.text) return data.text
    if (data.verses) {
      return data.verses.map((v: { verse: number; text: string }) => `${v.verse} ${v.text}`).join(" ")
    }
    return null
  } catch {
    return null
  }
}

async function fetchFromESV(passage: string): Promise<string | null> {
  try {
    const key = Deno.env.get("ESV_API_KEY")
    if (!key) return null
    
    const encoded = encodeURIComponent(passage)
    const res = await fetch(
      `https://api.esv.org/v3/passage/text/?q=${encoded}&include-headings=false&include-footnotes=false&include-verse-numbers=true`,
      { headers: { "Authorization": `Token ${key}` } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.passages?.[0] ?? null
  } catch {
    return null
  }
}

async function fetchFromApiBible(passage: string, bibleId: string): Promise<string | null> {
  try {
    const key = Deno.env.get("APIBIBLE_KEY")
    if (!key) return null
    
    const parsed = parsePassage(passage)
    if (!parsed) return null
    
    // API.Bible requer formato: BOK.chapter.verse
    const [chapter, verses] = parsed.ref.split(":")
    const passageId = verses 
      ? `${parsed.bookCode}.${chapter}.${verses.split("-")[0]}-${parsed.bookCode}.${chapter}.${verses.split("-")[1] || verses.split("-")[0]}`
      : `${parsed.bookCode}.${chapter}`
    
    const res = await fetch(
      `https://api.scripture.api.bible/v1/bibles/${bibleId}/passages/${passageId}?content-type=text`,
      { headers: { "api-key": key } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.data?.content ?? null
  } catch {
    return null
  }
}

async function fetchFromApiBiblia(passage: string, version: "rvr60" | "nvi"): Promise<string | null> {
  try {
    const key = Deno.env.get("APIBIBLIA_KEY")
    if (!key) return null
    
    const encoded = encodeURIComponent(passage)
    const res = await fetch(
      `https://api.apibiblia.com/v1/passage?ref=${encoded}&version=${version}`,
      { headers: { "X-API-Key": key } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.text ?? null
  } catch {
    return null
  }
}

// ============================================================
// Função Principal de Busca
// ============================================================
export async function fetchBibleVerse(
  passage: string,
  version: BibleVersion,
  _language: string
): Promise<VerseResult | null> {
  let text: string | null = null
  let source = version as string
  let is_official = true

  switch (version) {
    case "ARA":
      text = await fetchFromWldeh(passage, "pt_AA")
      break
    case "ACF":
      text = await fetchFromWldeh(passage, "pt_ACF")
      break
    case "NVI-PT":
      // Sem API pública legal — marcação especial
      is_official = false
      source = "NVI-PT (estilo — sem licença comercial ativa)"
      return { text: "", source, version, is_official }
    case "ESV":
      text = await fetchFromESV(passage)
      break
    case "NIV":
      text = await fetchFromApiBible(passage, "de4e12af7f28f599-01")
      break
    case "KJV":
      text = await fetchFromApiBible(passage, "de4e12af7f28f599-02")
      break
    case "NLT":
      text = await fetchFromApiBible(passage, "65eec8e0b60e656b-01")
      break
    case "RVR60":
      text = await fetchFromApiBiblia(passage, "rvr60")
      break
    case "NVI-ES":
      text = await fetchFromApiBiblia(passage, "nvi")
      break
    case "DHH":
      text = await fetchFromApiBible(passage, "b32b9d1b64b4ef29-01")
      break
    default:
      is_official = false
      break
  }

  if (!text) return null
  return { text, source, version, is_official }
}

// ============================================================
// HTTP Handler (para testes diretos)
// ============================================================
serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse
  
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 })

  const { passage, version, language } = await req.json()
  if (!passage || !version) {
    return new Response(JSON.stringify({ error: "passage and version required" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    })
  }

  const result = await fetchBibleVerse(passage, version as BibleVersion, language ?? "PT")
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  })
})
