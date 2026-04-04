import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { minds } from '@/data/minds';
import { Brain, ToggleLeft, ToggleRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface MindSetting {
  mind_id: string;
  active: boolean;
  updated_at?: string;
}

interface InactiveAlert {
  count: number;
  minds: { id: string; since: string }[];
  checked_at: string;
}

export function MindToggleSection() {
  const [settings, setSettings] = useState<MindSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [inactiveAlert, setInactiveAlert] = useState<InactiveAlert | null>(null);
  const [checkingInactive, setCheckingInactive] = useState(false);

  useEffect(() => {
    loadSettings();
    loadAlert();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase
      .from('mind_settings')
      .select('mind_id, active, updated_at');
    if (data) setSettings(data as MindSetting[]);
    setLoading(false);
  };

  const loadAlert = async () => {
    const { data } = await supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'inactive_minds_alert')
      .maybeSingle();
    if (data?.value) {
      try {
        const parsed = JSON.parse(data.value as string) as InactiveAlert;
        if (parsed.count > 0) setInactiveAlert(parsed);
      } catch { /* ignore */ }
    }
  };

  const checkInactiveMinds = async () => {
    setCheckingInactive(true);
    try {
      const { error } = await supabase.functions.invoke('check-inactive-minds');
      if (error) throw error;
      await loadAlert();
      toast.success('Verificação concluída');
    } catch {
      toast.error('Erro ao verificar mentes inativas');
    }
    setCheckingInactive(false);
  };

  const toggleMind = async (mindId: string, currentActive: boolean) => {
    setToggling(mindId);
    const { error } = await supabase
      .from('mind_settings')
      .update({ active: !currentActive, updated_at: new Date().toISOString() })
      .eq('mind_id', mindId);

    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      setSettings(prev =>
        prev.map(s => s.mind_id === mindId ? { ...s, active: !currentActive } : s)
      );
      toast.success(`${mindId} ${!currentActive ? 'ativada' : 'desativada'}`);
    }
    setToggling(null);
  };

  const isActive = (mindId: string) => {
    const s = settings.find(s => s.mind_id === mindId);
    return s?.active ?? true;
  };

  if (loading) {
    return <div className="admin-card rounded-xl p-6 text-center admin-muted">Carregando mentes...</div>;
  }

  return (
    <div className="admin-card rounded-xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
          <Brain className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold admin-text">Controle de Mentes</h2>
          <p className="text-xs admin-muted">Ative ou desative mentes visíveis na plataforma</p>
        </div>
      </div>

      <div className="space-y-2">
        {minds.map(mind => {
          const active = isActive(mind.id);
          const isToggling = toggling === mind.id;

          return (
            <div
              key={mind.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                active
                  ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20'
                  : 'border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-950/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={mind.image}
                  alt={mind.name}
                  className={`w-10 h-10 rounded-full object-cover border-2 ${
                    active ? 'border-emerald-300' : 'border-red-300 opacity-50'
                  }`}
                />
                <div>
                  <p className={`text-sm font-semibold admin-text ${!active ? 'opacity-50' : ''}`}>
                    {mind.flag} {mind.name}
                  </p>
                  <p className="text-[11px] admin-muted">
                    {active ? '✅ Visível para usuários' : '🚫 Oculta da plataforma'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => toggleMind(mind.id, active)}
                disabled={isToggling}
                className={`transition-colors ${isToggling ? 'opacity-50' : 'hover:opacity-80'}`}
                title={active ? 'Desativar mente' : 'Ativar mente'}
              >
                {active ? (
                  <ToggleRight className="h-8 w-8 text-emerald-500" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-red-400" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
