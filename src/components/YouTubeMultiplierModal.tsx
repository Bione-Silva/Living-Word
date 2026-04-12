// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import {
  Loader2, Copy, Save, BookOpen, Wand2, Globe, Maximize2, Minimize2,
  FileText, Users, MessageSquare, Mail, Zap,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MaterialFeedback } from '@/components/MaterialFeedback';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Language } from '@/lib/i18n';
import { helpCategories, helpFullArticles } from '@/data/help-center-data';

type L = 'PT' | 'EN' | 'ES';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolTitle: string;
}

/* ── content‑type definitions ── */
const contentTypes = [
  { id: 'article', icon: FileText, label: { PT: 'Artigo para Blog', EN: 'Blog Article', ES: 'Artículo de Blog' } },
  { id: 'cell', icon: Users, label: { PT: 'Estudo de Célula', EN: 'Cell Group Study', ES: 'Estudio de Célula' } },
  { id: 'social', icon: MessageSquare, label: { PT: 'Frases para Redes', EN: 'Social Phrases', ES: 'Frases para Redes' } },
  { id: 'newsletter', icon: Mail, label: { PT: 'Newsletter Pastoral', EN: 'Pastoral Newsletter', ES: 'Newsletter Pastoral' } },
] as const;

type ContentTypeId = typeof contentTypes[number]['id'];

/* ── i18n copy ── */
const copy: Record<L, Record<string, string>> = {
  PT: {
    subtitle: 'Transforme palestras e pregações do YouTube em um ecossistema completo: Artigos, Estudos de Célula, Frases virais e Newsletters usando IA.',
    inputLabel: 'Cole a transcrição do vídeo',
    placeholder: 'Cole aqui a transcrição completa ou os pontos-chave do vídeo do YouTube...',
    selectLabel: 'O que você deseja gerar?',
    generate: 'Gerar Conteúdo',
    generating: 'Reciclando conteúdo com IA (~30s)...',
    working: 'Trabalhando nisso...',
    eta: 'Geralmente completa em 1 minuto ou menos',
    copy: 'Copiar',
    save: 'Salvar',
    publish: 'Publicar',
    expand: 'Expandir',
    close: 'Fechar',
    copied: 'Copiado!',
    saved: 'Salvo na Biblioteca!',
    published: 'Publicado no blog!',
    selectOne: 'Selecione pelo menos um tipo de conteúdo',
    genIn: 'Gerar em:',
    tabArticle: 'Artigo',
    tabCell: 'Célula',
    tabSocial: 'Social',
    tabNewsletter: 'Newsletter',
    expandedTitle: 'Leitura expandida',
  },
  EN: {
    subtitle: 'Transform YouTube talks and sermons into a complete content ecosystem: Articles, Cell Studies, Viral Phrases, and Newsletters powered by AI.',
    inputLabel: 'Paste the video transcript',
    placeholder: 'Paste here the full transcript or key points from the YouTube video...',
    selectLabel: 'What would you like to generate?',
    generate: 'Generate Content',
    generating: 'Recycling content with AI (~30s)...',
    working: 'Working on it...',
    eta: 'Requests typically complete in 1 minute or less',
    copy: 'Copy',
    save: 'Save',
    publish: 'Publish',
    expand: 'Expand',
    close: 'Close',
    copied: 'Copied!',
    saved: 'Saved to Library!',
    published: 'Published to blog!',
    selectOne: 'Select at least one content type',
    genIn: 'Generate in:',
    tabArticle: 'Article',
    tabCell: 'Cell Group',
    tabSocial: 'Social',
    tabNewsletter: 'Newsletter',
    expandedTitle: 'Expanded reading',
  },
  ES: {
    subtitle: 'Transforma charlas y predicaciones de YouTube en un ecosistema completo: Artículos, Estudios de Célula, Frases virales y Newsletters con IA.',
    inputLabel: 'Pega la transcripción del video',
    placeholder: 'Pega aquí la transcripción completa o los puntos clave del video de YouTube...',
    selectLabel: '¿Qué deseas generar?',
    generate: 'Generar Contenido',
    generating: 'Reciclando contenido con IA (~30s)...',
    working: 'Trabajando en eso...',
    eta: 'Normalmente completa en 1 minuto o menos',
    copy: 'Copiar',
    save: 'Guardar',
    publish: 'Publicar',
    expand: 'Expandir',
    close: 'Cerrar',
    copied: '¡Copiado!',
    saved: '¡Guardado en Biblioteca!',
    published: '¡Publicado en el blog!',
    selectOne: 'Selecciona al menos un tipo de contenido',
    genIn: 'Generar en:',
    tabArticle: 'Artículo',
    tabCell: 'Célula',
    tabSocial: 'Social',
    tabNewsletter: 'Newsletter',
    expandedTitle: 'Lectura expandida',
  },
};

