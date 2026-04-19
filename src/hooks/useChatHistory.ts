import { supabase } from '@/integrations/supabase/client';

/**
 * Histórico de chat para os agentes (Palavra Amiga, etc.).
 *
 * Estratégia:
 * - Mantemos uma JANELA DE MEMÓRIA de 30 dias.
 * - Carregamos no máximo MAX_RECENT mensagens recentes (suficiente p/ contexto)
 *   para não estourar a janela do modelo nem a UI.
 * - Mensagens mais antigas que 30 dias são purgadas em background.
 * - clearHistory() remove todas as mensagens daquele usuário+agente
 *   (botão "Novo Chat").
 */

const MEMORY_DAYS = 30;
const MAX_RECENT = 60;

function cutoffISO(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

export async function loadHistory(userId: string, agentId = 'palavra_amiga') {
  const cutoff = cutoffISO(MEMORY_DAYS);

  // Pega as N mensagens mais recentes dentro da janela de 30 dias.
  const { data, error } = await supabase
    .from('chat_messages')
    .select('role, content, created_at')
    .eq('user_id', userId)
    .eq('agent_id', agentId)
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false })
    .limit(MAX_RECENT);

  if (error) {
    console.error('loadHistory error:', error);
    return [];
  }

  // Purga em background mensagens fora da janela (não bloqueia a UI).
  void purgeOldMessages(userId, agentId);

  // Devolve em ordem cronológica (antiga -> nova).
  return (data || [])
    .slice()
    .reverse()
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
}

export async function saveMessage(
  userId: string,
  agentId: string,
  role: 'user' | 'assistant',
  content: string,
) {
  const { error } = await supabase
    .from('chat_messages')
    .insert({ user_id: userId, agent_id: agentId, role, content });

  if (error) {
    console.error('saveMessage insert error:', error);
  }
}

/**
 * Apaga TODO o histórico do usuário com aquele agente.
 * Usado pelo botão "Novo Chat".
 */
export async function clearHistory(userId: string, agentId = 'palavra_amiga') {
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('user_id', userId)
    .eq('agent_id', agentId);

  if (error) {
    console.error('clearHistory error:', error);
    throw error;
  }
}

/** Remove silenciosamente mensagens com mais de 30 dias. */
async function purgeOldMessages(userId: string, agentId: string) {
  const cutoff = cutoffISO(MEMORY_DAYS);
  await supabase
    .from('chat_messages')
    .delete()
    .eq('user_id', userId)
    .eq('agent_id', agentId)
    .lt('created_at', cutoff);
}
