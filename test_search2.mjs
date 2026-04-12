import { createClient } from '@supabase/supabase-js';

const url = "https://priumwdestycikzfcysg.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI";

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.rpc('search_biblical_content', {
    query_text: "samaritano",
    limit_count: 5
  });
  console.log(data);
}

test();
