import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, MapPin, Lightbulb, ScrollText, Loader2, AlertCircle, Save } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type L = 'PT' | 'EN' | 'ES';

interface DeepSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
}

interface SearchResult {
  reference: string;
  passage: string;
  summary: string;
  context: string;
  insights: string[];
}

const labels: Record<string, Record<L, string>> = {
  searching: { PT: 'Analisando passagens bíblicas...', EN: 'Analyzing biblical passages...', ES: 'Analizando pasajes bíblicos...' },
  passage: { PT: 'Passagem Bíblica', EN: 'Biblical Passage', ES: 'Pasaje Bíblico' },
  summary: { PT: 'O que está acontecendo', EN: 'What is happening', ES: 'Qué está sucediendo' },
  context: { PT: 'Ambiente e Contexto Histórico', EN: 'Setting & Historical Context', ES: 'Ambiente y Contexto Histórico' },
  insights: { PT: 'Insights Teológicos', EN: 'Theological Insights', ES: 'Perspectivas Teológicas' },
  results: { PT: 'Resultado para', EN: 'Results for', ES: 'Resultados para' },
  error: { PT: 'Erro ao buscar resultados. Tente novamente.', EN: 'Error fetching results. Please try again.', ES: 'Error al buscar resultados. Inténtelo de nuevo.' },
  bible: { PT: 'Bíblia', EN: 'Bible', ES: 'Biblia' },
  save: { PT: 'Salvar na Biblioteca', EN: 'Save to Library', ES: 'Guardar en Biblioteca' },
  saved: { PT: 'Salvo com sucesso!', EN: 'Saved successfully!', ES: '¡Guardado con éxito!' },
  saveError: { PT: 'Erro ao salvar.', EN: 'Error saving.', ES: 'Error al guardar.' },
};

export function DeepSearchModal({ open, onOpenChange, query }: DeepSearchModalProps) {
  const { lang } = useLanguage();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<SearchResult | null>(null);
  const [saving, setSaving] = useState(false);

  const bibleVersion = profile?.bible_version || 'ARA';

  useEffect(() => {
    if (!open || !query) return;

    let cancelled = false;
    setLoading(true);
    setError(false);
    setData(null);

    const doSearch = async () => {
      try {
        const { data: result, error: fnError } = await supabase.functions.invoke('deep-search', {
          body: { query, bibleVersion, language: lang },
        });

        if (cancelled) return;

        if (fnError) throw fnError;
        if (result?.error) {
          if (result.error.includes('Rate limit')) {
            toast.error(lang === 'PT' ? 'Limite de requisições atingido. Tente em alguns segundos.' : lang === 'ES' ? 'Límite de solicitudes alcanzado.' : 'Rate limit reached. Try again shortly.');
          } else if (result.error.includes('Credits')) {
            toast.error(lang === 'PT' ? 'Créditos esgotados.' : lang === 'ES' ? 'Créditos agotados.' : 'Credits exhausted.');
          }
          throw new Error(result.error);
        }

        setData(result as SearchResult);
      } catch (err) {
        console.error('Deep search error:', err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    doSearch();
    return () => { cancelled = true; };
  }, [open, query, bibleVersion, lang]);
  const handleSave = async () => {
    if (!data || !user) return;
    setSaving(true);
    try {
      const content = [
        `## ${data.reference}\n`,
        `> ${data.passage}\n`,
        `### ${labels.summary[lang]}\n${data.summary}\n`,
        `### ${labels.context[lang]}\n${data.context}\n`,
        `### ${labels.insights[lang]}`,
        ...data.insights.map((ins, i) => `${i + 1}. ${ins}`),
      ].join('\n');

      const { error: insertError } = await supabase.from('materials').insert({
        user_id: user.id,
        title: `${labels.results[lang]}: ${query}`,
        content,
        type: 'deep_search',
        bible_version: bibleVersion,
        language: lang,
        passage: data.reference,
      });

      if (insertError) throw insertError;
      toast.success(labels.saved[lang]);
    } catch (err) {
      console.error('Save error:', err);
      toast.error(labels.saveError[lang]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="theme-app max-w-2xl w-[95vw] max-h-[85vh] overflow-y-auto p-0 gap-0 bg-background text-foreground">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border flex items-center justify-between">
          <DialogTitle className="text-lg font-semibold text-foreground">
            {labels.results[lang]} <span className="text-primary">"{query}"</span>
          </DialogTitle>
          <Badge variant="outline" className="text-xs shrink-0 ml-3">
            {labels.bible[lang]}: {bibleVersion}
          </Badge>
        </div>

        {loading ? (
          <div className="px-6 py-6 space-y-6">
            {/* Skeleton loading */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-14 w-full" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="h-14 w-full" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
            <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              {labels.searching[lang]}
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-6">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground text-center">{labels.error[lang]}</p>
          </div>
        ) : data ? (
          <div className="px-6 py-5 space-y-5">
            {/* 1. Passagem */}
            <section className="rounded-lg border border-border bg-muted/30 p-4">
              <SectionHeader icon={BookOpen} label={labels.passage[lang]} />
              <p className="text-xs font-medium text-primary mb-1.5">{data.reference}</p>
              <blockquote className="border-l-[3px] border-primary/50 pl-4 text-[15px] leading-relaxed text-foreground/80 italic">
                {data.passage}
              </blockquote>
            </section>

            {/* 2. Resumo */}
            <section>
              <SectionHeader icon={ScrollText} label={labels.summary[lang]} />
              <p className="text-sm leading-relaxed text-muted-foreground">{data.summary}</p>
            </section>

            {/* 3. Contexto Histórico */}
            <section>
              <SectionHeader icon={MapPin} label={labels.context[lang]} />
              <p className="text-sm leading-relaxed text-muted-foreground">{data.context}</p>
            </section>

            {/* 4. Insights */}
            <section>
              <SectionHeader icon={Lightbulb} label={labels.insights[lang]} />
              <ul className="space-y-3">
                {data.insights.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                    <span className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Save button */}
            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {labels.save[lang]}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</h3>
    </div>
  );
}
