// @ts-nocheck
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen, ChevronLeft, Wand2, Book, Tag, ExternalLink, FileText, Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

type L = 'PT' | 'EN' | 'ES';

const i18n = {
  back:          { PT: 'Voltar', EN: 'Back', ES: 'Volver' },
  overview:      { PT: 'Visão Geral', EN: 'Overview', ES: 'Resumen' },
  week:          { PT: 'Semana', EN: 'Week', ES: 'Semana' },
  texts:         { PT: 'Textos Bíblicos', EN: 'Biblical Texts', ES: 'Textos Bíblicos' },
  topics:        { PT: 'Tópicos', EN: 'Topics', ES: 'Temas' },
  prepareSermon: { PT: 'Preparar sermão desta semana', EN: 'Prepare this week\'s sermon', ES: 'Preparar sermón de esta semana' },
  aboutSeries:   { PT: 'Sobre esta série', EN: 'About this series', ES: 'Sobre esta serie' },
  weeks:         { PT: 'semanas', EN: 'weeks', ES: 'semanas' },
  notFound:      { PT: 'Série não encontrada.', EN: 'Series not found.', ES: 'Serie no encontrada.' },
  tapWeek:       { PT: 'Selecione uma semana para ver o conteúdo', EN: 'Select a week to view content', ES: 'Selecciona una semana para ver el contenido' },
};

interface SeriesWeek {
  week_number: number;
  title: string;
  overview: string;
  texts: string[];
  topics: string[];
}

interface SeriesData {
  title: string;
  overview: string;
  weeks: SeriesWeek[];
}

export default function SeriesDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | number>('overview');

  const t = useCallback((key: keyof typeof i18n) => i18n[key][lang as L] || i18n[key].PT, [lang]);

  const { data: material, isLoading, error } = useQuery({
    queryKey: ['series-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('id, title, content, created_at, language')
        .eq('id', id)
        .eq('type', 'series_calendar')
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const parsedSeries: SeriesData | null = (() => {
    if (!material?.content) return null;
    try { return JSON.parse(material.content); } catch { return null; }
  })();

  const handlePrepareSermon = (week: SeriesWeek) => {
    const text = week.texts?.[0] ?? '';
    navigate(`/sermoes/editor?passage=${encodeURIComponent(text)}&theme=${encodeURIComponent(week.title)}`);
    toast.info(`Abrindo editor com: ${week.title}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-20" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !parsedSeries) {
    return (
      <div className="max-w-4xl text-center py-20 text-muted-foreground">
        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>{t('notFound')}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/series')}>
          {t('back')}
        </Button>
      </div>
    );
  }

  const activeWeekData = typeof activeTab === 'number'
    ? parsedSeries.weeks.find((w) => w.week_number === activeTab)
    : null;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground" onClick={() => navigate('/series')}>
        <ChevronLeft className="h-4 w-4" /> {t('back')}
      </Button>

      {/* Title area */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-5 w-5 text-primary" />
            <Badge variant="secondary" className="text-[10px]">
              {parsedSeries.weeks.length} {t('weeks')}
            </Badge>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {parsedSeries.title}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Main panel */}
        <div className="space-y-4">
          {/* Tab navigation */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'overview'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('overview')}
            </button>
            {parsedSeries.weeks.map((w) => (
              <button
                key={w.week_number}
                onClick={() => setActiveTab(w.week_number)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === w.week_number
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('week')} {w.week_number}
              </button>
            ))}
          </div>

          {/* Content panel */}
          <Card>
            <CardContent className="p-6">
              {activeTab === 'overview' ? (
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-semibold">{t('overview')}</h2>
                  <p className="text-muted-foreground leading-relaxed">{parsedSeries.overview}</p>

                  {/* Week list preview */}
                  <div className="mt-4 space-y-3 pt-4 border-t border-border/50">
                    {parsedSeries.weeks.map((w) => (
                      <button
                        key={w.week_number}
                        onClick={() => setActiveTab(w.week_number)}
                        className="w-full text-left flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/60 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                          {w.week_number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{w.title}</p>
                          {w.texts?.[0] && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">{w.texts[0]}</p>
                          )}
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : activeWeekData ? (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">
                      {t('week')} {activeWeekData.week_number}
                    </p>
                    <h2 className="font-display text-xl font-bold">{activeWeekData.title}</h2>
                  </div>

                  <p className="text-muted-foreground leading-relaxed">{activeWeekData.overview}</p>

                  {/* Prepare Sermon CTA */}
                  <Button
                    className="gap-2 w-full sm:w-auto"
                    onClick={() => handlePrepareSermon(activeWeekData)}
                  >
                    <Wand2 className="h-4 w-4" /> {t('prepareSermon')}
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">{t('tapWeek')}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* About */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('aboutSeries')}</p>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <span>{parsedSeries.weeks.length} {t('weeks')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Texts */}
          {activeWeekData?.texts && activeWeekData.texts.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Book className="h-3.5 w-3.5" /> {t('texts')}
                </p>
                <div className="space-y-1.5">
                  {activeWeekData.texts.map((text, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span className="font-medium">{text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Topics */}
          {activeWeekData?.topics && activeWeekData.topics.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" /> {t('topics')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {activeWeekData.topics.map((topic, i) => (
                    <Badge key={i} variant="secondary" className="text-[11px]">{topic}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Overview texts/topics if on overview tab */}
          {activeTab === 'overview' && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" /> {t('topics')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {parsedSeries.weeks.flatMap(w => w.topics).slice(0, 12).map((topic, i) => (
                    <Badge key={i} variant="outline" className="text-[11px]">{topic}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
