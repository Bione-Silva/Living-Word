import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Loader2, Copy, Save, BookOpen, Wand2, Globe, Maximize2, Minimize2, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HistoricalSourcesCard } from '@/components/HistoricalSourcesCard';
import { MaterialFeedback } from '@/components/MaterialFeedback';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { helpCategories, helpFullArticles } from '@/data/help-center-data';
import { YouTubeMultiplierModal } from '@/components/YouTubeMultiplierModal';
import type { Language } from '@/lib/i18n';

interface ToolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolId: string;
  toolTitle: string;
}

const toolConfigs: Record<string, {
  inputLabel: { PT: string; EN: string; ES: string };
  placeholder: { PT: string; EN: string; ES: string };
  systemPrompt: (lang: string) => string;
  useTextarea?: boolean;
}> = {
  'topic-explorer': {
    inputLabel: { PT: 'Tema ou passagem', EN: 'Topic or passage', ES: 'Tema o pasaje' },
    placeholder: { PT: 'Ex: Graça, Perdão, Romanos 8', EN: 'E.g.: Grace, Forgiveness, Romans 8', ES: 'Ej: Gracia, Perdón, Romanos 8' },
    systemPrompt: (lang) => `You are a pastoral research assistant. Given a topic or Bible passage, return 5-7 subtopics and angles a pastor could explore in a sermon. Write in ${lang}. Format as a numbered list with brief explanations.`,
  },
  'verse-finder': {
    inputLabel: { PT: 'Tema ou palavra-chave', EN: 'Topic or keyword', ES: 'Tema o palabra clave' },
    placeholder: { PT: 'Ex: esperança, fidelidade, amor', EN: 'E.g.: hope, faithfulness, love', ES: 'Ej: esperanza, fidelidad, amor' },
    systemPrompt: (lang) => `You are a Bible verse expert. Given a topic, return 8-10 relevant Bible verses with the reference and a brief explanation of how each relates to the topic. Write in ${lang}.`,
  },
  'historical-context': {
    inputLabel: { PT: 'Passagem bíblica', EN: 'Bible passage', ES: 'Pasaje bíblico' },
    placeholder: { PT: 'Ex: Mateus 5:1-12', EN: 'E.g.: Matthew 5:1-12', ES: 'Ej: Mateo 5:1-12' },
    systemPrompt: (lang) => `You are a Bible scholar. Given a passage, provide the historical, cultural, and literary context. Include the author, audience, date, geographic setting, and cultural practices. Write in ${lang}.`,
  },
  'quote-finder': {
    inputLabel: { PT: 'Tema da citação', EN: 'Quote topic', ES: 'Tema de la cita' },
    placeholder: { PT: 'Ex: perseverança, oração', EN: 'E.g.: perseverance, prayer', ES: 'Ej: perseverancia, oración' },
    systemPrompt: (lang) => `You are a Christian literature expert. Given a topic, return 5-8 quotes from theologians, Christian authors, and church fathers. Include the author name and source. Write in ${lang}.`,
  },
  'movie-scenes': {
    inputLabel: { PT: 'Tema do sermão', EN: 'Sermon topic', ES: 'Tema del sermón' },
    placeholder: { PT: 'Ex: redenção, sacrifício, perdão', EN: 'E.g.: redemption, sacrifice, forgiveness', ES: 'Ej: redención, sacrificio, perdón' },
    systemPrompt: (lang) => `You are a film and sermon illustration expert. Given a sermon topic, suggest 3-5 movie scenes that illustrate the theme. Include movie title, year, scene description, and how to connect it to the sermon. Write in ${lang}.`,
  },
  'title-gen': {
    inputLabel: { PT: 'Tema ou passagem do sermão', EN: 'Sermon topic or passage', ES: 'Tema o pasaje del sermón' },
    placeholder: { PT: 'Ex: Salmo 23, superação', EN: 'E.g.: Psalm 23, overcoming', ES: 'Ej: Salmo 23, superación' },
    systemPrompt: (lang) => `You are a creative sermon title generator. Given a topic or passage, generate 10 creative, compelling sermon titles. Mix different styles: provocative questions, declarations, metaphors, pop culture references. Write in ${lang}.`,
  },
  'metaphor-creator': {
    inputLabel: { PT: 'Conceito bíblico ou tema', EN: 'Biblical concept or topic', ES: 'Concepto bíblico o tema' },
    placeholder: { PT: 'Ex: santificação, fé, graça', EN: 'E.g.: sanctification, faith, grace', ES: 'Ej: santificación, fe, gracia' },
    systemPrompt: (lang) => `You are a metaphor and analogy expert for pastoral communication. Given a concept, create 5 powerful, modern metaphors and analogies a pastor can use in a sermon. Include the metaphor and a brief explanation of how to use it. Write in ${lang}.`,
  },
  'bible-modernizer': {
    inputLabel: { PT: 'História bíblica', EN: 'Bible story', ES: 'Historia bíblica' },
    placeholder: { PT: 'Ex: O Bom Samaritano, Davi e Golias', EN: 'E.g.: The Good Samaritan, David and Goliath', ES: 'Ej: El Buen Samaritano, David y Goliat' },
    systemPrompt: (lang) => `You are a creative Christian storyteller. Given a Bible story, recontextualize it in a modern setting while preserving the theological message. Write a 300-400 word modern retelling. Write in ${lang}.`,
  },
  'free-article': {
    inputLabel: { PT: 'Tema ou ideia para o artigo', EN: 'Article topic or idea', ES: 'Tema o idea para el artículo' },
    placeholder: { PT: 'Ex: Como manter a fé em tempos difíceis', EN: 'E.g.: How to keep faith in hard times', ES: 'Ej: Cómo mantener la fe en tiempos difíciles' },
    systemPrompt: (lang) => `You are a Christian blog writer. Given a topic, write a complete blog article in Markdown (600-800 words) with H1 title, introduction, 2-3 sections with H2 headings, and conclusion. Warm, accessible, theologically sound. Write in ${lang}.`,
    useTextarea: true,
  },
  'youtube-blog': {
    inputLabel: { PT: 'Cole a transcrição do vídeo', EN: 'Paste the video transcript', ES: 'Pega la transcripción del video' },
    placeholder: { PT: 'Cole aqui a transcrição completa ou os pontos-chave do vídeo do YouTube...', EN: 'Paste here the full transcript or key points from the YouTube video...', ES: 'Pega aquí la transcripción completa o los puntos clave del video de YouTube...' },
    systemPrompt: (lang) => `You are a content repurposing specialist. The user will paste a video transcript or key points. Transform this content into a well-structured, SEO-friendly blog article in Markdown format (600-800 words) with H1 title, introduction, 2-3 sections with H2 headings, and conclusion. Write in ${lang}.`,
    useTextarea: true,
  },
};

