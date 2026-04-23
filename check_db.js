import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checando registros...");
  const tables = ['lw_parables', 'lw_characters', 'lw_bible_books', 'lw_quiz'];
  
  for (const table of tables) {
      const { data, count, error } = await supabase.from(table).select('id', { count: 'exact', head: true });
      if (error) {
          console.error(`Erro na tabela ${table}:`, error.message);
      } else {
          console.log(`Tabela ${table}: ${count} registros encontrados.`);
      }
  }
}
run();
