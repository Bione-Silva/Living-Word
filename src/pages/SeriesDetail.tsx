// @ts-nocheck
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  BookOpen, ChevronLeft, Wand2, Book, Tag, ExternalLink, FileText, Calendar,
  Pencil, Check, X, Plus, Trash2, Save,
} from 'lucide-react';
import { toast } from 'sonner';

type L = 'PT' | 'EN' | 'ES';

const i18n = {
  back:          { PT: 'Voltar', EN: 'Back', ES: 'Volver' },
  overview:      { PT: 'Visão Geral', EN: 'Overview', ES: 'Resumen' },
  week:          { PT: 'Semana', EN: 'Week', ES: 'Semana' },
  texts:         { PT: 'Textos Bíblicos', EN: 'Biblical Texts', ES: 'Textos Bíblicos' },
  topics:        { PT: 'Tópicos', EN: 'Topics', ES: 'Temas' },
  prepareSermon: { PT: 'Preparar sermão desta semana', EN: "Prepare this week's sermon", ES: 'Preparar sermón de esta semana' },
  aboutSeries:   { PT: 'Sobre esta série', EN: 'About this series', ES: 'Sobre esta serie' },
  weeks:         { PT: 'semanas', EN: 'weeks', ES: 'semanas' },
  notFound:      { PT: 'Série não encontrada.', EN: 'Series not found.', ES: 'Serie no encontrada.' },
  tapWeek:       { PT: 'Selecione uma semana para ver o conteúdo', EN: 'Select a week to view content', ES: 'Selecciona una semana para ver el contenido' },
  save:          { PT: 'Salvar alterações', EN: 'Save changes', ES: 'Guardar cambios' },
  saved:         { PT: 'Alterações salvas!', EN: 'Changes saved!', ES: '¡Cambios guardados!' },
  addText:       { PT: '+ Adicionar texto', EN: '+ Add text', ES: '+ Agregar texto' },
  addTopic:      { PT: '+ Adicionar tópico', EN: '+ Add topic', ES: '+ Agregar tema' },
  editHint:      { PT: 'Clique em qualquer texto para editar', EN: 'Click any text to edit', ES: 'Haz clic en cualquier texto para editar' },
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

// ── Inline editable field ──────────────────────────────────────
function EditableText({
  value, onChange, multiline = false, className = '', placeholder = '',
}: { value: string; onChange: (v: string) => void; multiline?: boolean; className?: string; placeholder?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => { onChange(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  if (editing) {
    return (
      <div className="flex flex-col gap-1">
        {multiline ? (
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            rows={4}
            className="resize-none text-sm"
          />
        ) : (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            className="text-sm"
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
          />
        )}
        <div className="flex gap-1">
          <Button size="sm" variant="default" className="h-7 gap-1 text-xs" onClick={commit}>
            <Check className="h-3 w-3" /> OK
          </Button>
          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={cancel}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`group w-full text-left relative hover:ring-1 hover:ring-primary/30 rounded-md px-1 -mx-1 transition-all ${className}`}
      title="Clique para editar"
    >
      {value || <span className="text-muted-foreground italic text-sm">{placeholder}</span>}
      <Pencil className="h-3 w-3 text-primary opacity-0 group-hover:opacity-60 absolute top-0.5 right-0.5 transition-opacity" />
    </button>
  );
}

// ── Editable badge list (texts or topics) ──────────────────────
function EditableList({
  items, onChange, addLabel,
}: { items: string[]; onChange: (v: string[]) => void; addLabel: string }) {
  const add = () => onChange([...items, '']);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i: number, v: string) => {
    const next = [...items];
    next[i] = v;
    onChange(next.filter(Boolean));
  };

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1 group">
          <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
          <EditableInlineItem value={item} onCommit={(v) => update(i, v)} />
          <button
            onClick={() => remove(i)}
            className="h-5 w-5 opacity-0 group-hover:opacity-100 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded transition-all"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="text-xs text-primary hover:underline flex items-center gap-0.5 mt-1"
      >
        <Plus className="h-3 w-3" /> {addLabel}
      </button>
    </div>
  );
}

function EditableInlineItem({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [editing, setEditing] = useState(!value);
  const [draft, setDraft] = useState(value);
  const commit = () => { if (draft.trim()) { onCommit(draft.trim()); setEditing(false); } };
  if (editing) {
    return (
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        autoFocus
        className="h-6 text-xs flex-1 px-1"
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
      />
    );
  }
  return (
    <span
      className="flex-1 text-sm font-medium cursor-pointer hover:text-primary transition-colors"
      onClick={() => setEditing(true)}
    >
      {value}
    </span>
  );
}

// ── Editable topic badges ────────────────────────────────────
function EditableTopics({ topics, onChange, addLabel }: { topics: string[]; onChange: (v: string[]) => void; addLabel: string }) {
  const [newTopic, setNewTopic] = useState('');
  const [adding, setAdding] = useState(false);

  const remove = (i: number) => onChange(topics.filter((_, idx) => idx !== i));
  const add = () => {
    if (newTopic.trim()) { onChange([...topics, newTopic.trim()]); setNewTopic(''); setAdding(false); }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {topics.map((topic, i) => (
        <span key={i} className="group inline-flex items-center gap-1 bg-secondary text-secondary-foreground text-[11px] px-2 py-0.5 rounded-full">
          {topic}
          <button onClick={() => remove(i)} className="opacity-0 group-hover:opacity-100 text-destructive">
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      {adding ? (
        <Input
          autoFocus
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          onBlur={() => { add(); setAdding(false); }}
          onKeyDown={(e) => { if (e.key === 'Enter') add(); if (e.key === 'Escape') setAdding(false); }}
          className="h-6 text-xs w-28 px-2"
          placeholder="Novo tópico"
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="text-[11px] text-primary border border-primary/30 rounded-full px-2 py-0.5 hover:bg-primary/5 transition-colors flex items-center gap-0.5"
        >
          <Plus className="h-2.5 w-2.5" /> {addLabel}
        </button>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function SeriesDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | number>('overview');
  const [draft, setDraft] = useState<SeriesData | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    if (!material?.content) return;
    try { setDraft(JSON.parse(material.content)); } catch { /* noop */ }
  }, [material]);

  // ── Patch helpers ────────────────────────────────────────────
  const patchSeries = (patch: Partial<SeriesData>) => {
    setDraft((prev) => prev ? { ...prev, ...patch } : prev);
    setDirty(true);
  };

  const patchWeek = (weekNumber: number, patch: Partial<SeriesWeek>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        weeks: prev.weeks.map((w) =>
          w.week_number === weekNumber ? { ...w, ...patch } : w
        ),
      };
    });
    setDirty(true);
  };

  // ── Save to Supabase ─────────────────────────────────────────
  const handleSave = async () => {
    if (!draft || !id) return;
    setSaving(true);
    const { error } = await supabase
      .from('materials')
      .update({ title: draft.title, content: JSON.stringify(draft) })
      .eq('id', id);
    setSaving(false);
    if (error) { toast.error('Erro ao salvar'); return; }
    setDirty(false);
    toast.success(t('saved'));
    queryClient.invalidateQueries({ queryKey: ['series-detail', id] });
    queryClient.invalidateQueries({ queryKey: ['series-list'] });
  };

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

  if (error || !draft) {
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
    ? draft.weeks.find((w) => w.week_number === activeTab)
    : null;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back + Save bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground" onClick={() => navigate('/series')}>
          <ChevronLeft className="h-4 w-4" /> {t('back')}
        </Button>
        {dirty && (
          <Button size="sm" className="gap-2 animate-in fade-in slide-in-from-top-1" onClick={handleSave} disabled={saving}>
            <Save className="h-3.5 w-3.5" />
            {saving ? '...' : t('save')}
          </Button>
        )}
      </div>

      {/* Title (editable) */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-5 w-5 text-primary shrink-0" />
            <Badge variant="secondary" className="text-[10px]">
              {draft.weeks.length} {t('weeks')}
            </Badge>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">{t('editHint')}</span>
          </div>
          <EditableText
            value={draft.title}
            onChange={(v) => patchSeries({ title: v })}
            className="font-display text-2xl sm:text-3xl font-bold text-foreground"
            placeholder="Título da série"
          />
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
            {draft.weeks.map((w) => (
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
                  <EditableText
                    value={draft.overview}
                    onChange={(v) => patchSeries({ overview: v })}
                    multiline
                    className="text-muted-foreground leading-relaxed"
                    placeholder="Descrição geral da série..."
                  />

                  {/* Week list preview */}
                  <div className="mt-4 space-y-3 pt-4 border-t border-border/50">
                    {draft.weeks.map((w) => (
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
                    <EditableText
                      value={activeWeekData.title}
                      onChange={(v) => patchWeek(activeWeekData.week_number, { title: v })}
                      className="font-display text-xl font-bold"
                      placeholder="Título da semana"
                    />
                  </div>

                  <EditableText
                    value={activeWeekData.overview}
                    onChange={(v) => patchWeek(activeWeekData.week_number, { overview: v })}
                    multiline
                    className="text-muted-foreground leading-relaxed"
                    placeholder="Descrição desta semana..."
                  />

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
                <span>{draft.weeks.length} {t('weeks')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Texts — editable */}
          {activeWeekData && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Book className="h-3.5 w-3.5" /> {t('texts')}
                </p>
                <EditableList
                  items={activeWeekData.texts}
                  onChange={(v) => patchWeek(activeWeekData.week_number, { texts: v })}
                  addLabel={t('addText')}
                />
              </CardContent>
            </Card>
          )}

          {/* Topics — editable */}
          {activeWeekData && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" /> {t('topics')}
                </p>
                <EditableTopics
                  topics={activeWeekData.topics}
                  onChange={(v) => patchWeek(activeWeekData.week_number, { topics: v })}
                  addLabel={t('addTopic')}
                />
              </CardContent>
            </Card>
          )}

          {/* Overview topics if on overview tab */}
          {activeTab === 'overview' && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" /> {t('topics')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {draft.weeks.flatMap((w) => w.topics).slice(0, 12).map((topic, i) => (
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