export function ToolModal({ open, onOpenChange, toolId, toolTitle }: ToolModalProps) {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [historicalSources, setHistoricalSources] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [generationLang, setGenerationLang] = useState<Language>(lang);

  useEffect(() => {
    setGenerationLang(lang);
  }, [lang]);

  if (toolId === 'youtube-blog') {
    return <YouTubeMultiplierModal open={open} onOpenChange={onOpenChange} toolTitle={toolTitle} />;
  }

  const config = toolConfigs[toolId] || {
    inputLabel: { PT: 'Descreva o que precisa', EN: 'Describe what you need', ES: 'Describe lo que necesitas' },
    placeholder: { PT: 'Ex: tema, passagem ou ideia...', EN: 'E.g.: topic, passage or idea...', ES: 'Ej: tema, pasaje o idea...' },
    systemPrompt: (l: string) => `You are a helpful pastoral assistant. Given the user's input, generate useful, well-structured content for a Christian leader. Be creative, theologically sound, and practical. Write in ${l}. Format with Markdown.`,
  };

  const genLangLabel = generationLang === 'PT' ? 'Portuguese (Brazilian)' : generationLang === 'EN' ? 'English' : 'Spanish';

  const resetForm = () => {
    setResult('');
    setInput('');
    setHistoricalSources(null);
    setGenerationLang(lang);
  };

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult('');
    setHistoricalSources(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-tool', {
        body: {
          systemPrompt: config.systemPrompt(genLangLabel),
          userPrompt: input,
        },
      });
      if (error) throw error;
      setResult(data?.content || 'No response');
      setHistoricalSources(data?.historical_sources_used || null);
    } catch (err: any) {
      toast.error(err.message || 'Error generating content');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast.success(lang === 'PT' ? 'Copiado!' : lang === 'EN' ? 'Copied!' : '¡Copiado!');
  };

  const handleSave = async () => {
    if (!user || !result) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('materials').insert({
        user_id: user.id,
        title: `${toolTitle} — ${input.substring(0, 50)}`,
        type: toolId,
        content: result,
        language: generationLang,
      });
      if (error) throw error;
      toast.success(lang === 'PT' ? 'Salvo na Biblioteca!' : lang === 'EN' ? 'Saved to Library!' : '¡Guardado en Biblioteca!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!user || !result) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-article', {
        body: {
          passage: input,
          language: generationLang,
          title: `${toolTitle} — ${input.substring(0, 50)}`,
          source_content: result,
          source_type: toolId,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Unknown error');

      await supabase.from('editorial_queue').insert({
        user_id: user.id,
        material_id: data.material_id,
        status: 'published',
        published_at: new Date().toISOString(),
      });
      toast.success(lang === 'PT' ? 'Publicado no blog com imagens!' : lang === 'EN' ? 'Published to blog with images!' : '¡Publicado en el blog con imágenes!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="theme-app max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto bg-background text-foreground min-h-0 max-md:w-full max-md:h-full max-md:max-h-full max-md:rounded-none max-md:m-0">
        {/* ── Help hero header ── */}
        {(() => {
          const article = helpFullArticles.find(a => a.toolId === toolId);
          const toolCard = helpCategories.flatMap(c => c.tools).find(t => t.id === toolId);
          const IconComp = article?.icon || toolCard?.icon;
          const subtitle = article?.subtitle?.[lang] || toolCard?.description?.[lang] || '';
          const summary = article?.heroSummary?.[lang] || '';
          const bullets = article?.heroBullets || [];

          return (
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
                    {subtitle && (
                      <DialogDescription className="text-sm text-primary font-medium italic">
                        {subtitle}
                      </DialogDescription>
                    )}
                  </DialogHeader>
                </div>
              </div>

              {summary && (
                <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>
              )}

              {bullets.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {bullets.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground/80">
                      <Zap className="h-3 w-3 text-primary shrink-0" />
                      <span className="leading-snug">{b[lang]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        <div className="space-y-4 mt-1 min-h-0">
          <div className="space-y-2">
            <Label className="font-medium">{config.inputLabel[lang]}</Label>
            {config.useTextarea ? (
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={config.placeholder[lang]}
                rows={3}
              />
            ) : (
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={config.placeholder[lang]}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
            )}
          </div>

          {/* Generation language selector */}
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
            <Label className="text-sm text-muted-foreground shrink-0">
              {lang === 'PT' ? 'Gerar em:' : lang === 'EN' ? 'Generate in:' : 'Generar en:'}
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
            disabled={loading || !input.trim()}
            className="w-full gap-2 bg-primary text-primary-foreground"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {loading
              ? (lang === 'PT' ? 'Expandindo narrativa e pintando ilustrações (~20s)...' :
                 lang === 'EN' ? 'Expanding narrative and painting illustrations (~20s)...' :
                 'Expandiendo narrativa y pintando ilustraciones (~20s)...')
              : (lang === 'PT' ? 'Gerar' : lang === 'EN' ? 'Generate' : 'Generar')}
          </Button>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 rounded-xl border border-border bg-card">
              <p className="text-sm text-primary font-medium animate-pulse">
                {lang === 'PT' ? 'Trabalhando nisso...' : lang === 'EN' ? 'Working on it...' : 'Trabajando en eso...'}
              </p>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-3 h-3 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="w-3 h-3 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: '450ms' }} />
              </div>
              <p className="text-xs text-muted-foreground">
                {lang === 'PT' ? 'Geralmente completa em 1 minuto ou menos' : lang === 'EN' ? 'Requests typically complete in 1 minute or less' : 'Normalmente completa en 1 minuto o menos'}
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <HistoricalSourcesCard sources={historicalSources} lang={lang} />

              <div className="relative">
                <ScrollArea className="max-h-[50vh] min-h-0 rounded-lg bg-muted/30">
                  <div className="prose prose-sm pastoral-prose max-w-none p-5">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                  </div>
                </ScrollArea>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 gap-1 bg-background/80 backdrop-blur-sm"
                  onClick={() => setExpanded(true)}
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  {lang === 'PT' ? 'Expandir' : lang === 'EN' ? 'Expand' : 'Expandir'}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="gap-1" onClick={handleCopy}>
                  <Copy className="h-3 w-3" /> {lang === 'PT' ? 'Copiar' : lang === 'EN' ? 'Copy' : 'Copiar'}
                </Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={handleSave} disabled={saving}>
                  <Save className="h-3 w-3" /> {lang === 'PT' ? 'Salvar' : lang === 'EN' ? 'Save' : 'Guardar'}
                </Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={handlePublish} disabled={saving}>
                  <BookOpen className="h-3 w-3" /> {lang === 'PT' ? 'Publicar' : lang === 'EN' ? 'Publish' : 'Publicar'}
                </Button>
              </div>

              <MaterialFeedback
                materialType={toolId}
                materialTitle={toolTitle}
                toolId={toolId}
              />
            </div>
          )}

          {/* Expanded reader dialog */}
          <Dialog open={expanded} onOpenChange={setExpanded}>
            <DialogContent className="theme-app max-w-4xl w-[95vw] max-h-[95vh] overflow-hidden flex flex-col bg-background text-foreground min-h-0">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{toolTitle}</DialogTitle>
                <DialogDescription className="sr-only">
                  {lang === 'PT' ? 'Leitura expandida' : 'Expanded reading'}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="flex-1 min-h-0 bg-muted/20 rounded-lg">
                <div className="prose prose-base pastoral-prose max-w-none p-6 lg:p-8">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                </div>
              </ScrollArea>
              <div className="flex flex-wrap gap-2 pt-3 border-t border-border shrink-0">
                <Button size="sm" variant="outline" className="gap-1" onClick={handleCopy}>
                  <Copy className="h-3 w-3" /> {lang === 'PT' ? 'Copiar' : lang === 'EN' ? 'Copy' : 'Copiar'}
                </Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={handleSave} disabled={saving}>
                  <Save className="h-3 w-3" /> {lang === 'PT' ? 'Salvar' : lang === 'EN' ? 'Save' : 'Guardar'}
                </Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={handlePublish} disabled={saving}>
                  <BookOpen className="h-3 w-3" /> {lang === 'PT' ? 'Publicar' : lang === 'EN' ? 'Publish' : 'Publicar'}
                </Button>
                <Button size="sm" variant="ghost" className="gap-1 ml-auto" onClick={() => setExpanded(false)}>
                  <Minimize2 className="h-3 w-3" /> {lang === 'PT' ? 'Fechar' : lang === 'EN' ? 'Close' : 'Cerrar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DialogContent>
    </Dialog>
  );
}
