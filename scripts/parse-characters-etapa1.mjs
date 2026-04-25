#!/usr/bin/env node
/**
 * ETAPA 1 — Parsing e Normalização do personagens_cea_completo.md
 * Objetivo: Extrair, deduplicar e inventariar todos os personagens.
 * Saída: JSON auditável em scripts/output/characters_parsed.json
 * 
 * Uso: node scripts/parse-characters-etapa1.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUTPUT_DIR = join(__dirname, 'output');
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

const MD_PATH = join(ROOT, 'personagens_cea_completo.md');
const md = readFileSync(MD_PATH, 'utf8');

// ─── Personagens do NT que o markdown erroneamente marca como AT ──────────
const NT_CORRECTIONS = new Set([
  'Jesus', 'Maria', 'José (Pai de Jesus)', 'João Batista', 'Isabel',
  'Pedro', 'André', 'João (O Apóstolo)', 'Tiago', 'Filipe', 'Bartolomeu',
  'Mateus', 'Tomé', 'Simão Zelote', 'Judas', 'Judas Iscariotes', 'Matias',
  'Apóstolo Paulo', 'Barnabé', 'Silas', 'Timóteo', 'Tito', 'Lucas', 'Marcos',
  'Aquila e Priscila', 'Apólo', 'Filemom', 'Nicodemos', 'Zaqueu', 'Bartimeu',
  'Jairo', 'Lázaro de Betânia', 'Marta e Maria', 'Maria Madalena',
  'Mulher Samaritana', 'Jovem Rico', 'Herodes', 'Herodias', 'Salomé',
  'Pilatos', 'Caifás', 'Barrabás', 'José de Arimateia', 'Estevão',
  'Cornélio', 'Lídia', 'Dorcas', 'Ananias', 'Safira', 'Gamaliel',
  'Escribas', 'Sauduceus', 'Fariseu', 'Levi'
]);

// ─── Seção do markdown detectada pelo ## ──────────────────────────────────
function detectSection(text, charStartPos) {
  // Encontrar a última seção ## antes da posição do personagem
  const beforeText = text.substring(0, charStartPos);
  const sectionMatches = [...beforeText.matchAll(/^# (ANTIGO TESTAMENTO|NOVO TESTAMENTO)/gm)];
  if (sectionMatches.length === 0) return 'AT';
  const lastSection = sectionMatches[sectionMatches.length - 1][1];
  return lastSection === 'NOVO TESTAMENTO' ? 'NT' : 'AT';
}

// ─── Quebrar por ### ──────────────────────────────────────────────────────
const blocks = [];
const headerRegex = /^### (.+)$/gm;
let match;
const positions = [];

while ((match = headerRegex.exec(md)) !== null) {
  positions.push({ name: match[1].trim(), start: match.index, headerEnd: match.index + match[0].length });
}

for (let i = 0; i < positions.length; i++) {
  const pos = positions[i];
  const nextStart = i < positions.length - 1 ? positions[i + 1].start : md.length;
  const body = md.substring(pos.headerEnd, nextStart).trim();
  const sectionTestamento = detectSection(md, pos.start);
  blocks.push({ name: pos.name, body, sectionTestamento, lineStart: pos.start });
}

console.log(`📊 Total de blocos ### encontrados: ${blocks.length}`);

// ─── Extrair campos de cada bloco ─────────────────────────────────────────
function parseBlock(block) {
  const { name, body, sectionTestamento } = block;
  const result = {
    nome: name,
    fonte: 'md',
    campos_extraidos: [],
    campos_nulos: [],
  };

  // Extrair tabela markdown
  const tableRows = [...body.matchAll(/\|\s*\*\*(.+?)\*\*\s*\|\s*(.+?)\s*\|/g)];
  const tableData = {};
  for (const row of tableRows) {
    tableData[row[1].trim()] = row[2].trim();
  }

  // Período
  result.periodo_historico = tableData['Período'] || null;
  if (result.periodo_historico) result.campos_extraidos.push('periodo_historico');
  else result.campos_nulos.push('periodo_historico');

  // Testamento — corrigir erros do markdown
  const rawTestamento = tableData['Testamento'] || sectionTestamento;
  if (NT_CORRECTIONS.has(name)) {
    result.testamento = 'NT';
    result.testamento_corrigido = rawTestamento !== 'NT';
  } else {
    result.testamento = rawTestamento === 'NT' ? 'NT' : 'AT';
    result.testamento_corrigido = false;
  }
  result.campos_extraidos.push('testamento');

  // Cargo
  result.cargo_funcao = tableData['Cargo'] || 'Personagem Bíblico';
  result.campos_extraidos.push('cargo_funcao');

  // Tags
  const rawTags = tableData['Tags'] || '';
  result.temas = rawTags.split(',').map(t => t.trim()).filter(Boolean);
  if (result.temas.length > 0) result.campos_extraidos.push('temas');
  else result.campos_nulos.push('temas');

  // Resumo
  const resumoMatch = body.match(/\*\*Resumo \(card\):\*\*\s*(.+)/);
  result.resumo = resumoMatch ? resumoMatch[1].trim() : null;
  if (result.resumo) result.campos_extraidos.push('resumo');
  else result.campos_nulos.push('resumo');

  // Biografia
  const bioMatch = body.match(/\*\*Biografia completa \(do ebook\):\*\*\s*\n\n([\s\S]+?)(?=\n---|\n### |$)/);
  result.biografia = bioMatch ? bioMatch[1].trim() : null;
  if (result.biografia) {
    result.campos_extraidos.push('biografia');
    result.biografia_chars = result.biografia.length;
  } else {
    result.campos_nulos.push('biografia');
    result.biografia_chars = 0;
  }

  return result;
}

// ─── Parsear todos os blocos ──────────────────────────────────────────────
const parsed = blocks.map(b => parseBlock(b));
console.log(`✅ Blocos parseados: ${parsed.length}`);

// ─── Detectar duplicatas ──────────────────────────────────────────────────
const nameMap = new Map();
const duplicates = [];

for (const p of parsed) {
  const key = p.nome;
  if (nameMap.has(key)) {
    duplicates.push(key);
    const existing = nameMap.get(key);
    // Manter a entrada com biografia mais longa
    if (p.biografia_chars > existing.biografia_chars) {
      nameMap.set(key, p);
    }
  } else {
    nameMap.set(key, p);
  }
}

const uniqueEntries = [...nameMap.values()];
console.log(`🔄 Duplicatas detectadas: ${duplicates.length} (${[...new Set(duplicates)].join(', ')})`);
console.log(`📋 Entradas únicas finais: ${uniqueEntries.length}`);

// ─── Numerar sequencialmente ──────────────────────────────────────────────
uniqueEntries.forEach((entry, idx) => {
  entry.numero = idx + 1;
});

// ─── Inventário de testamento corrigido ───────────────────────────────────
const corrigidos = uniqueEntries.filter(e => e.testamento_corrigido);
console.log(`\n⚠️  Testamentos corrigidos AT→NT: ${corrigidos.length}`);
corrigidos.forEach(e => console.log(`   - ${e.nome}`));

// ─── Contagem AT vs NT ────────────────────────────────────────────────────
const atCount = uniqueEntries.filter(e => e.testamento === 'AT').length;
const ntCount = uniqueEntries.filter(e => e.testamento === 'NT').length;
console.log(`\n📊 Distribuição: AT=${atCount}, NT=${ntCount}`);

// ─── Campos nulos mais frequentes ─────────────────────────────────────────
const nullFieldCounts = {};
for (const entry of uniqueEntries) {
  for (const field of entry.campos_nulos) {
    nullFieldCounts[field] = (nullFieldCounts[field] || 0) + 1;
  }
}
console.log(`\n📊 Campos nulos por tipo:`);
for (const [field, count] of Object.entries(nullFieldCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`   ${field}: ${count}/${uniqueEntries.length}`);
}

// ─── Personagens sem biografia ────────────────────────────────────────────
const semBiografia = uniqueEntries.filter(e => !e.biografia);
if (semBiografia.length > 0) {
  console.log(`\n❌ Personagens SEM biografia: ${semBiografia.length}`);
  semBiografia.forEach(e => console.log(`   - ${e.nome}`));
}

// ─── Salvar resultado ─────────────────────────────────────────────────────
const output = {
  meta: {
    fonte: 'personagens_cea_completo.md',
    data_processamento: new Date().toISOString(),
    total_blocos_raw: blocks.length,
    total_duplicatas: duplicates.length,
    duplicatas_nomes: [...new Set(duplicates)],
    total_unicos: uniqueEntries.length,
    total_at: atCount,
    total_nt: ntCount,
    testamentos_corrigidos: corrigidos.map(e => e.nome),
    personagens_sem_biografia: semBiografia.map(e => e.nome),
    gap_para_200: 200 - uniqueEntries.length,
  },
  personagens: uniqueEntries.map(e => ({
    numero: e.numero,
    nome: e.nome,
    testamento: e.testamento,
    testamento_corrigido: e.testamento_corrigido,
    periodo_historico: e.periodo_historico,
    cargo_funcao: e.cargo_funcao,
    temas: e.temas,
    resumo: e.resumo,
    biografia: e.biografia,
    biografia_chars: e.biografia_chars,
    campos_extraidos: e.campos_extraidos,
    campos_nulos: e.campos_nulos,
    fonte: 'md',
    status_validacao: e.biografia ? 'base_extraida' : 'pendente_biografia',
  })),
};

const outPath = join(OUTPUT_DIR, 'characters_parsed.json');
writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');
console.log(`\n💾 Salvo em: ${outPath}`);
console.log(`\n✅ ETAPA 1 CONCLUÍDA`);
console.log(`   → ${uniqueEntries.length} personagens únicos extraídos`);
console.log(`   → ${200 - uniqueEntries.length} faltantes para completar os 200 do ebook`);
console.log(`   → Próximo passo: ETAPA 2 (fechar lista dos 200)`);
