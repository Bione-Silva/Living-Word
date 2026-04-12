import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  console.log("Iniciando Reconciliação Histórica de Créditos (Living Word)...")
  
  // Obter o primeiro dia do mês atual
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
  
  // 1. Buscar todos os perfis
  console.log("Buscando perfis...")
  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select('id, full_name, generations_used, generations_limit')
    
  if (profileErr) {
    console.error("Erro ao buscar perfis:", profileErr)
    return
  }
  
  console.log(`Encontrados ${profiles.length} perfis. Analisando logs do mês atual (desde ${firstDayOfMonth})...`)
  
  let totalFixes = 0
  
  for (const profile of profiles) {
    // 2. Contar NO MÊS ATUAL os registros em generation_logs
    const { count, error: countErr } = await supabase
      .from('generation_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .gte('created_at', firstDayOfMonth)
      
    if (countErr) {
      console.error(`Erro ao contar logs para ${profile.id}:`, countErr)
      continue
    }
    
    // Fallbacks
    const actualCount = count || 0
    const currentRecorded = profile.generations_used || 0
    const limit = profile.generations_limit || 5
    
    // Limitar ao máximo do plano
    const cappedCount = Math.min(actualCount, limit)
    
    // 3. Fazer UPDATE se houver divergência
    if (currentRecorded !== cappedCount) {
      console.log(`[CORRECAO] ${profile.full_name || profile.id}: generations_used de ${currentRecorded} -> ${cappedCount} (Logs reais: ${actualCount})`)
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ generations_used: cappedCount })
        .eq('id', profile.id)
        
      if (updateErr) {
        console.error(`Falha ao atualizar ${profile.id}:`, updateErr)
      } else {
        totalFixes++
      }
    } else {
      // console.log(`[OK] ${profile.full_name || profile.id}: ${currentRecorded} uso real - não necessita ajuste.`)
    }
  }
  
  console.log(`\n✅ Reconciliação concluída! Foram ajustados ${totalFixes} perfis.`)
}

run()
