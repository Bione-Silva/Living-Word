import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Loader2, Copy, Save, BookOpen, Wand2, FileText, RefreshCw, ThumbsUp, ThumbsDown, Library } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { HistoricalSourcesCard } from '@/components/HistoricalSourcesCard';

interface ToolSheetProps {
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
  edgeFunction?: string;
  toolParam?: string;
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
  'original-text': {
    inputLabel: { PT: 'Passagem bíblica', EN: 'Bible passage', ES: 'Pasaje bíblico' },
    placeholder: { PT: 'Ex: João 3:16', EN: 'E.g.: John 3:16', ES: 'Ej: Juan 3:16' },
    systemPrompt: (lang) => `You are a biblical language expert. Given a passage, show the original Greek or Hebrew text with transliteration, word-by-word analysis, and theological implications. Write in ${lang}.`,
  },
  'lexical': {
    inputLabel: { PT: 'Palavra ou passagem', EN: 'Word or passage', ES: 'Palabra o pasaje' },
    placeholder: { PT: 'Ex: agape, hesed, Filipenses 2:6', EN: 'E.g.: agape, hesed, Philippians 2:6', ES: 'Ej: ágape, hesed, Filipenses 2:6' },
    systemPrompt: (lang) => `You are a biblical lexicography expert. Analyze the original word(s), their roots, semantic range, usage across Scripture, and theological significance. Write in ${lang}.`,
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
  'illustrations': {
    inputLabel: { PT: 'Tema do sermão', EN: 'Sermon topic', ES: 'Tema del sermón' },
    placeholder: { PT: 'Ex: perdão, graça, transformação', EN: 'E.g.: forgiveness, grace, transformation', ES: 'Ej: perdón, gracia, transformación' },
    systemPrompt: (lang) => `You are a sermon illustration expert. Given a topic, provide 3-5 contemporary real-life stories and illustrations that a pastor can use in a sermon. Write in ${lang}.`,
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
  // Outreach tools
  'reels-script': {
    inputLabel: { PT: 'Tema ou versículo', EN: 'Topic or verse', ES: 'Tema o versículo' },
    placeholder: { PT: 'Ex: Filipenses 4:13', EN: 'E.g.: Philippians 4:13', ES: 'Ej: Filipenses 4:13' },
    systemPrompt: (lang) => `You are a social media content expert for churches. Create a 30-60 second Reels/TikTok script with hook, content and CTA. Include text overlay suggestions and hashtags. Write in ${lang}.`,
  },
  'cell-group': {
    inputLabel: { PT: 'Passagem ou tema', EN: 'Passage or topic', ES: 'Pasaje o tema' },
    placeholder: { PT: 'Ex: Romanos 12, comunidade', EN: 'E.g.: Romans 12, community', ES: 'Ej: Romanos 12, comunidad' },
    systemPrompt: (lang) => `You are a small group ministry expert. Create a complete cell/small group study plan: opening icebreaker, passage reading, 5 discussion questions, practical application, and closing prayer guide. Write in ${lang}.`,
  },
  'social-caption': {
    inputLabel: { PT: 'Tema ou versículo', EN: 'Topic or verse', ES: 'Tema o versículo' },
    placeholder: { PT: 'Ex: Esperança em meio à dor', EN: 'E.g.: Hope amid pain', ES: 'Ej: Esperanza en medio del dolor' },
    systemPrompt: (lang) => `You are a church social media manager. Create 5 Instagram/Facebook caption options with emojis, hashtags, and a call to action. Pastoral, warm tone. Write in ${lang}.`,
  },
  'newsletter': {
    inputLabel: { PT: 'Tema da semana', EN: 'Weekly topic', ES: 'Tema de la semana' },
    placeholder: { PT: 'Ex: Gratidão, eventos da igreja', EN: 'E.g.: Gratitude, church events', ES: 'Ej: Gratitud, eventos de la iglesia' },
    systemPrompt: (lang) => `You are a church communications specialist. Create a weekly church newsletter with greeting, devotional thought, upcoming events section, prayer requests section, and closing. Write in ${lang}.`,
  },
  'announcements': {
    inputLabel: { PT: 'Informações do culto', EN: 'Service info', ES: 'Información del culto' },
    placeholder: { PT: 'Ex: Culto de jovens sexta, bazar sábado', EN: 'E.g.: Youth service Friday, bazaar Saturday', ES: 'Ej: Culto de jóvenes viernes, bazar sábado' },
    systemPrompt: (lang) => `You are a church announcements writer. Given event info, create clear, warm, engaging announcements for the church bulletin/slides. Include date, time, and calls to action. Write in ${lang}.`,
  },
  // Fun & Dynamic tools
  'trivia': {
    inputLabel: { PT: 'Tema ou livro da Bíblia', EN: 'Topic or Bible book', ES: 'Tema o libro de la Biblia' },
    placeholder: { PT: 'Ex: Gênesis, milagres de Jesus', EN: 'E.g.: Genesis, miracles of Jesus', ES: 'Ej: Génesis, milagros de Jesús' },
    systemPrompt: (lang) => `You are a Bible trivia expert. Create 10 fun and challenging Bible trivia questions with 4 multiple-choice options each. Include the correct answer and a brief explanation. Mix easy and hard questions. Write in ${lang}.`,
  },
  'poetry': {
    inputLabel: { PT: 'Tema ou passagem', EN: 'Topic or passage', ES: 'Tema o pasaje' },
    placeholder: { PT: 'Ex: Salmo 23, amor de Deus', EN: 'E.g.: Psalm 23, God\'s love', ES: 'Ej: Salmo 23, amor de Dios' },
    systemPrompt: (lang) => `You are a Christian poet. Create a beautiful, heartfelt poem inspired by the given topic or passage. Use vivid imagery and theological depth. 12-20 lines. Write in ${lang}.`,
  },
  'kids-story': {
    inputLabel: { PT: 'História bíblica ou tema', EN: 'Bible story or topic', ES: 'Historia bíblica o tema' },
    placeholder: { PT: 'Ex: Noé e a Arca, amizade', EN: 'E.g.: Noah\'s Ark, friendship', ES: 'Ej: Noé y el Arca, amistad' },
    systemPrompt: (lang) => `You are a children's ministry storyteller. Create an engaging, age-appropriate (5-10 years) retelling of the Bible story or theme. Use simple language, fun characters, and a clear moral lesson. 300-400 words. Write in ${lang}.`,
  },
  'deep-translation': {
    inputLabel: { PT: 'Texto para tradução profunda', EN: 'Text for deep translation', ES: 'Texto para traducción profunda' },
    placeholder: { PT: 'Cole o texto aqui...', EN: 'Paste text here...', ES: 'Pega el texto aquí...' },
    systemPrompt: (lang) => `You are a theological translation expert. Translate the given text while preserving theological nuance, cultural context, and pastoral tone. Provide the translation and notes on key theological terms. Target language: ${lang}.`,
    useTextarea: true,
  },
};

export function ToolSheet({ open, onOpenChange, toolId, toolTitle }: ToolSheetProps) {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [historicalSources, setHistoricalSources] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [convertingToBlog, setConvertingToBlog] = useState(false);
  const [showBlogPrompt, setShowBlogPrompt] = useState(false);

  const config = toolConfigs[toolId] || {
    inputLabel: { PT: 'Descreva o que precisa', EN: 'Describe what you need', ES: 'Describe lo que necesitas' },
    placeholder: { PT: 'Ex: tema, passagem ou ideia...', EN: 'E.g.: topic, passage or idea...', ES: 'Ej: tema, pasaje o idea...' },
    systemPrompt: (lang: string) => `You are a helpful pastoral assistant. Given the user's input, generate useful, well-structured content for a Christian leader. Be creative, theologically sound, and practical. Write in ${lang}. Format with Markdown.`,
  };

  const langLabel = lang === 'PT' ? 'Portuguese (Brazilian)' : lang === 'EN' ? 'English' : 'Spanish';

  const isArticleTool = toolId === 'free-article' || toolId === 'youtube-blog';

  const resetForm = () => {
    setResult('');
    setInput('');
    setShowBlogPrompt(false);
    setHistoricalSources(null);
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult('');
    setShowBlogPrompt(false);
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
      // Show blog prompt for non-article tools
      if (!isArticleTool) {
        setShowBlogPrompt(true);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error generating content');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast.success(lang === 'PT' ? 'Copiado!' : 'Copied!');
    resetForm();
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
      resetForm();
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
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConvertToBlog = async () => {
    if (!result) return;
    setConvertingToBlog(true);
    setShowBlogPrompt(false);
    try {
      const blogPrompt = `Transform the following study/content into a complete, well-structured blog article in Markdown format (600-800 words). Include:
- An engaging H1 title
- A warm introduction paragraph
- 2-3 sections with H2 headings
- A powerful conclusion
- A sharing call-to-action at the end in italics

The tone should be pastoral, warm, and accessible. Write in ${langLabel}.

Original content to transform:
${result}`;

      const { data, error } = await supabase.functions.invoke('ai-tool', {
        body: {
          systemPrompt: `You are a professional Christian blog writer. Transform studies, devotionals, and pastoral content into beautifully structured blog articles. Write in ${langLabel}. Always use Markdown formatting.`,
          userPrompt: blogPrompt,
        },
      });
      if (error) throw error;
      setResult(data?.content || result);
      toast.success(lang === 'PT' ? 'Artigo de blog gerado!' : 'Blog article generated!');
    } catch (err: any) {
      toast.error(err.message || 'Error converting to blog');
    } finally {
      setConvertingToBlog(false);
    }
  };

  const handleSheetClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleSheetClose}>
      <SheetContent side="right" className="theme-app w-full sm:max-w-lg overflow-y-auto bg-background text-foreground border-l border-border">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">{toolTitle}</SheetTitle>
          <SheetDescription className="sr-only">
            {lang === 'PT' ? 'Ferramenta pastoral' : 'Pastoral tool'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
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
              <div className="prose prose-sm max-w-none bg-muted/30 rounded-lg p-4 max-h-[50vh] overflow-y-auto">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>

              {/* Blog conversion prompt for non-article tools */}
              {showBlogPrompt && !isArticleTool && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    {lang === 'PT' ? '✨ Gostou? Quer transformar isso num artigo de blog?' :
                     lang === 'EN' ? '✨ Liked it? Want to turn this into a blog article?' :
                     '✨ ¿Te gustó? ¿Quieres convertirlo en un artículo de blog?'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="gap-1 bg-primary text-primary-foreground"
                      onClick={handleConvertToBlog}
                      disabled={convertingToBlog}
                    >
                      {convertingToBlog ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                      {lang === 'PT' ? 'Sim, gerar artigo!' : 'Yes, generate article!'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={handleGenerate}
                      disabled={loading}
                    >
                      <RefreshCw className="h-3 w-3" />
                      {lang === 'PT' ? 'Melhorar' : 'Improve'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1"
                      onClick={() => setShowBlogPrompt(false)}
                    >
                      {lang === 'PT' ? 'Não, obrigado' : 'No, thanks'}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="gap-1" onClick={handleCopy}>
                  <Copy className="h-3 w-3" /> {lang === 'PT' ? 'Copiar' : 'Copy'}
                </Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={handleSave} disabled={saving}>
                  <Save className="h-3 w-3" /> {lang === 'PT' ? 'Salvar' : 'Save'}
                </Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={handlePublish} disabled={saving}>
                  <BookOpen className="h-3 w-3" /> {lang === 'PT' ? 'Publicar' : 'Publish'}
                </Button>
                <Button size="sm" variant="ghost" className="gap-1 ml-auto" onClick={resetForm}>
                  <RefreshCw className="h-3 w-3" /> {lang === 'PT' ? 'Novo' : 'New'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
