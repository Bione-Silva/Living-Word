import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BookOpen, MapPin, Lightbulb, ScrollText, Loader2, AlertCircle, Save, Search, Globe, Wand2, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { Language } from '@/lib/i18n';

type L = 'PT' | 'EN' | 'ES';

interface DeepSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query?: string;
}

interface SearchResult {
  reference: string;
  passage: string;
  summary: string;
  context: string;
  insights: string[];
}

const labels: Record<string, Record<L, string>> = {
  title: { PT: 'Pesquisa Profunda', EN: 'Deep Search', ES: 'Búsqueda Profunda' },
  subtitle: { PT: 'Descubra contextos e conexões em qualquer passagem bíblica', EN: 'Discover contexts and connections in any biblical passage', ES: 'Descubre contextos y conexiones en cualquier pasaje bíblico' },
  heroSummary: {
    PT: 'A ferramenta perfeita para mergulhar fundo em qualquer tema ou passagem. Analisa o contexto histórico, gera insights teológicos e entrega uma pesquisa completa pronta para usar.',
    EN: 'The perfect tool to dive deep into any topic or passage. Analyzes historical context, generates theological insights and delivers a complete research ready to use.',
    ES: 'La herramienta perfecta para profundizar en cualquier tema o pasaje. Analiza el contexto histórico, genera perspectivas teológicas y entrega una investigación completa lista para usar.',
  },
  bullet1: { PT: 'Passagem bíblica com contexto histórico completo', EN: 'Biblical passage with full historical context', ES: 'Pasaje bíblico con contexto histórico completo' },
  bullet2: { PT: 'Insights teológicos e aplicações práticas', EN: 'Theological insights and practical applications', ES: 'Perspectivas teológicas y aplicaciones prácticas' },
  bullet3: { PT: 'Salve na biblioteca para consulta futura', EN: 'Save to library for future reference', ES: 'Guarda en la biblioteca para consulta futura' },
  inputLabel: { PT: 'Tema ou passagem', EN: 'Topic or passage', ES: 'Tema o pasaje' },
  placeholder: { PT: 'Ex: Mulher Samaritana, Romanos 8, Graça', EN: 'E.g.: Samaritan Woman, Romans 8, Grace', ES: 'Ej: Mujer Samaritana, Romanos 8, Gracia' },
  generate: { PT: 'Gerar', EN: 'Generate', ES: 'Generar' },
  generating: { PT: 'Analisando passagens bíblicas (~20s)...', EN: 'Analyzing biblical passages (~20s)...', ES: 'Analizando pasajes bíblicos (~20s)...' },
  workingOnIt: { PT: 'Trabalhando nisso...', EN: 'Working on it...', ES: 'Trabajando en eso...' },
  estimateTime: { PT: 'Geralmente completa em 1 minuto ou menos', EN: 'Requests typically complete in 1 minute or less', ES: 'Normalmente completa en 1 minuto o menos' },
  genLang: { PT: 'Gerar em:', EN: 'Generate in:', ES: 'Generar en:' },
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
  newSearch: { PT: 'Nova pesquisa', EN: 'New search', ES: 'Nueva búsqueda' },
};

