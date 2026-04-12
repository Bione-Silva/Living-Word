// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';

const MAX_MESSAGES = 30;

export async function loadHistory(userId: string, agentId = 'palavra_amiga') {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('role, content, created_at')
    .eq('user_id', userId)
    .eq('agent_id', agentId)
    .order('created_at', { ascending: true })
    .limit(MAX_MESSAGES);

  if (error) {
    console.error('loadHistory error:', error);
    return [];
  }
  return (data || []).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
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
    return;
  }

  // Trim to MAX_MESSAGES: fetch ids beyond the limit and delete them
  const { data: excess } = await supabase
    .from('chat_messages')
    .select('id')
    .eq('user_id', userId)
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .range(MAX_MESSAGES, MAX_MESSAGES + 100);

  if (excess && excess.length > 0) {
    const ids = excess.map((r) => r.id);
    await (supabase as any).from('chat_messages').delete().in('id', ids);
  }
}
