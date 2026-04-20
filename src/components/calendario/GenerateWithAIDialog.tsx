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
import { NETWORK_META, type NetworkKey, type FilterKey } from './NetworkFilterBar';

type L = 'PT' | 'EN' | 'ES';

const COPY = {
  title: { PT: 'Gerar calendário com IA', EN: 'Generate calendar with AI', ES: 'Generar calendario con IA' },
  subtitle: {
    PT: 'Descreva o tema da semana e escolha os canais. A IA vai sugerir um plano de posts, sermões e artigos.',
    EN: 'Describe the weekly theme and choose channels. AI will suggest posts, sermons and articles.',
    ES: 'Describe el tema de la semana y elige los canales. La IA sugerirá publicaciones, sermones y artículos.',
  },
  theme: { PT: 'Tema / objetivo da semana', EN: 'Theme / weekly goal', ES: 'Tema / objetivo de la semana' },
  themePh: {
    PT: 'Ex: série sobre fé em tempos de prova, com versículo, reflexão curta e convite ao culto',
    EN: 'E.g. faith in trials series, with verse, short reflection and Sunday invite',
    ES: 'Ej: serie sobre la fe en tiempos de prueba, con versículo y reflexión',
  },
  socialNetworks: { PT: 'Redes sociais', EN: 'Social networks', ES: 'Redes sociales' },
  pastoralContent: { PT: 'Conteúdo pastoral', EN: 'Pastoral content', ES: 'Contenido pastoral' },
  startDate: { PT: 'Começar em', EN: 'Starting on', ES: 'Comenzar el' },
  postsPerNetwork: {
    PT: 'Posts por canal',
    EN: 'Posts per channel',
    ES: 'Posts por canal',
  },
  cancel: { PT: 'Cancelar', EN: 'Cancel', ES: 'Cancelar' },
  generate: { PT: 'Gerar calendário', EN: 'Generate calendar', ES: 'Generar calendario' },
  generating: { PT: 'Gerando…', EN: 'Generating…', ES: 'Generando…' },
  done: {
    PT: 'Calendário gerado! Itens agendados como rascunho.',
    EN: 'Calendar generated! Items saved as drafts.',
    ES: '¡Calendario generado! Elementos guardados como borradores.',
  },
  fillTheme: { PT: 'Descreva um tema', EN: 'Describe a theme', ES: 'Describe un tema' },
  pickAny: {
    PT: 'Escolha ao menos um canal',
    EN: 'Pick at least one channel',
    ES: 'Elige al menos un canal',
  },
  sermon: { PT: 'Sermão', EN: 'Sermon', ES: 'Sermón' },
  blog: { PT: 'Artigo de blog', EN: 'Blog article', ES: 'Artículo de blog' },
} satisfies Record<string, Record<L, string>>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lang: L;
}

const NETWORK_KEYS: NetworkKey[] = ['instagram', 'facebook', 'x', 'linkedin', 'tiktok', 'youtube'];
type EditorialKey = 'sermon' | 'blog';
const EDITORIAL_KEYS: EditorialKey[] = ['sermon', 'blog'];

export function GenerateWithAIDialog({ open, onOpenChange, lang }: Props) {
  const t = (k: keyof typeof COPY) => COPY[k][lang];
  const { user } = useAuth();
  const qc = useQueryClient();

  const [theme, setTheme] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [postsPerNetwork, setPostsPerNetwork] = useState(3);
  const [selected, setSelected] = useState<Set<FilterKey>>(new Set(['instagram', 'sermon', 'blog']));
  const [loading, setLoading] = useState(false);

  const toggle = (k: FilterKey) => {
    const next = new Set(selected);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setSelected(next);
  };

  const pastoralLabel = (k: EditorialKey) => (k === 'sermon' ? t('sermon') : t('blog'));

  // Gera rascunhos: posts sociais em social_calendar_posts; sermões/artigos em materials + editorial_queue.
  const generate = async () => {
    if (!user) return;
    if (!theme.trim()) return toast.error(t('fillTheme'));
    if (selected.size === 0) return toast.error(t('pickAny'));

    setLoading(true);
    try {
      const start = new Date(`${startDate}T09:00:00`);
      let dayOffset = 0;

      // 1) Posts sociais
      const socialRows: any[] = [];
      const selectedNetworks = NETWORK_KEYS.filter((k) => selected.has(k));
      for (const network of selectedNetworks) {
        for (let i = 0; i < postsPerNetwork; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + dayOffset);
          dayOffset++;
          socialRows.push({
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
      if (socialRows.length > 0) {
        const { error } = await supabase.from('social_calendar_posts').insert(socialRows);
        if (error) throw error;
      }

      // 2) Conteúdo pastoral (sermão / blog) — cria materials e agenda em editorial_queue
      const editorialSelected = EDITORIAL_KEYS.filter((k) => selected.has(k));
      for (const kind of editorialSelected) {
        for (let i = 0; i < postsPerNetwork; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + dayOffset);
          dayOffset++;

          const isSermon = kind === 'sermon';
          const materialType = isSermon ? 'sermon' : 'blog_article';
          const titlePrefix = pastoralLabel(kind);

          const { data: material, error: matErr } = await supabase
            .from('materials')
            .insert({
              user_id: user.id,
              type: materialType,
              title: `${titlePrefix} ${i + 1}: ${theme.slice(0, 60)}`,
              content: `# ${titlePrefix}\n\n${theme}\n\n_Rascunho gerado pelo calendário. Edite e expanda com seu toque pastoral._`,
              language: lang.toLowerCase(),
            })
            .select('id')
            .single();
          if (matErr) throw matErr;

          const { error: queueErr } = await supabase.from('editorial_queue').insert({
            user_id: user.id,
            material_id: material.id,
            scheduled_at: d.toISOString(),
            status: 'scheduled',
          });
          if (queueErr) throw queueErr;
        }
      }

      qc.invalidateQueries({ queryKey: ['social-calendar'] });
      qc.invalidateQueries({ queryKey: ['editorial-queue-cal'] });
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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

          {/* Redes sociais */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide mb-2 block">
              {t('socialNetworks')}
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

          {/* Conteúdo pastoral */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide mb-2 block">
              {t('pastoralContent')}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {EDITORIAL_KEYS.map((k) => {
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
                    <span className="font-medium">{pastoralLabel(k)}</span>
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
