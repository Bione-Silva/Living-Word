/**
 * ingest_mined_data.mjs
 * Converte JSONs minerados em SQL de seed para o Supabase.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT_DIR = path.join(__dirname, 'base_biblica');
const OUTPUT_SQL = path.join(__dirname, 'seed_mined_data.sql');

const LIBRARIES = {
  parabolas: { id: 'ff111111-e5f6-4a7b-8c9d-111111111111', title: '40 Parábolas de Jesus', category: 'parabolas' },
  personagens: { id: 'ff222222-e5f6-4a7b-8c9d-222222222222', title: '200 Personagens Bíblicos', category: 'personagens' },
  milagres: { id: 'ff333333-e5f6-4a7b-8c9d-333333333333', title: '35 Milagres de Jesus', category: 'milagres' },
  quiz: { id: 'ff444444-e5f6-4a7b-8c9d-444444444444', title: '250 Quizzes Bíblicos', category: 'quiz' },
  panorama: { id: 'ff555555-e5f6-4a7b-8c9d-555555555555', title: 'Panorama Bíblico', category: 'panorama' }
};

function escapeSQL(str) {
  if (!str) return 'NULL';
  if (typeof str === 'object') str = JSON.stringify(str);
  return `'${str.toString().replace(/'/g, "''")}'`;
}

async function generateSQL() {
  let sql = `-- AUTO-GENERATED SEED FILE BIBLE DATA\n\n`;

  sql += `INSERT INTO content_library (id, title, category, license_type) VALUES\n`;
  const libValues = Object.values(LIBRARIES).map(l => `('${l.id}', '${l.title}', '${l.category}', 'public_domain')`);
  sql += libValues.join(',\n') + `\nON CONFLICT (id) DO NOTHING;\n\n`;

  const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.json'));
  
  for (const file of files) {
    const key = file.replace('.json', '');
    const lib = LIBRARIES[key];
    if (!lib) continue;

    const raw = fs.readFileSync(path.join(INPUT_DIR, file), 'utf8');
    const parsed = JSON.parse(raw);
    const data = parsed.items ? parsed.items : parsed; // Support new and old format
    if (!data || data.length === 0) continue;

    console.log(`🚀 Gerando SQL para ${file} (${data.length} itens)...`);

    sql += `INSERT INTO content_sections (library_id, title, category, reference, summary, theological_message, content, metadata)\nVALUES\n`;

    const rows = data.map(item => {
      const title = item.title || item.question || 'Sem Título';
      const reference = item.reference || '';
      const summary = item.summary || item.answer || '';
      const message = item.theological_message || '';
      const content = item.content || '';
      const metadata = JSON.stringify({ period: item.period, difficulty: item.difficulty, historical_context: item.historical_context, practical_application: item.practical_application });
      
      return `(
        '${lib.id}',
        ${escapeSQL(title)},
        '${lib.category}',
        ${escapeSQL(reference)},
        ${escapeSQL(summary)},
        ${escapeSQL(message)},
        ${escapeSQL(content)},
        ${escapeSQL(metadata)}
      )`;
    });

    sql += rows.join(',\n') + ';\n\n';
  }

  fs.writeFileSync(OUTPUT_SQL, sql);
  console.log(`✅ SQL Master gerado com sucesso em ${OUTPUT_SQL}`);
}

generateSQL().catch(console.error);
