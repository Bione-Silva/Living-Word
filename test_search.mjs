import { createClient } from '@supabase/supabase-js';

const url = "https://priumwdestycikzfcysg.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI";

const supabase = createClient(url, key);

async function test() {
  console.log("🔍 Testando busca full-text no Supabase...");
  const { data, error } = await supabase.rpc('search_biblical_content', {
    query_text: "qual parábola fala sobre amar e ajudar as pessoas que precisam na estrada",
    limit_count: 3
  });

  if (error) {
    console.error("❌ Erro:", error);
  } else {
    console.log("✅ Resultados Encontrados:");
    data.forEach(d => console.log(`- [${d.category.toUpperCase()}] ${d.title} (Score: ${d.rank.toFixed(2)})`));
  }
}

test();
