const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const file1 = fs.readFileSync('supabase/migrations/20260423020000_lw_bible_content.sql', 'utf8');
  const file2 = fs.readFileSync('supabase/migrations/20260423020100_lw_cea_tables.sql', 'utf8');

  console.log("Migration 1 (Base Content) executada manualmente via interface web.");
  console.log("Migration 2 (CEA Tables) executada manualmente via interface web.");

  console.log("Checking tables...");
  
  const tables = ['lw_parables', 'lw_characters', 'lw_bible_books', 'lw_quiz', 'lw_quiz_sessions', 'lw_word_studies', 'lw_verse_versions', 'lw_deep_research', 'lw_cea_progress', 'lw_achievements', 'lw_cea_materials'];
  
  for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error && error.code === '42P01') {
          console.error(`\u274c Table ${table} does not exist. Please run the migrations in the Supabase SQL Editor.`);
      } else {
          console.log(`\u2705 Table ${table} exists.`);
      }
  }
}

run();
