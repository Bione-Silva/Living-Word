const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://priumwdestycikzfcysg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetPassword() {
  const email = 'bionicaosilva@gmail.com';
  const newPassword = 'PalavraViva2026!';
  
  console.log(`Buscando usuário: ${email}...`);
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Erro ao listar:', listError);
    return;
  }
  
  const user = usersData.users.find(u => u.email === email);
  
  if (!user) {
    console.log('Usuário não encontrado. Criando usuário com a nova senha...');
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: newPassword,
      email_confirm: true
    });
    
    if (createError) {
      console.error('Erro ao criar:', createError);
    } else {
      console.log('Usuário criado com sucesso!');
    }
    return;
  }
  
  console.log(`Usuário encontrado (ID: ${user.id}). Atualizando senha...`);
  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );
  
  if (error) {
    console.error('Erro ao atualizar:', error);
  } else {
    console.log('Senha atualizada com SUCESSO!');
  }
}

resetPassword();