/* ── prompt builder ── */
function buildSystemPrompt(selected: ContentTypeId[], langLabel: string) {
  const sections: string[] = [];
  if (selected.includes('article')) sections.push(
    `## ARTICLE\nWrite a complete, SEO-friendly blog article (600-800 words) with H1 title, introduction, 2-3 H2 sections, and conclusion.`
  );
  if (selected.includes('cell')) sections.push(
    `## CELL_GROUP\nCreate a cell/small-group study guide with: an icebreaker question, 3-5 discussion questions, a key Bible verse, and a closing prayer prompt.`
  );
  if (selected.includes('social')) sections.push(
    `## SOCIAL\nExtract 5-8 powerful, standalone phrases suitable for social media posts. Each phrase on its own line preceded by "- ".`
  );
  if (selected.includes('newsletter')) sections.push(
    `## NEWSLETTER\nWrite a warm pastoral newsletter/email (300-500 words) with greeting, main insight, practical takeaway, and sign-off.`
  );

  return `You are a content repurposing specialist for pastors and Christian leaders. The user will paste a video transcript or key points. Generate ONLY the requested sections below. Each section MUST start with its exact header (e.g. "## ARTICLE"). Write in ${langLabel}.\n\n${sections.join('\n\n')}`;
}

/* ── parser ── */
function parseSections(raw: string): Record<ContentTypeId, string> {
  const result: Record<ContentTypeId, string> = { article: '', cell: '', social: '', newsletter: '' };
  const map: Record<string, ContentTypeId> = {
    'ARTICLE': 'article',
    'CELL_GROUP': 'cell',
    'SOCIAL': 'social',
    'NEWSLETTER': 'newsletter',
  };

  const regex = /## (ARTICLE|CELL_GROUP|SOCIAL|NEWSLETTER)\s*\n/g;
  const matches = [...raw.matchAll(regex)];

  if (matches.length === 0) {
    // Fallback: put everything in the first selected section or article
    result.article = raw;
    return result;
  }

  for (let i = 0; i < matches.length; i++) {
    const key = map[matches[i][1]];
    const start = matches[i].index! + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : raw.length;
    result[key] = raw.slice(start, end).trim();
  }
  return result;
}

