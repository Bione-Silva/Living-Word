/**
 * ============================================
 * ETAPA 5B — Parser das 40 Parábolas
 * Palavra Viva | CEA — Centro de Estudos Avançados
 * ============================================
 *
 * Lê: scripts/output/parabolas_raw.md (extraído do PDF)
 * Gera: scripts/output/parables_parsed.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_PATH = resolve(__dirname, 'output', 'parabolas_raw.md');
const OUT_PATH = resolve(__dirname, 'output', 'parables_parsed.json');

const raw = readFileSync(RAW_PATH, 'utf8');

// --- Remover marcas de licença ---
const cleaned = raw.replace(/Licensed to.*?HP\w+\n?/g, '');

// --- Índice das 40 parábolas (do sumário do PDF) ---
const INDEX = [];
const indexRegex = /^(\d+)\s*-\s*(.+?)\s*—\s*(.+)$/gm;
let m;
while ((m = indexRegex.exec(cleaned)) !== null) {
  const num = parseInt(m[1]);
  const titulo = m[2].trim();
  const ref = m[3].trim();

  // Detectar evangelho
  let evangelho = 'Lucas';
  if (ref.startsWith('Mateus')) evangelho = 'Mateus';
  else if (ref.startsWith('Marcos')) evangelho = 'Marcos';
  else if (ref.startsWith('João')) evangelho = 'João';

  INDEX.push({ numero: num, titulo, referencia: ref, evangelho });
}

console.log(`📋 Índice detectado: ${INDEX.length} parábolas\n`);

// --- Localizar cada parábola no texto e extrair conteúdo ---
// O padrão é: o título aparece como heading, seguido de seções com conteúdo
// Títulos das parábolas no corpo aparecem como linhas isoladas (ex: "O bom samaritano")

function findParableContent(titulo, nextTitulo) {
  // Buscar a primeira ocorrência do título como heading (fora do índice)
  // O índice está nas primeiras ~50 linhas, então buscamos depois
  const lines = cleaned.split('\n');
  let startIdx = -1;
  let endIdx = lines.length;

  // Buscar título no corpo (após linha 50)
  const tituloLower = titulo.toLowerCase();
  for (let i = 50; i < lines.length; i++) {
    const lineLower = lines[i].trim().toLowerCase();
    if (lineLower === tituloLower || lineLower === `o ${tituloLower}` || lineLower === `a ${tituloLower}` || lineLower === `as ${tituloLower}` || lineLower === `os ${tituloLower}`) {
      startIdx = i;
      break;
    }
  }

  if (startIdx === -1) {
    // Tentar busca mais flexível
    for (let i = 50; i < lines.length; i++) {
      if (lines[i].trim().toLowerCase().includes(tituloLower) && lines[i].trim().length < titulo.length + 20) {
        startIdx = i;
        break;
      }
    }
  }

  if (startIdx === -1) {
    return null;
  }

  // Buscar fim (próximo título ou fim do arquivo)
  if (nextTitulo) {
    const nextLower = nextTitulo.toLowerCase();
    for (let i = startIdx + 5; i < lines.length; i++) {
      const lineLower = lines[i].trim().toLowerCase();
      if (lineLower === nextLower || lineLower === `o ${nextLower}` || lineLower === `a ${nextLower}` || lineLower === `as ${nextLower}` || lineLower === `os ${nextLower}`) {
        endIdx = i;
        break;
      }
      // Busca flexível
      if (lineLower.includes(nextLower) && lines[i].trim().length < nextTitulo.length + 20) {
        endIdx = i;
        break;
      }
    }
  }

  const content = lines.slice(startIdx + 1, endIdx)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return content;
}

// --- Extrair seções de cada parábola ---
function extractSections(text) {
  if (!text) return {};

  const sections = {};

  // Padrões comuns no PDF:
  const sectionPatterns = [
    { key: 'contexto_epoca', regex: /(?:qual (?:é )?o contexto|contexto da época|contexto histórico)([\s\S]*?)(?=(?:qual |conexão|tensões|mensagem|a parábola|lições|aplicação|como aplicar|\n[A-Z][a-záéíóú]+ (?:é )?[a-z]))/i },
    { key: 'tensoes_culturais', regex: /(?:tensões? entre|tensões? culturais?)([\s\S]*?)(?=(?:qual |conexão|mensagem|a parábola|lições|aplicação|como aplicar))/i },
    { key: 'conexao_at', regex: /(?:conexão com o antigo testamento|conexão.*antigo testamento|AT\b)([\s\S]*?)(?=(?:qual |tensões|mensagem|a parábola|lições|aplicação|como aplicar))/i },
    { key: 'mensagem_central', regex: /(?:mensagem central|qual (?:é )?a mensagem)([\s\S]*?)(?=(?:qual |conexão|tensões|lições|aplicação|como aplicar))/i },
    { key: 'aplicacao_moderna', regex: /(?:como aplicar|aplicação (?:moderna|prática|para hoje)|para os dias de hoje)([\s\S]*?)$/i },
  ];

  for (const { key, regex } of sectionPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      sections[key] = match[1].trim().substring(0, 3000);
    }
  }

  return sections;
}

// --- Extrair temas de cada texto ---
function extractThemes(text) {
  const themeKeywords = {
    'perdão': /perd[ãa]o|perdoar/i,
    'graça': /graça|graci/i,
    'misericórdia': /misericórd/i,
    'amor': /amor|amar/i,
    'fé': /\bfé\b|\bcrê\b|crer|cren/i,
    'arrependimento': /arrependimento|arrepend/i,
    'juízo': /ju[ií]zo|julgamento|condenação/i,
    'reino': /reino (?:de|dos) (?:Deus|céus?)/i,
    'oração': /oração|orar/i,
    'humildade': /humild/i,
    'obediência': /obediên|obedecer/i,
    'compaixão': /compaix|compadecer/i,
    'mordomia': /mordomia|administr|talen/i,
    'vigilância': /vigilância|vigilante|vigiar|preparad/i,
    'generosidade': /generosid|generoso/i,
    'perseverança': /perseveran|persist/i,
    'transformação': /transform/i,
    'sabedoria': /sabedori|sábi/i,
  };

  const found = [];
  for (const [theme, regex] of Object.entries(themeKeywords)) {
    if (regex.test(text)) found.push(theme);
  }
  return found.length > 0 ? found.slice(0, 6) : ['ensino'];
}

// --- Processar ---
const parables = [];
let found = 0;
let notFound = 0;

for (let i = 0; i < INDEX.length; i++) {
  const entry = INDEX[i];
  const nextTitle = i < INDEX.length - 1 ? INDEX[i + 1].titulo : null;

  const content = findParableContent(entry.titulo, nextTitle);
  const sections = content ? extractSections(content) : {};
  const temas = content ? extractThemes(content) : entry.temas || ['ensino'];

  const parable = {
    numero: entry.numero,
    titulo: entry.titulo,
    referencia: entry.referencia,
    evangelho: entry.evangelho,
    contexto_epoca: sections.contexto_epoca || null,
    tensoes_culturais: sections.tensoes_culturais || null,
    conexao_at: sections.conexao_at || null,
    mensagem_central: sections.mensagem_central || null,
    aplicacao_moderna: sections.aplicacao_moderna || null,
    temas,
    conteudo_completo: content ? content.substring(0, 8000) : null,
    conteudo_chars: content ? content.length : 0,
  };

  if (content) {
    found++;
    console.log(`  ✅ #${entry.numero} ${entry.titulo} — ${content.length} chars — temas: [${temas.join(', ')}]`);
  } else {
    notFound++;
    console.log(`  ⚠️  #${entry.numero} ${entry.titulo} — conteúdo não localizado`);
  }

  parables.push(parable);
}

// --- Salvar ---
const output = {
  _meta: {
    gerado_em: new Date().toISOString(),
    fonte: 'parabolas.pdf (Thiago Jeremias)',
    total: parables.length,
    com_conteudo: found,
    sem_conteudo: notFound,
  },
  parabolas: parables,
};

writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), 'utf8');

console.log(`\n${'='.repeat(55)}`);
console.log('  ETAPA 5B — RELATÓRIO PARÁBOLAS');
console.log('='.repeat(55));
console.log(`  Total: ${parables.length}`);
console.log(`  Com conteúdo: ${found}`);
console.log(`  Sem conteúdo: ${notFound}`);
console.log('='.repeat(55));
console.log(`\n💾 Salvo em: ${OUT_PATH}`);
console.log('✅ PARSER DE PARÁBOLAS CONCLUÍDO\n');
