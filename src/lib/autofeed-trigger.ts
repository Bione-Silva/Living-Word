import { supabase } from '@/integrations/supabase/client';

/**
 * Fire-and-forget: dispara o AutoFeed para um sermão recém-criado.
 * Faz a checagem de plano + opt-in no servidor; aqui só invoca.
 * Nunca bloqueia o fluxo principal — erros são silenciosos (logados no console).
 */
export async function triggerAutoFeed(materialId: string, materialType: string) {
  // Só dispara para sermões/aulas/devocionais
  if (!/sermon|outline|devotional/i.test(materialType)) return;
  try {
    await supabase.functions.invoke('autofeed-from-material', {
      body: { material_id: materialId },
    });
  } catch (e) {
    console.warn('[autofeed] trigger failed (non-blocking):', e);
  }
}
