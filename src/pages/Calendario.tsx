import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Sparkles, Plus, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { CalendarGrid, type CalendarItem } from '@/components/calendario/CalendarGrid';
import { ContentPreviewPanel } from '@/components/calendario/ContentPreviewPanel';
import { NetworkFilterBar, type NetworkKey, type FilterKey, NETWORK_META } from '@/components/calendario/NetworkFilterBar';
import { NewPostDialog } from '@/components/calendario/NewPostDialog';
import { GenerateWithAIDialog } from '@/components/calendario/GenerateWithAIDialog';

type L = 'PT' | 'EN' | 'ES';

const MONTHS: Record<L, string[]> = {
  PT: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  EN: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ES: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
};

const COPY = {
  title: { PT: 'Calendário de Conteúdo', EN: 'Content Calendar', ES: 'Calendario de Contenido' },
  subtitle: { PT: 'Organize, agende e publique em todas as redes', EN: 'Organize, schedule and publish across all networks', ES: 'Organiza, programa y publica en todas las redes' },
  generateAI: { PT: 'Gerar com IA', EN: 'Generate with AI', ES: 'Generar con IA' },
  newPost: { PT: 'Novo post', EN: 'New post', ES: 'Nuevo post' },
  today: { PT: 'Hoje', EN: 'Today', ES: 'Hoy' },
  filter: { PT: 'Filtrar', EN: 'Filter', ES: 'Filtrar' },
  emptyDay: { PT: 'Selecione um dia para ver os detalhes', EN: 'Select a day to see details', ES: 'Selecciona un día para ver detalles' },
  deleted: { PT: 'Item removido', EN: 'Item removed', ES: 'Elemento eliminado' },
} satisfies Record<string, Record<L, string>>;

export default function Calendario() {
  const { user } = useAuth();
  const { lang: cur } = useLanguage();
  const lang = (cur || 'PT') as L;
  const t = (k: keyof typeof COPY) => COPY[k][lang];
  const qc = useQueryClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [activeNetworks, setActiveNetworks] = useState<Set<NetworkKey | 'editorial'>>(
    new Set(['instagram', 'facebook', 'x', 'linkedin', 'tiktok', 'youtube', 'editorial']),
  );
  const [showNewPost, setShowNewPost] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Social calendar posts
  const { data: socialPosts = [] } = useQuery({
    queryKey: ['social-calendar', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('social_calendar_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Editorial queue (sermões/artigos/devocionais agendados)
  const { data: editorialItems = [] } = useQuery({
    queryKey: ['editorial-queue-cal', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('editorial_queue')
        .select('id, scheduled_at, status, material_id, materials(title, type, passage)')
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Unifica em CalendarItem[]
  const items: CalendarItem[] = useMemo(() => {
    const a: CalendarItem[] = socialPosts
      .filter((p) => activeNetworks.has(p.network as NetworkKey))
      .map((p) => ({
        id: p.id,
        kind: 'social',
        network: p.network as NetworkKey,
        title: p.caption?.split('\n')[0]?.slice(0, 60) || '—',
        caption: p.caption || '',
        hashtags: p.hashtags || '',
        image_url: p.image_url || null,
        scheduled_at: p.scheduled_at,
        status: p.status,
      }));

    const b: CalendarItem[] = activeNetworks.has('editorial')
      ? editorialItems
          .filter((e: any) => e.scheduled_at)
          .map((e: any) => ({
            id: e.id,
            kind: 'editorial',
            network: null,
            title: e.materials?.title || '—',
            caption: e.materials?.passage || '',
            hashtags: '',
            image_url: null,
            scheduled_at: e.scheduled_at,
            status: e.status,
            editorial_type: e.materials?.type,
          }))
      : [];

    return [...a, ...b];
  }, [socialPosts, editorialItems, activeNetworks]);

  const deleteItem = useMutation({
    mutationFn: async (item: CalendarItem) => {
      const table = item.kind === 'social' ? 'social_calendar_posts' : 'editorial_queue';
      const { error } = await supabase.from(table).delete().eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['social-calendar'] });
      qc.invalidateQueries({ queryKey: ['editorial-queue-cal'] });
      setSelectedItem(null);
      toast.success(t('deleted'));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleNetwork = (key: NetworkKey | 'editorial') => {
    const next = new Set(activeNetworks);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setActiveNetworks(next);
  };

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {t('title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('subtitle')}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowNewPost(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            {t('newPost')}
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAI(true)}
            className="gap-1.5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
          >
            <Sparkles className="h-4 w-4" />
            {t('generateAI')}
          </Button>
        </div>
      </div>

      {/* Network filters */}
      <NetworkFilterBar active={activeNetworks} onToggle={toggleNetwork} lang={lang} />

      {/* Main: Calendar + Side panel */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5">
        {/* Calendar card */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                {MONTHS[lang][month]} <span className="text-muted-foreground font-normal">{year}</span>
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              {t('today')}
            </Button>
          </div>

          <CalendarGrid
            year={year}
            month={month}
            items={items}
            selectedId={selectedItem?.id ?? null}
            onSelect={setSelectedItem}
            lang={lang}
          />
        </div>

        {/* Side preview panel */}
        <ContentPreviewPanel
          item={selectedItem}
          lang={lang}
          onDelete={(it) => deleteItem.mutate(it)}
          emptyText={t('emptyDay')}
        />
      </div>

      <NewPostDialog open={showNewPost} onOpenChange={setShowNewPost} lang={lang} />
      <GenerateWithAIDialog open={showAI} onOpenChange={setShowAI} lang={lang} />
    </div>
  );
}
