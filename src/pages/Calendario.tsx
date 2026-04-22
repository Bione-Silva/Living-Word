import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Sparkles, CalendarDays, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import { CalendarGrid, type CalendarItem } from '@/components/calendario/CalendarGrid';
import { ContentPreviewPanel } from '@/components/calendario/ContentPreviewPanel';
import { NetworkFilterBar, type NetworkKey, type FilterKey } from '@/components/calendario/NetworkFilterBar';
import { GenerateWithAIDialog } from '@/components/calendario/GenerateWithAIDialog';
import { KanbanBoard } from '@/components/calendario/KanbanBoard';
import { AutoFeedTeaser } from '@/components/calendario/AutoFeedTeaser';
import { normalizePlan } from '@/lib/plan-normalization';
import { hasAccess } from '@/lib/plans';

type L = 'PT' | 'EN' | 'ES';
type ViewMode = 'month' | 'kanban';

const MONTHS: Record<L, string[]> = {
  PT: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  EN: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ES: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
};

const COPY = {
  title: { PT: 'Calendário de Conteúdo', EN: 'Content Calendar', ES: 'Calendario de Contenido' },
  subtitle: { PT: 'Organize, agende e publique em todas as redes', EN: 'Organize, schedule and publish across all networks', ES: 'Organiza, programa y publica en todas las redes' },
  generateAI: { PT: 'Gerar com IA', EN: 'Generate with AI', ES: 'Generar con IA' },
  today: { PT: 'Hoje', EN: 'Today', ES: 'Hoy' },
  emptyDay: { PT: 'Selecione um item para ver os detalhes', EN: 'Select an item to see details', ES: 'Selecciona un elemento para ver detalles' },
  deleted: { PT: 'Item removido', EN: 'Item removed', ES: 'Elemento eliminado' },
  month: { PT: 'Mês', EN: 'Month', ES: 'Mes' },
  kanban: { PT: 'Kanban', EN: 'Kanban', ES: 'Kanban' },
} satisfies Record<string, Record<L, string>>;

export default function Calendario() {
  const { user, profile } = useAuth();
  const { lang: cur } = useLanguage();
  const lang = (cur || 'PT') as L;
  const t = (k: keyof typeof COPY) => COPY[k][lang];
  const qc = useQueryClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [activeNetworks, setActiveNetworks] = useState<Set<FilterKey>>(
    new Set(['instagram', 'facebook', 'x', 'linkedin', 'tiktok', 'youtube', 'sermon', 'blog']),
  );
  const [showAI, setShowAI] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const userPlan = normalizePlan(profile?.plan);
  const canUseAutoFeed = hasAccess(userPlan, 'autofeed');
  const autoFeedActive = canUseAutoFeed && (profile as any)?.autofeed_enabled === true;
  const showTeaser = !autoFeedActive;

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

  const items: CalendarItem[] = useMemo(() => {
    const a: CalendarItem[] = socialPosts
      .filter((p: any) => activeNetworks.has(p.network as NetworkKey))
      .map((p: any) => ({
        id: p.id,
        kind: 'social',
        network: p.network as NetworkKey,
        title: p.caption?.split('\n')[0]?.slice(0, 60) || p.topic?.slice(0, 60) || '—',
        caption: p.caption || '',
        hashtags: p.hashtags || '',
        image_url: p.image_url || null,
        scheduled_at: p.scheduled_at,
        status: p.status,
        auto_generated: p.auto_generated === true,
        slides_data: p.slides_data || null,
        slide_count: p.slide_count || 1,
        topic: p.topic || null,
        canvas_template: p.canvas_template || null,
        theme_config: p.theme_config || null,
      }));

    const isSermonType = (type?: string) => !!type && /sermon|pastoral|sermao|sermão/i.test(type);

    const b: CalendarItem[] = editorialItems
      .filter((e: any) => {
        if (!e.scheduled_at && viewMode === 'month') return false;
        const isSermon = isSermonType(e.materials?.type);
        return isSermon ? activeNetworks.has('sermon') : activeNetworks.has('blog');
      })
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
      }));

    return [...a, ...b];
  }, [socialPosts, editorialItems, activeNetworks, viewMode]);

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

  const toggleNetwork = (key: FilterKey) => {
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
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('subtitle')}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View mode switch */}
          <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
            <button
              onClick={() => setViewMode('month')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
                viewMode === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              {t('month')}
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
                viewMode === 'kanban' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              {t('kanban')}
            </button>
          </div>

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

      {/* AutoFeed teaser */}
      {showTeaser && <AutoFeedTeaser lang={lang} canEnable={canUseAutoFeed} />}

      {/* Network filters */}
      <NetworkFilterBar active={activeNetworks} onToggle={toggleNetwork} lang={lang} />

      {/* Main */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5">
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {viewMode === 'month' ? (
            <>
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
            </>
          ) : (
            <KanbanBoard
              items={items}
              selectedId={selectedItem?.id ?? null}
              onSelect={setSelectedItem}
              lang={lang}
            />
          )}
        </div>

        <ContentPreviewPanel
          item={selectedItem}
          lang={lang}
          onDelete={(it) => deleteItem.mutate(it)}
          emptyText={t('emptyDay')}
          profile={{
            blog_handle: profile?.blog_handle,
            avatar_url: profile?.avatar_url,
            church_name: profile?.church_name,
          }}
        />
      </div>

      <GenerateWithAIDialog open={showAI} onOpenChange={setShowAI} lang={lang} />
    </div>
  );
}
