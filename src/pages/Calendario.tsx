import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronLeft, ChevronRight, Lock, Crown, CalendarPlus, Clock,
  CheckCircle2, FileText, Eye, Calendar as CalendarIcon, List, Trash2
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { format } from 'date-fns';

const monthNames: Record<string, string[]> = {
  PT: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  EN: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ES: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
};

const dayNames: Record<string, string[]> = {
  PT: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  EN: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ES: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
};

interface QueueItem {
  id: string;
  material_id: string | null;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  user_id: string;
  materials?: {
    title: string;
    type: string;
    passage: string | null;
  } | null;
}

const typeLabels: Record<string, Record<string, string>> = {
  sermon: { PT: 'Sermão', EN: 'Sermon', ES: 'Sermón' },
  blog_article: { PT: 'Artigo', EN: 'Article', ES: 'Artículo' },
  devotional: { PT: 'Devocional', EN: 'Devotional', ES: 'Devocional' },
  study: { PT: 'Estudo', EN: 'Study', ES: 'Estudio' },
};

export default function Calendario() {
  const { user, profile } = useAuth();
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const isFree = profile?.plan === 'free';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduleModal, setScheduleModal] = useState<{ day: number } | null>(null);
  const [detailModal, setDetailModal] = useState<QueueItem[] | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'year'>('calendar');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = Array.from({ length: firstDay }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  const i18n = {
    published: { PT: 'Publicado', EN: 'Published', ES: 'Publicado' },
    scheduled: { PT: 'Agendado', EN: 'Scheduled', ES: 'Programado' },
    draft: { PT: 'Rascunho', EN: 'Draft', ES: 'Borrador' },
    scheduledToast: { PT: 'Conteúdo agendado!', EN: 'Content scheduled!', ES: '¡Contenido programado!' },
    deletedToast: { PT: 'Agendamento removido!', EN: 'Schedule removed!', ES: '¡Programación eliminada!' },
    tooltipLocked: { PT: 'Agendar disponível no Pastoral', EN: 'Scheduling available on Pastoral', ES: 'La programación está disponible en Pastoral' },
    editorialScheduling: { PT: 'Agendamento editorial', EN: 'Editorial scheduling', ES: 'Programación editorial' },
    planAvailability: { PT: 'Disponível no plano Pastoral', EN: 'Available on the Pastoral plan', ES: 'Disponible en el plan Pastoral' },
    schedulePublication: { PT: 'Agendar publicação', EN: 'Schedule publication', ES: 'Programar publicación' },
    selectMaterial: { PT: 'Selecione um material...', EN: 'Select a material...', ES: 'Selecciona un material...' },
    scheduleLabel: { PT: 'Agendar', EN: 'Schedule', ES: 'Programar' },
    untitled: { PT: 'Sem título', EN: 'Untitled', ES: 'Sin título' },
    dayDetail: { PT: 'Publicações do dia', EN: 'Day publications', ES: 'Publicaciones del día' },
    time: { PT: 'Horário', EN: 'Time', ES: 'Hora' },
    upcoming: { PT: 'Próximas publicações', EN: 'Upcoming publications', ES: 'Próximas publicaciones' },
    noItems: { PT: 'Nenhuma publicação neste mês', EN: 'No publications this month', ES: 'Sin publicaciones este mes' },
    calendarView: { PT: 'Mês', EN: 'Month', ES: 'Mes' },
    listView: { PT: 'Lista', EN: 'List', ES: 'Lista' },
    yearView: { PT: 'Ano', EN: 'Year', ES: 'Año' },
    remove: { PT: 'Remover', EN: 'Remove', ES: 'Eliminar' },
    yearTitle: { PT: 'Planejamento anual', EN: 'Annual planning', ES: 'Planificación anual' },
    yearHint: { PT: 'Clique em qualquer mês para ver o detalhe.', EN: 'Click any month to see the details.', ES: 'Haz clic en cualquier mes para ver el detalle.' },
    items: { PT: 'publicações', EN: 'publications', ES: 'publicaciones' },
    item: { PT: 'publicação', EN: 'publication', ES: 'publicación' },
  };

  const tt = (key: keyof typeof i18n) => i18n[key][lang as 'PT' | 'EN' | 'ES'] || i18n[key].PT;

  const { data: queueItems = [] } = useQuery({
    queryKey: ['editorial-queue', user?.id, year, month],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('editorial_queue')
        .select('*, materials(title, type, passage)')
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return (data || []) as QueueItem[];
    },
    enabled: !!user,
  });

  const { data: unscheduledMaterials = [] } = useQuery({
    queryKey: ['unscheduled-materials', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('materials')
        .select('id, title, type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !isFree,
  });

  const dayItems = useMemo(() => {
    const map: Record<number, QueueItem[]> = {};
    queueItems.forEach((item) => {
      const dateStr = item.scheduled_at || item.published_at;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(item);
      }
    });
    return map;
  }, [queueItems, year, month]);

  const sortedMonthItems = useMemo(() => {
    return queueItems
      .filter((item) => {
        const dateStr = item.scheduled_at || item.published_at;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .sort((a, b) => {
        const da = new Date(a.scheduled_at || a.published_at || a.created_at).getTime();
        const db = new Date(b.scheduled_at || b.published_at || b.created_at).getTime();
        return da - db;
      });
  }, [queueItems, year, month]);

  const scheduleMutation = useMutation({
    mutationFn: async ({ materialId, day, hour, minute }: { materialId: string; day: number; hour: number; minute: number }) => {
      const scheduledAt = new Date(year, month, day, hour, minute, 0).toISOString();
      const { error } = await supabase.from('editorial_queue').insert({
        user_id: user!.id,
        material_id: materialId,
        status: 'scheduled',
        scheduled_at: scheduledAt,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editorial-queue'] });
      setScheduleModal(null);
      setSelectedMaterial('');
      setSelectedHour('09');
      setSelectedMinute('00');
      toast.success(tt('scheduledToast'));
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('editorial_queue').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editorial-queue'] });
      toast.success(tt('deletedToast'));
    },
    onError: (err: any) => toast.error(err.message),
  });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const statusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-emerald-500';
      case 'scheduled': return 'bg-blue-500';
      case 'draft': return 'bg-muted-foreground';
      default: return 'bg-muted-foreground';
    }
  };

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published': return 'default' as const;
      case 'scheduled': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle2 className="h-3 w-3" />;
      case 'scheduled': return <Clock className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  const formatItemTime = (item: QueueItem) => {
    const dateStr = item.scheduled_at || item.published_at;
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return format(d, 'HH:mm');
  };

  const formatItemDate = (item: QueueItem) => {
    const dateStr = item.scheduled_at || item.published_at;
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return format(d, 'dd/MM');
  };

  const getTypeLabel = (type: string) => {
    return typeLabels[type]?.[lang] || type;
  };

  return (
    <TooltipProvider>
      <div className="space-y-4 max-w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{t('calendar.title')}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-secondary rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'calendar' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                {tt('calendarView')}
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                {tt('listView')}
              </button>
              <button
                onClick={() => setViewMode('year')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'year' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                {tt('yearView')}
              </button>
            </div>
            <div className="flex gap-1.5">
              <Badge variant="outline" className="gap-1 text-[10px]">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                {tt('published')}
              </Badge>
              <Badge variant="outline" className="gap-1 text-[10px]">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                {tt('scheduled')}
              </Badge>
            </div>
          </div>
        </div>

        {/* Month Navigation */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <CardTitle className="font-display text-lg sm:text-xl">
                  {monthNames[lang]?.[month] || monthNames.PT[month]} {year}
                </CardTitle>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={goToday}>
                  {lang === 'PT' ? 'Hoje' : lang === 'EN' ? 'Today' : 'Hoy'}
                </Button>
              </div>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="px-2 sm:px-6">
            {viewMode === 'calendar' ? (
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {(dayNames[lang] || dayNames.PT).map((d) => (
                  <div key={d} className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground py-1.5 sm:py-2">{d}</div>
                ))}
                {days.map((day, i) => {
                  if (day === null) return <div key={`e-${i}`} />;
                  const isSunday = new Date(year, month, day).getDay() === 0;
                  const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                  const items = dayItems[day] || [];
                  const isPast = new Date(year, month, day) < new Date(new Date().setHours(0, 0, 0, 0));

                  return (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <div
                          onClick={() => {
                            if (items.length > 0) {
                              setDetailModal(items);
                              return;
                            }
                            if (isFree) return;
                            if (!isPast) setScheduleModal({ day });
                          }}
                          className={`min-h-[56px] sm:min-h-[76px] p-0.5 sm:p-1 flex flex-col rounded-lg text-sm transition-all border border-transparent ${
                            isSunday ? 'bg-primary/8' : 'hover:bg-secondary/50'
                          } ${isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''} ${
                            items.length > 0 ? 'cursor-pointer' : !isFree && !isPast ? 'cursor-pointer hover:border-primary/20' : ''
                          }`}
                        >
                          <span className={`text-[10px] sm:text-xs font-semibold px-0.5 ${
                            isToday ? 'text-primary' : isSunday ? 'text-primary/70' : 'text-muted-foreground'
                          }`}>
                            {day}
                          </span>
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            {items.slice(0, 2).map((item) => (
                              <div
                                key={item.id}
                                className={`flex items-center gap-0.5 text-[8px] sm:text-[10px] rounded px-0.5 sm:px-1 py-0.5 text-white leading-tight ${statusColor(item.status)}`}
                              >
                                {statusIcon(item.status)}
                                <span className="truncate hidden sm:inline">{item.materials?.title?.substring(0, 12) || tt('untitled')}</span>
                                <span className="truncate sm:hidden">{formatItemTime(item)}</span>
                              </div>
                            ))}
                            {items.length > 2 && (
                              <span className="text-[8px] sm:text-[10px] text-muted-foreground px-0.5">+{items.length - 2}</span>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      {isFree && items.length === 0 && (
                        <TooltipContent>
                          <p className="text-xs flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            {tt('tooltipLocked')}
                          </p>
                        </TooltipContent>
                      )}
                      {items.length > 0 && (
                        <TooltipContent className="max-w-[200px]">
                          {items.map((item) => (
                            <p key={item.id} className="text-xs truncate">
                              {formatItemTime(item)} — {item.materials?.title || tt('untitled')}
                            </p>
                          ))}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="space-y-2">
                {sortedMonthItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarIcon className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">{tt('noItems')}</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[500px]">
                    <div className="space-y-2 pr-2">
                      {sortedMonthItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-border/60 hover:border-primary/20 bg-card transition-colors"
                        >
                          {/* Date badge */}
                          <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 shrink-0">
                            <span className="text-[10px] font-medium text-primary uppercase">
                              {(dayNames[lang] || dayNames.PT)[new Date(item.scheduled_at || item.published_at || item.created_at).getDay()]}
                            </span>
                            <span className="text-lg font-bold text-primary leading-none">
                              {formatItemDate(item).split('/')[0]}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {item.materials?.title || tt('untitled')}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatItemTime(item)}
                              </span>
                              <Badge variant="secondary" className="text-[9px] capitalize h-4 px-1.5">
                                {getTypeLabel(item.materials?.type || 'draft')}
                              </Badge>
                              {item.materials?.passage && (
                                <span className="text-[10px] text-muted-foreground truncate">{item.materials.passage}</span>
                              )}
                            </div>
                          </div>

                          {/* Status & Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={statusBadgeVariant(item.status)} className="text-[10px] gap-1 capitalize">
                              {statusIcon(item.status)}
                              {tt(item.status as keyof typeof i18n) || item.status}
                            </Badge>
                            {item.status === 'scheduled' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteMutation.mutate(item.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Free plan upsell */}
        {isFree && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5 text-center">
              <Lock className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium">{tt('editorialScheduling')}</p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">{tt('planAvailability')}</p>
              <Button size="sm" className="bg-primary text-primary-foreground gap-1" asChild>
                <a href="/upgrade"><Crown className="h-3 w-3" /> {t('upgrade.cta')}</a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Schedule Modal */}
        <Dialog open={!!scheduleModal} onOpenChange={(open) => !open && setScheduleModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <CalendarPlus className="h-5 w-5 text-primary" />
                {tt('schedulePublication')} — {scheduleModal?.day}/{month + 1}/{year}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Material selector */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {lang === 'PT' ? 'Material' : lang === 'EN' ? 'Content' : 'Material'}
                </Label>
                <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                  <SelectTrigger>
                    <SelectValue placeholder={tt('selectMaterial')} />
                  </SelectTrigger>
                  <SelectContent>
                    {unscheduledMaterials.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>
                        <span className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] capitalize">{getTypeLabel(m.type)}</Badge>
                          <span className="truncate">{m.title}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Time picker */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {tt('time')}
                </Label>
                <div className="flex items-center gap-2">
                  <Select value={selectedHour} onValueChange={setSelectedHour}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-lg font-bold text-muted-foreground">:</span>
                  <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['00', '15', '30', '45'].map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full bg-primary text-primary-foreground"
                disabled={!selectedMaterial || scheduleMutation.isPending}
                onClick={() => {
                  if (scheduleModal && selectedMaterial) {
                    scheduleMutation.mutate({
                      materialId: selectedMaterial,
                      day: scheduleModal.day,
                      hour: parseInt(selectedHour),
                      minute: parseInt(selectedMinute),
                    });
                  }
                }}
              >
                <CalendarPlus className="h-4 w-4 mr-2" />
                {tt('scheduleLabel')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Day Detail Modal */}
        <Dialog open={!!detailModal} onOpenChange={(open) => !open && setDetailModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                {tt('dayDetail')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {detailModal?.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-card">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 ${statusColor(item.status)}`}>
                    {statusIcon(item.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {item.materials?.title || tt('untitled')}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatItemTime(item)}
                      </span>
                      <Badge variant="secondary" className="text-[9px] capitalize h-4 px-1.5">
                        {getTypeLabel(item.materials?.type || 'draft')}
                      </Badge>
                    </div>
                    {item.materials?.passage && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.materials.passage}</p>
                    )}
                  </div>
                  {item.status === 'scheduled' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => {
                        deleteMutation.mutate(item.id);
                        setDetailModal((prev) => prev?.filter((x) => x.id !== item.id) || null);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              {!isFree && (
                <Button
                  variant="outline"
                  className="w-full gap-2 text-sm"
                  onClick={() => {
                    setDetailModal(null);
                    // Try to get the day from the first item
                    const firstItem = detailModal?.[0];
                    if (firstItem) {
                      const dateStr = firstItem.scheduled_at || firstItem.published_at;
                      if (dateStr) {
                        const d = new Date(dateStr);
                        setScheduleModal({ day: d.getDate() });
                      }
                    }
                  }}
                >
                  <CalendarPlus className="h-4 w-4" />
                  {tt('schedulePublication')}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
