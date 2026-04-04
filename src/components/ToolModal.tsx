import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Loader2, Copy, Save, BookOpen, Wand2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { HistoricalSourcesCard } from '@/components/HistoricalSourcesCard';

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

  const config = toolConfigs[toolId];
  if (!config) return null;

  const langLabel = lang === 'PT' ? 'Portuguese (Brazilian)' : lang === 'EN' ? 'English' : 'Spanish';

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult('');
    setHistoricalSources(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-tool', {
        body: {
          systemPrompt: config.systemPrompt(langLabel),
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
    toast.success(lang === 'PT' ? 'Copiado!' : 'Copied!');
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
        language: lang,
      });
      if (error) throw error;
      toast.success(lang === 'PT' ? 'Salvo na Biblioteca!' : 'Saved to Library!');
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
      const { data: material, error: matErr } = await supabase
        .from('materials')
        .insert({
          user_id: user.id,
          title: `${toolTitle} — ${input.substring(0, 50)}`,
          type: 'blog_article',
          content: result,
          language: lang,
        })
        .select('id')
        .single();
      if (matErr) throw matErr;

      await supabase.from('editorial_queue').insert({
        user_id: user.id,
        material_id: material.id,
        status: 'published',
        published_at: new Date().toISOString(),
      });
      toast.success(lang === 'PT' ? 'Publicado no blog!' : 'Published to blog!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="theme-app max-w-2xl max-h-[85vh] overflow-y-auto bg-background text-foreground border-border">
        <DialogHeader>
          <DialogTitle className="font-display">{toolTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{config.inputLabel[lang]}</Label>
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

          <Button
            onClick={handleGenerate}
            disabled={loading || !input.trim()}
            className="w-full gap-2 bg-primary text-primary-foreground"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {lang === 'PT' ? 'Gerar' : lang === 'EN' ? 'Generate' : 'Generar'}
          </Button>

          {result && (
            <div className="space-y-3">
              <HistoricalSourcesCard sources={historicalSources} lang={lang} />
              <div className="prose prose-sm max-w-none bg-muted/30 rounded-lg p-4 max-h-[40vh] overflow-y-auto">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1" onClick={handleCopy}>
                  <Copy className="h-3 w-3" /> {lang === 'PT' ? 'Copiar' : 'Copy'}
                </Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={handleSave} disabled={saving}>
                  <Save className="h-3 w-3" /> {lang === 'PT' ? 'Salvar' : 'Save'}
                </Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={handlePublish} disabled={saving}>
                  <BookOpen className="h-3 w-3" /> {lang === 'PT' ? 'Publicar' : 'Publish'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