export function YouTubeMultiplierModal({ open, onOpenChange, toolTitle }: Props) {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const t = copy[lang];

  const [input, setInput] = useState('');
  const [rawResult, setRawResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [expandedTab, setExpandedTab] = useState<ContentTypeId>('article');
  const [generationLang, setGenerationLang] = useState<Language>(lang);
  const [selected, setSelected] = useState<Set<ContentTypeId>>(new Set(['article', 'cell', 'social', 'newsletter']));

  useEffect(() => { setGenerationLang(lang); }, [lang]);

  const sections = useMemo(() => parseSections(rawResult), [rawResult]);
  const activeTabs = useMemo(() => contentTypes.filter(ct => selected.has(ct.id) && sections[ct.id]), [selected, sections]);

  const genLangLabel = generationLang === 'PT' ? 'Portuguese (Brazilian)' : generationLang === 'EN' ? 'English' : 'Spanish';

  const toggleType = (id: ContentTypeId) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetForm = () => {
    setRawResult('');
    setInput('');
    setSelected(new Set(['article', 'cell', 'social', 'newsletter']));
    setGenerationLang(lang);
  };

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    if (selected.size === 0) { toast.error(t.selectOne); return; }
    setLoading(true);
    setRawResult('');
    try {
      const { data, error } = await supabase.functions.invoke('ai-tool', {
        body: {
          systemPrompt: buildSystemPrompt([...selected], genLangLabel),
          userPrompt: input,
        },
      });
      if (error) throw error;
      setRawResult(data?.content || '');
    } catch (err: any) {
      toast.error(err.message || 'Error generating content');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t.copied);
  };

  const handleSave = async (content: string, type: string) => {
    if (!user || !content) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any).from('materials').insert({
        user_id: user.id,
        title: `YouTube → ${type} — ${input.substring(0, 50)}`,
        type: 'youtube-blog',
        content,
        language: generationLang,
      });
      if (error) throw error;
      toast.success(t.saved);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const tabKeyMap: Record<ContentTypeId, string> = {
    article: 'tabArticle', cell: 'tabCell', social: 'tabSocial', newsletter: 'tabNewsletter',
  };

  /* ── Hero header from help-center-data ── */
  const article = helpFullArticles.find(a => a.toolId === 'youtube-blog');
  const toolCard = helpCategories.flatMap(c => c.tools).find(tc => tc.id === 'youtube-blog');
  const IconComp = article?.icon || toolCard?.icon;

  const renderTabActions = (tabId: ContentTypeId) => (
    <div className="flex flex-wrap gap-2 pt-2">
      <Button size="sm" variant="outline" className="gap-1" onClick={() => handleCopy(sections[tabId])}>
        <Copy className="h-3 w-3" /> {t.copy}
      </Button>
      <Button size="sm" variant="outline" className="gap-1" onClick={() => handleSave(sections[tabId], tabId)} disabled={saving}>
        <Save className="h-3 w-3" /> {t.save}
      </Button>
      <Button size="sm" variant="outline" className="gap-1" onClick={() => { setExpandedTab(tabId); setExpanded(true); }}>
        <Maximize2 className="h-3 w-3" /> {t.expand}
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="theme-app max-w-2xl w-[95vw] max-h-[90vh] overflow-hidden overflow-x-hidden flex flex-col bg-background text-foreground min-h-0 max-md:w-full max-md:h-full max-md:max-h-full max-md:rounded-none max-md:m-0 break-words">
        {/* ── Hero header ── */}
        <div className="space-y-2 pb-1 border-b border-border shrink-0">
          <div className="flex items-start gap-3">
            {IconComp && (
              <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                <IconComp className="h-6 w-6 text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <DialogHeader className="p-0 space-y-0.5">
                <DialogTitle className="font-display text-xl leading-tight text-foreground">{toolTitle}</DialogTitle>
                <DialogDescription className="text-sm text-primary font-medium italic">
                  {t.subtitle}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        <div className="space-y-4 mt-1 min-h-0 flex-1 overflow-y-auto pr-1">
          {/* ── Transcript input ── */}
          <div className="space-y-2">
            <Label className="font-medium">{t.inputLabel}</Label>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              rows={3}
            />
          </div>

          {/* ── Content type pills ── */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">{t.selectLabel}</Label>
            <div className="flex flex-wrap gap-2">
              {contentTypes.map(ct => {
                const active = selected.has(ct.id);
                const Icon = ct.icon;
                return (
                  <button
                    key={ct.id}
                    type="button"
                    onClick={() => toggleType(ct.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all
                      ${active
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                      }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {ct.label[lang]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Language selector ── */}
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
            <Label className="text-sm text-muted-foreground shrink-0">{t.genIn}</Label>
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

          {/* ── Generate button ── */}
          <Button
            onClick={handleGenerate}
            disabled={loading || !input.trim() || selected.size === 0}
            className="w-full gap-2 bg-primary text-primary-foreground"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {loading ? t.generating : t.generate}
          </Button>

          {/* ── Loading state ── */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 rounded-xl border border-border bg-card">
              <p className="text-sm text-primary font-medium animate-pulse">{t.working}</p>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-3 h-3 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="w-3 h-3 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: '450ms' }} />
              </div>
              <p className="text-xs text-muted-foreground">{t.eta}</p>
            </div>
          )}

          {/* ── Tabbed results ── */}
          {rawResult && activeTabs.length > 0 && (
            <div className="space-y-3">
              <Tabs defaultValue={activeTabs[0]?.id} className="w-full">
                <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${activeTabs.length}, 1fr)` }}>
                  {activeTabs.map(ct => {
                    const Icon = ct.icon;
                    return (
                      <TabsTrigger key={ct.id} value={ct.id} className="gap-1.5 text-xs sm:text-sm">
                        <Icon className="h-3.5 w-3.5 hidden sm:block" />
                        {t[tabKeyMap[ct.id] as keyof typeof t]}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {activeTabs.map(ct => (
                  <TabsContent key={ct.id} value={ct.id}>
                    <ScrollArea className="max-h-[40vh] min-h-0 rounded-lg bg-muted/30">
                      <div className="prose prose-sm pastoral-prose max-w-none p-5">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{sections[ct.id]}</ReactMarkdown>
                      </div>
                    </ScrollArea>
                    {renderTabActions(ct.id)}
                  </TabsContent>
                ))}
              </Tabs>

              <MaterialFeedback materialType="youtube-blog" materialTitle={toolTitle} toolId="youtube-blog" />
            </div>
          )}
        </div>

        {/* ── Expanded reader ── */}
        <Dialog open={expanded} onOpenChange={setExpanded}>
          <DialogContent className="theme-app max-w-4xl w-[95vw] max-h-[95vh] overflow-hidden flex flex-col bg-background text-foreground min-h-0">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">{toolTitle}</DialogTitle>
              <DialogDescription className="sr-only">{t.expandedTitle}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 min-h-0 bg-muted/20 rounded-lg">
              <div className="prose prose-base pastoral-prose max-w-none p-6 lg:p-8">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{sections[expandedTab]}</ReactMarkdown>
              </div>
            </ScrollArea>
            <div className="flex flex-wrap gap-2 pt-3 border-t border-border shrink-0">
              <Button size="sm" variant="outline" className="gap-1" onClick={() => handleCopy(sections[expandedTab])}>
                <Copy className="h-3 w-3" /> {t.copy}
              </Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => handleSave(sections[expandedTab], expandedTab)} disabled={saving}>
                <Save className="h-3 w-3" /> {t.save}
              </Button>
              <Button size="sm" variant="ghost" className="gap-1 ml-auto" onClick={() => setExpanded(false)}>
                <Minimize2 className="h-3 w-3" /> {t.close}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
