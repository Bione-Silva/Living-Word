import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Faltam chaves do Supabase no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkUser(email) {
  console.log(`Verificando usuário: ${email}...`)
  
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  
  if (error) {
    console.error('Erro ao listar usuários:', error.message)
    return
  }

  const user = users.find(u => u.email === email)
  
  if (user) {
    console.log('✅ Usuário encontrado!')
    console.log('ID:', user.id)
    console.log('Confirmado em:', user.email_confirmed_at)
    console.log('Último login:', user.last_sign_in_at)
  } else {
    console.log('❌ Usuário NÃO encontrado no projeto Supabase atual.')
    console.log('Usuários disponíveis no projeto:', users.map(u => u.email))
  }
}

const targetEmail = 'bionicaosilva@gmail.com'
checkUser(targetEmail)
