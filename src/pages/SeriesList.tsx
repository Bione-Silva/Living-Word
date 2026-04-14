// @ts-nocheck
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BookOpen, Plus, ExternalLink, Loader2, Sparkles, Calendar, Users, Lock, Crown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCredits } from '@/hooks/useCredits';

type L = 'PT' | 'EN' | 'ES';

const i18n = {
  title:         { PT: 'Séries de Sermões', EN: 'Sermon Series', ES: 'Series de Sermones' },
  subtitle:      { PT: 'Planeje séries de múltiplas semanas orientadas por temas e por livros bíblicos.', EN: 'Plan multi-week series guided by themes and biblical books.', ES: 'Planifica series de varias semanas guiadas por temas y libros bíblicos.' },
  myCalendars:   { PT: 'Meus Calendários', EN: 'My Calendars', ES: 'Mis Calendarios' },
  create:        { PT: '+ Criar série', EN: '+ Create series', ES: '+ Crear serie' },
  empty:         { PT: 'Nenhuma série criada ainda.', EN: 'No series created yet.', ES: 'Ninguna serie creada aún.' },
  open:          { PT: 'Abrir', EN: 'Open', ES: 'Abrir' },
  weeks:         { PT: 'semanas', EN: 'weeks', ES: 'semanas' },
  featured:      { PT: 'Calendários Prontos', EN: 'Ready-made Calendars', ES: 'Calendarios Listos' },
  featuredDesc:  { PT: 'Roteiros prontos para uso imediato.', EN: 'Ready-to-use series guides.', ES: 'Guías de series listas para usar.' },
  modalTitle:    { PT: 'Criar nova série', EN: 'Create new series', ES: 'Crear nueva serie' },
  themeLabel:    { PT: 'Tema geral da série *', EN: 'Series theme *', ES: 'Tema de la serie *' },
  themePh:       { PT: 'Ex: Dons do Espírito Santo, Família Cristã...', EN: 'E.g.: Spiritual Gifts, Christian Family...', ES: 'Ej: Dones del Espíritu, Familia Cristiana...' },
  focusLabel:    { PT: 'Foco específico (opcional)', EN: 'Specific focus (optional)', ES: 'Enfoque específico (opcional)' },
  focusPh:       { PT: 'Ex: aplicação prática, contexto urbano, jovens adultos...', EN: 'E.g.: practical application, urban context...', ES: 'Ej: aplicación práctica, contexto urbano...' },
  audienceLabel: { PT: 'Público-alvo', EN: 'Target audience', ES: 'Público objetivo' },
  audiencePh:    { PT: 'Ex: Jovens, Casais, Líderes...', EN: 'E.g.: Youth, Couples, Leaders...', ES: 'Ej: Jóvenes, Parejas, Líderes...' },
  weeksLabel:    { PT: 'Número de semanas', EN: 'Number of weeks', ES: 'Número de semanas' },
  generating:    { PT: 'Gerando série...', EN: 'Generating series...', ES: 'Generando serie...' },
  generate:      { PT: 'Gerar série (30 créditos)', EN: 'Generate series (30 credits)', ES: 'Generar serie (30 créditos)' },
  credits:       { PT: 'créditos', EN: 'credits', ES: 'créditos' },
  proRequired:   { PT: 'Recurso disponível no plano Pastoral ou superior.', EN: 'Feature available on the Pastoral plan or higher.', ES: 'Función disponible en el plan Pastoral o superior.' },
};

const FEATURED_SERIES = [
  {
    key: 'expository_2026',
    color: '#2c7a3a',
    title: { PT: 'Calendário de Sermões Expositivos de 2026', EN: 'Expository Sermon Calendar 2026', ES: 'Calendario de Sermones Expositivos 2026' },
    desc: {
      PT: 'Um roteiro de 52 semanas através de livros e passagens bíblicas, incluindo Jeremias, Lucas, Salmos, Hebreus e muito mais.',
      EN: 'A 52-week journey through biblical books including Jeremiah, Luke, Psalms, Hebrews and more.',
      ES: 'Un recorrido de 52 semanas por libros bíblicos incluyendo Jeremías, Lucas, Salmos, Hebreos y más.',
    },
    weeks: 52,
  },
  {
    key: 'thematic_2026',
    color: '#8a2020',
    title: { PT: 'Calendário de Sermões Temáticos de 2026', EN: 'Thematic Sermon Calendar 2026', ES: 'Calendario de Sermones Temáticos 2026' },
    desc: {
      PT: 'Um roteiro de 52 semanas abordando temas como restauração, fé, perdão, a igreja e o Espírito Santo.',
      EN: 'A 52-week roadmap covering themes like restoration, faith, forgiveness, the church and the Holy Spirit.',
      ES: 'Una hoja de ruta de 52 semanas que cubre temas como restauración, fe, perdón, la iglesia y el Espíritu Santo.',
    },
    weeks: 52,
  },
  {
    key: 'youth_2026',
    color: '#b8860b',
    title: { PT: 'Calendário de Sermões para Jovens de 2026', EN: 'Youth Sermon Calendar 2026', ES: 'Calendario de Sermones para Jóvenes 2026' },
    desc: {
      PT: 'Plano de ação para jovens em 52 semanas, elaborado para equipar e inspirar os jovens com a verdade bíblica.',
      EN: '52-week action plan for youth, designed to equip and inspire young people with biblical truth.',
      ES: 'Plan de acción de 52 semanas para jóvenes, diseñado para equipar e inspirar con la verdad bíblica.',
    },
    weeks: 52,
  },
  {
    key: 'kids_2026',
    color: '#7a4f00',
    title: { PT: 'Calendário de Aulas Infantis de 2026', EN: "Children's Class Calendar 2026", ES: 'Calendario de Clases Infantiles 2026' },
    desc: {
      PT: 'Este roteiro de 52 semanas leva as crianças numa jornada pela Bíblia para aprenderem o que realmente significa seguir Jesus.',
      EN: 'This 52-week journey takes children through the Bible to learn what it truly means to follow Jesus.',
      ES: 'Este recorrido de 52 semanas lleva a los niños por la Biblia para aprender lo que verdaderamente significa seguir a Jesús.',
    },
    weeks: 52,
  },
];

