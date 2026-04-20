import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { NETWORK_META, type NetworkKey } from './NetworkFilterBar';

type L = 'PT' | 'EN' | 'ES';

const COPY = {
  title: { PT: 'Gerar calendário com IA', EN: 'Generate calendar with AI', ES: 'Generar calendario con IA' },
  subtitle: {
    PT: 'Descreva o tema da semana e escolha as redes. A IA vai sugerir um plano de posts.',
    EN: 'Describe the weekly theme and choose networks. AI will suggest a post plan.',
    ES: 'Describe el tema de la semana y elige las redes. La IA sugerirá un plan.',
  },
  theme: { PT: 'Tema / objetivo da semana', EN: 'Theme / weekly goal', ES: 'Tema / objetivo de la semana' },
  themePh: {
    PT: 'Ex: série sobre fé em tempos de prova, com versículo, reflexão curta e convite ao culto',
    EN: 'E.g. faith in trials series, with verse, short reflection and Sunday invite',
    ES: 'Ej: serie sobre la fe en tiempos de prueba, con versículo y reflexión',
  },
  networks: { PT: 'Redes para gerar', EN: 'Networks to generate', ES: 'Redes a generar' },
  startDate: { PT: 'Começar em', EN: 'Starting on', ES: 'Comenzar el' },
  postsPerNetwork: {
    PT: 'Posts por rede',
    EN: 'Posts per network',
    ES: 'Posts por red',
  },
  cancel: { PT: 'Cancelar', EN: 'Cancel', ES: 'Cancelar' },
  generate: { PT: 'Gerar calendário', EN: 'Generate calendar', ES: 'Generar calendario' },
  generating: { PT: 'Gerando…', EN: 'Generating…', ES: 'Generando…' },
  done: {
    PT: 'Calendário gerado! Posts agendados como rascunho.',
    EN: 'Calendar generated! Posts saved as drafts.',
    ES: '¡Calendario generado! Posts guardados como borradores.',
  },
  fillTheme: { PT: 'Descreva um tema', EN: 'Describe a theme', ES: 'Describe un tema' },
  pickNetwork: { PT: 'Escolha ao menos uma rede', EN: 'Pick at least one network', ES: 'Elige al menos una red' },
} satisfies Record<string, Record<L, string>>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lang: L;
}

const NETWORK_KEYS: NetworkKey[] = ['instagram', 'facebook', 'x', 'linkedin', 'tiktok', 'youtube'];

export function GenerateWithAIDialog({ open, onOpenChange, lang }: Props) {
  const t = (k: keyof typeof COPY) => COPY[k][lang];
  const { user } = useAuth();
  const qc = useQueryClient();

  const [theme, setTheme] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [postsPerNetwork, setPostsPerNetwork] = useState(3);
  const [selected, setSelected] = useState<Set<NetworkKey>>(new Set(['instagram']));
  const [loading, setLoading] = useState(false);

  const toggle = (k: NetworkKey) => {
    const next = new Set(selected);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setSelected(next);
  };

  // Local mock generator: cria N posts por rede usando o tema, distribuindo nos próximos dias.
  // (Sem chamar edge function por enquanto — placeholder honesto; usuário pode editar depois.)
  const generate = async () => {
    if (!user) return;
    if (!theme.trim()) return toast.error(t('fillTheme'));
    if (selected.size === 0) return toast.error(t('pickNetwork'));

    setLoading(true);
    try {
      const start = new Date(`${startDate}T09:00:00`);
      const rows: any[] = [];
      let dayOffset = 0;
      for (const network of selected) {
        for (let i = 0; i < postsPerNetwork; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + dayOffset);
          dayOffset++;
          rows.push({
            user_id: user.id,
            network,
            caption: `${theme}\n\n— Rascunho ${i + 1} para ${NETWORK_META[network].label}. Edite com seu toque pastoral.`,
            hashtags:
              lang === 'PT'
                ? '#fé #esperança #palavradodia'
                : lang === 'EN'
                  ? '#faith #hope #wordoftheday'
                  : '#fe #esperanza #palabradeldia',
            scheduled_at: d.toISOString(),
            status: 'draft',
          });
        }
      }

      const { error } = await supabase.from('social_calendar_posts').insert(rows);
      if (error) throw error;

      qc.invalidateQueries({ queryKey: ['social-calendar'] });
      toast.success(t('done'));
      setTheme('');
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('title')}
          </DialogTitle>
          <p className="text-sm text-muted-foreground pt-1">{t('subtitle')}</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide">{t('theme')}</Label>
            <Textarea
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder={t('themePh')}
              rows={3}
            />
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide mb-2 block">
              {t('networks')}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {NETWORK_KEYS.map((k) => {
                const m = NETWORK_META[k];
                const Icon = m.icon;
                const isOn = selected.has(k);
                return (
                  <button
                    type="button"
                    key={k}
                    onClick={() => toggle(k)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                      isOn
                        ? `${m.bg} ${m.color} border-transparent ring-1 ${m.ring}`
                        : 'bg-card text-foreground border-border hover:border-foreground/30'
                    }`}
                  >
                    <Checkbox checked={isOn} className="pointer-events-none" />
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">{t('startDate')}</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                {t('postsPerNetwork')}
              </Label>
              <Input
                type="number"
                min={1}
                max={7}
                value={postsPerNetwork}
                onChange={(e) => setPostsPerNetwork(Math.max(1, Math.min(7, Number(e.target.value) || 1)))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {t('cancel')}
          </Button>
          <Button onClick={generate} disabled={loading} className="gap-1.5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? t('generating') : t('generate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