export function DeepSearchModal({ open, onOpenChange, query: initialQuery }: DeepSearchModalProps) {
  const { lang } = useLanguage();
  const { user, profile } = useAuth();
  const [input, setInput] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [data, setData] = useState<SearchResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [generationLang, setGenerationLang] = useState<Language>(lang);
  const [searchedQuery, setSearchedQuery] = useState('');

  const bibleVersion = profile?.bible_version || 'ARA';

  // Sync input when query prop changes
  useEffect(() => {
    if (initialQuery) setInput(initialQuery);
  }, [initialQuery]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setData(null);
      setError(false);
      setLoading(false);
      setSearchedQuery('');
    }
  }, [open]);

  useEffect(() => {
    setGenerationLang(lang);
  }, [lang]);

  const handleGenerate = async () => {
    const term = input.trim();
    if (!term || term.length < 2) return;
    setLoading(true);
    setError(false);
    setData(null);
    setSearchedQuery(term);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('deep-search', {
        body: { query: term, bibleVersion, language: generationLang },
      });

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
      setError(true);
    } finally {
      setLoading(false);
    }
  };

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
        title: `${labels.results[lang]}: ${searchedQuery}`,
        content,
        type: 'deep_search',
        bible_version: bibleVersion,
        language: generationLang,
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

  const handleNewSearch = () => {
    setData(null);
    setError(false);
    setSearchedQuery('');
    setInput('');
  };

  const showForm = !data && !loading && !error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="theme-app max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-hidden bg-background text-foreground min-h-0 max-md:w-full max-md:h-full max-md:max-h-full max-md:rounded-none max-md:m-0 p-0 gap-0">
        <div className="px-4 sm:px-6 pt-6 pb-4 break-words">
          {/* ── Hero header ── */}
          <div className="space-y-2 pb-4 border-b border-border">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <DialogHeader className="p-0 space-y-0.5">
                  <DialogTitle className="font-display text-xl leading-tight text-foreground">
                    {labels.title[lang]}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-primary font-medium italic">
                    {labels.subtitle[lang]}
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {labels.heroSummary[lang]}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {[labels.bullet1, labels.bullet2, labels.bullet3].map((b, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground/80">
                  <Zap className="h-3 w-3 text-primary shrink-0" />
                  <span className="leading-snug">{b[lang]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Form phase ── */}
          {showForm && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="font-medium">{labels.inputLabel[lang]}</Label>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={labels.placeholder[lang]}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
              </div>

              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                <Label className="text-sm text-muted-foreground shrink-0">
                  {labels.genLang[lang]}
                </Label>
                <Select value={generationLang} onValueChange={(v) => setGenerationLang(v as Language)}>
                  <SelectTrigger className="w-[160px] h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PT">Português</SelectItem>
                    <SelectItem value="EN">English</SelectItem>
                    <SelectItem value="ES">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!input.trim() || input.trim().length < 2}
                className="w-full gap-2 bg-primary text-primary-foreground"
              >
                <Wand2 className="h-4 w-4" />
                {labels.generate[lang]}
              </Button>
            </div>
          )}

          {/* ── Loading phase ── */}
          {loading && (
            <div className="space-y-4 mt-4">
              <Button disabled className="w-full gap-2 bg-primary text-primary-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {labels.generating[lang]}
              </Button>

              <div className="flex flex-col items-center justify-center py-12 space-y-4 rounded-xl border border-border bg-card">
                <p className="text-sm text-primary font-medium animate-pulse">
                  {labels.workingOnIt[lang]}
                </p>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-3 h-3 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="w-3 h-3 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: '450ms' }} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {labels.estimateTime[lang]}
                </p>
              </div>
            </div>
          )}

          {/* ── Error phase ── */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 mt-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground text-center">{labels.error[lang]}</p>
              <Button variant="outline" size="sm" onClick={handleNewSearch}>
                {labels.newSearch[lang]}
              </Button>
            </div>
          )}

          {/* ── Results phase ── */}
          {data && !loading && (
            <div className="space-y-5 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {labels.results[lang]} <span className="text-primary">"{searchedQuery}"</span>
                </p>
                <Badge variant="outline" className="text-xs shrink-0 ml-3">
                  {labels.bible[lang]}: {bibleVersion}
                </Badge>
              </div>

              {/* 1. Passagem */}
              <section className="rounded-lg border border-border bg-muted/30 p-4">
                <SectionHeader icon={BookOpen} label={labels.passage[lang]} />
                <p className="text-xs font-medium text-primary mb-1.5">{data.reference}</p>
                <blockquote className="border-l-[3px] border-primary/50 pl-4 text-sm sm:text-[15px] leading-relaxed text-foreground/80 italic break-words">
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

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between gap-2">
                <Button variant="outline" size="sm" onClick={handleNewSearch} className="gap-2">
                  <Search className="h-4 w-4" />
                  {labels.newSearch[lang]}
                </Button>
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
          )}
        </div>
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