interface SeriesWeek { week_number: number; title: string; overview: string; texts: string[]; topics: string[]; }
interface SeriesData { title: string; overview: string; weeks: SeriesWeek[]; }

interface Material {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function SeriesList() {
  const { user, profile } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState('');
  const [focus, setFocus] = useState('');
  const [audience, setAudience] = useState('');
  const [weeks, setWeeks] = useState('4');
  const [generating, setGenerating] = useState(false);

  const t = useCallback((key: keyof typeof i18n) => i18n[key][lang as L] || i18n[key].PT, [lang]);

  const isFree = profile?.plan === 'free';

  const { data: mySeries = [], refetch } = useQuery({
    queryKey: ['series-list', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('materials')
        .select('id, title, content, created_at')
        .eq('user_id', user.id)
        .eq('type', 'series_calendar')
        .order('created_at', { ascending: false });
      return (data || []) as Material[];
    },
    enabled: !!user,
  });

  const handleGenerate = async () => {
    if (!theme.trim()) { toast.error('Informe o tema da série'); return; }
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-series`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ theme, focus, audience, weeks: parseInt(weeks), language: lang }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.error === 'insufficient_credits') {
          toast.error(`Créditos insuficientes. Restam: ${json.remaining}`);
        } else {
          toast.error(json.error || 'Erro ao gerar série');
        }
        return;
      }
      toast.success('Série gerada com sucesso!');
      setOpen(false);
      setTheme(''); setFocus(''); setAudience('');
      await refetch();
      if (json.materialId) navigate(`/series/${json.materialId}`);
    } catch (err) {
      toast.error('Erro de conexão');
    } finally {
      setGenerating(false);
    }
  };

  const getWeeksCount = (content: string) => {
    try {
      const parsed: SeriesData = JSON.parse(content);
      return parsed.weeks?.length ?? 0;
    } catch { return 0; }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-7 w-7 text-primary" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-lg">{t('subtitle')}</p>
        </div>
        <Button
          onClick={() => isFree ? toast.error(t('proRequired')) : setOpen(true)}
          className="gap-2 shrink-0"
        >
          {isFree ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {t('create')}
          {isFree && <Badge variant="secondary" className="text-[9px] ml-1">Pro</Badge>}
        </Button>
      </div>

      {/* My Calendars */}
      <section>
        <h2 className="text-lg font-semibold mb-3">{t('myCalendars')}</h2>
        {mySeries.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t('empty')}</p>
            {!isFree && (
              <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => setOpen(true)}>
                <Sparkles className="h-3.5 w-3.5" /> {t('create')}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mySeries.map((s) => (
              <Card
                key={s.id}
                className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-shadow"
                onClick={() => navigate(`/series/${s.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {getWeeksCount(s.content)} {t('weeks')}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-sm leading-snug mt-2">{s.title}</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-3 gap-1.5 text-xs text-primary p-0 h-auto hover:bg-transparent"
                    onClick={(e) => { e.stopPropagation(); navigate(`/series/${s.id}`); }}
                  >
                    <ExternalLink className="h-3 w-3" /> {t('open')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Featured */}
      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold">{t('featured')}</h2>
          <p className="text-xs text-muted-foreground">{t('featuredDesc')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURED_SERIES.map((s) => (
            <Card key={s.key} className="overflow-hidden border-border/60">
              <div className="h-1.5" style={{ backgroundColor: s.color }} />
              <CardContent className="p-4">
                <div className="w-8 h-8 rounded-md flex items-center justify-center mb-3" style={{ backgroundColor: `${s.color}22` }}>
                  <BookOpen className="h-4 w-4" style={{ color: s.color }} />
                </div>
                <h3 className="font-semibold text-sm leading-snug mb-1.5">{s.title[lang as L] || s.title.PT}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                  {s.desc[lang as L] || s.desc.PT}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-3 gap-1.5 text-xs p-0 h-auto"
                  style={{ color: s.color }}
                  onClick={() => isFree ? toast.error(t('proRequired')) : toast.info('Em breve disponível')}
                >
                  <ExternalLink className="h-3 w-3" /> {t('open')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Create Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t('modalTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-sm">{t('themeLabel')}</Label>
              <Input
                placeholder={t('themePh')}
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t('focusLabel')}</Label>
              <Textarea
                placeholder={t('focusPh')}
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">{t('audienceLabel')}</Label>
                <Input
                  placeholder={t('audiencePh')}
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">{t('weeksLabel')}</Label>
                <Select value={weeks} onValueChange={setWeeks}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['3', '4', '5', '6', '7', '8'].map((w) => (
                      <SelectItem key={w} value={w}>{w} {t('weeks')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t pt-3">
              <span className="flex items-center gap-1"><Crown className="h-3 w-3 text-amber-500" /> 30 {t('credits')}</span>
              <span>{profile?.credits_remaining ?? 0} restantes</span>
            </div>
            <Button
              className="w-full gap-2"
              disabled={!theme.trim() || generating}
              onClick={handleGenerate}
            >
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t('generating')}</>
              ) : (
                <><Sparkles className="h-4 w-4" /> {t('generate')}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
