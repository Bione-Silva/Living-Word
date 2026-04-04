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
import { ChevronLeft, ChevronRight, Lock, Crown, CalendarPlus, Clock, CheckCircle2, FileText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';

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

export default function Calendario() {
  const { user, profile } = useAuth();
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const isFree = profile?.plan === 'free';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduleModal, setScheduleModal] = useState<{ day: number } | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = Array.from({ length: firstDay }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  const statusPublished = lang === 'PT' ? 'Publicado' : lang === 'EN' ? 'Published' : 'Publicado';
  const statusScheduled = lang === 'PT' ? 'Agendado' : lang === 'EN' ? 'Scheduled' : 'Programado';
  const scheduledToast = lang === 'PT' ? 'Conteúdo agendado!' : lang === 'EN' ? 'Content scheduled!' : '¡Contenido programado!';
  const tooltipText = lang === 'PT'
    ? 'Agendar disponível no Pastoral'
    : lang === 'EN'
      ? 'Scheduling available on Pastoral'
      : 'La programación está disponible en Pastoral';
  const editorialScheduling = lang === 'PT'
    ? 'Agendamento editorial'
    : lang === 'EN'
      ? 'Editorial scheduling'
      : 'Programación editorial';
  const planAvailability = lang === 'PT'
    ? 'Disponível no plano Pastoral'
    : lang === 'EN'
      ? 'Available on the Pastoral plan'
      : 'Disponible en el plan Pastoral';
  const schedulePublication = lang === 'PT'
    ? 'Agendar publicação'
    : lang === 'EN'
      ? 'Schedule publication'
      : 'Programar publicación';
  const selectMaterial = lang === 'PT'
    ? 'Selecione um material...'
    : lang === 'EN'
      ? 'Select a material...'
      : 'Selecciona un material...';
  const scheduleLabel = lang === 'PT' ? 'Agendar' : lang === 'EN' ? 'Schedule' : 'Programar';
  const untitledLabel = lang === 'PT' ? 'Sem título' : lang === 'EN' ? 'Untitled' : 'Sin título';

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

  const scheduleMutation = useMutation({
    mutationFn: async ({ materialId, day }: { materialId: string; day: number }) => {
      const scheduledAt = new Date(year, month, day, 9, 0, 0).toISOString();
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
      toast.success(scheduledToast);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const statusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-emerald-500';
      case 'scheduled': return 'bg-blue-500';
      case 'draft': return 'bg-muted-foreground';
      default: return 'bg-muted-foreground';
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle2 className="h-3 w-3" />;
      case 'scheduled': return <Clock className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold">{t('calendar.title')}</h1>
          <div className="flex gap-2">
            <Badge variant="outline" className="gap-1 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              {statusPublished}
            </Badge>
            <Badge variant="outline" className="gap-1 text-xs">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              {statusScheduled}
            </Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="font-display text-xl">
                {monthNames[lang]?.[month] || monthNames.PT[month]} {year}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {(dayNames[lang] || dayNames.PT).map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
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
                          if (isFree) return;
                          if (!isPast) setScheduleModal({ day });
                        }}
                        className={`min-h-[72px] p-1 flex flex-col rounded-lg text-sm transition-colors border border-transparent ${
                          isSunday ? 'bg-primary/10' : 'hover:bg-secondary/50'
                        } ${isToday ? 'ring-2 ring-primary' : ''} ${
                          !isFree && !isPast ? 'cursor-pointer hover:border-primary/30' : ''
                        }`}
                      >
                        <span className={`text-xs font-medium ${isSunday ? 'text-primary' : 'text-muted-foreground'}`}>
                          {day}
                        </span>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          {items.slice(0, 2).map((item) => (
                            <div
                              key={item.id}
                              className={`flex items-center gap-1 text-[10px] rounded px-1 py-0.5 text-white ${statusColor(item.status)}`}
                            >
                              {statusIcon(item.status)}
                              <span className="truncate">{item.materials?.title?.substring(0, 15) || untitledLabel}</span>
                            </div>
                          ))}
                          {items.length > 2 && (
                            <span className="text-[10px] text-muted-foreground">+{items.length - 2}</span>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    {isFree && (
                      <TooltipContent>
                        <p className="text-xs flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          {tooltipText}
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {isFree && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5 text-center">
              <Lock className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium">{editorialScheduling}</p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">{planAvailability}</p>
              <Button size="sm" className="bg-primary text-primary-foreground gap-1" asChild>
                <a href="/upgrade"><Crown className="h-3 w-3" /> {t('upgrade.cta')}</a>
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={!!scheduleModal} onOpenChange={(open) => !open && setScheduleModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <CalendarPlus className="h-5 w-5" />
                {schedulePublication} — {scheduleModal?.day}/{month + 1}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                <SelectTrigger>
                  <SelectValue placeholder={selectMaterial} />
                </SelectTrigger>
                <SelectContent>
                  {unscheduledMaterials.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] capitalize">{m.type}</Badge>
                        {m.title}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full bg-primary text-primary-foreground"
                disabled={!selectedMaterial || scheduleMutation.isPending}
                onClick={() => {
                  if (scheduleModal && selectedMaterial) {
                    scheduleMutation.mutate({ materialId: selectedMaterial, day: scheduleModal.day });
                  }
                }}
              >
                {scheduleLabel}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
