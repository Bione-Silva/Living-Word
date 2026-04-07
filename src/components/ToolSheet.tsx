import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Loader2, Copy, Save, BookOpen, Wand2, FileText, RefreshCw, ThumbsUp, ThumbsDown, Library, Globe, Maximize2, Minimize2, ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HistoricalSourcesCard } from '@/components/HistoricalSourcesCard';
import { MaterialFeedback } from '@/components/MaterialFeedback';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Language } from '@/lib/i18n';
import { PastoralStudioModal } from '@/components/PastoralStudioModal';
import { helpCategories, helpFullArticles } from '@/data/help-center-data';
import { Zap } from 'lucide-react';
import { BlogArticleEditorDialog } from '@/components/BlogArticleEditorDialog';
import { EditableBlogArticle } from '@/lib/blog-article';
import { YouTubeMultiplierModal } from '@/components/YouTubeMultiplierModal';

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
  'trivia': {
    inputLabel: { PT: 'Tema ou livro da Bíblia', EN: 'Topic or Bible book', ES: 'Tema o libro de la Biblia' },
    placeholder: { PT: 'Ex: Gênesis, milagres de Jesus', EN: 'E.g.: Genesis, miracles of Jesus', ES: 'Ej: Génesis, milagros de Jesús' },
    systemPrompt: (lang) => `You are a Bible trivia expert. Create 10 fun and challenging Bible trivia questions with 4 multiple-choice options each (A, B, C, D). IMPORTANT: Do NOT use bold or any formatting to highlight the correct answer within the options — all options must look identical. After the 4 options, write "Resposta:" followed by the correct letter and a brief explanation. Mix easy and hard questions. Write in ${lang}.`,
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
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [historicalSources, setHistoricalSources] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [convertingToBlog, setConvertingToBlog] = useState(false);
  const [imageStyle, setImageStyle] = useState<'oil' | 'watercolor' | 'minimalist'>('oil');
  const [generationLang, setGenerationLang] = useState<Language>(lang);
  const [expanded, setExpanded] = useState(false);
  const [blogArticle, setBlogArticle] = useState<EditableBlogArticle | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [publishingArticle, setPublishingArticle] = useState(false);
  const [archivingArticle, setArchivingArticle] = useState(false);
  const [deletingArticle, setDeletingArticle] = useState(false);

  // Sync generation language when platform language changes
  useEffect(() => {
    setGenerationLang(lang);
  }, [lang]);

  if (toolId === 'studio') {
    return <PastoralStudioModal open={open} onOpenChange={onOpenChange} toolTitle={toolTitle} />;
  }

  if (toolId === 'youtube-blog') {
    return <YouTubeMultiplierModal open={open} onOpenChange={onOpenChange} toolTitle={toolTitle} />;
  }

  const config = toolConfigs[toolId] || {
    inputLabel: { PT: 'Descreva o que precisa', EN: 'Describe what you need', ES: 'Describe lo que necesitas' },
    placeholder: { PT: 'Ex: tema, passagem ou ideia...', EN: 'E.g.: topic, passage or idea...', ES: 'Ej: tema, pasaje o idea...' },
    systemPrompt: (lang: string) => `You are a helpful pastoral assistant. Given the user's input, generate useful, well-structured content for a Christian leader. Be creative, theologically sound, and practical. Write in ${lang}. Format with Markdown.`,
  };

  const genLangLabel = generationLang === 'PT' ? 'Portuguese (Brazilian)' : generationLang === 'EN' ? 'English' : 'Spanish';

  const isArticleTool = toolId === 'free-article' || toolId === 'youtube-blog';

  const resetForm = () => {
    setResult('');
    setInput('');
    setHistoricalSources(null);
    setGenerationLang(lang);
    setBlogArticle(null);
    setEditorOpen(false);
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult('');
    setHistoricalSources(null);
    try {
      if (isArticleTool) {
        // Article tools go through the dedicated blog edge function
        const { data, error } = await supabase.functions.invoke('generate-blog-article', {
          body: {
            passage: input,
            language: generationLang,
            title: toolId === 'youtube-blog' ? undefined : undefined,
            image_style: imageStyle,
            ...(toolId === 'youtube-blog' ? { source_content: input, source_type: 'youtube-blog' } : {}),
          },
        });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Unknown error');
        setResult(data.content || '');
        // Pre-populate blog article for editor
        setBlogArticle({
          id: data.material_id,
          title: data.title || '',
          content: data.content || '',
          passage: data.passage || input,
          cover_image_url: data.cover_image_url || null,
          article_images: data.article_images || null,
          queue_status: 'draft',
          queue_id: null,
          language: data.language || generationLang,
        });
      } else {
        const { data, error } = await supabase.functions.invoke('ai-tool', {
          body: {
            systemPrompt: config.systemPrompt(genLangLabel),
            userPrompt: input,
          },
        });
        if (error) throw error;
        setResult(data?.content || 'No response');
        setHistoricalSources(data?.historical_sources_used || null);
      }
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
      if (isArticleTool) {
        // Route through edge function to generate images
        const { data, error } = await supabase.functions.invoke('generate-blog-article', {
          body: {
            passage: input,
            language: generationLang,
            title: `${toolTitle} — ${input.substring(0, 50)}`,
            image_style: imageStyle,
            source_content: result,
            source_type: toolId,
          },
        });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Unknown error');

        // Publish immediately
        await supabase.from('editorial_queue').insert({
          user_id: user.id,
          material_id: data.material_id,
          status: 'published',
          published_at: new Date().toISOString(),
        });
        toast.success(lang === 'PT' ? 'Publicado no blog com imagens!' : lang === 'EN' ? 'Published to blog with images!' : '¡Publicado en el blog con imágenes!');
      } else {
        const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('generate-blog-article', {
          body: {
            passage: input,
            language: generationLang,
            title: `${toolTitle} — ${input.substring(0, 50)}`,
            source_content: result,
            source_type: toolId,
          },
        });
        if (edgeErr) throw edgeErr;
        if (!edgeData?.success) throw new Error(edgeData?.error || 'Unknown error');

        await supabase.from('editorial_queue').insert({
          user_id: user.id,
          material_id: edgeData.material_id,
          status: 'published',
          published_at: new Date().toISOString(),
        });
        toast.success(lang === 'PT' ? 'Publicado no blog com imagens!' : lang === 'EN' ? 'Published to blog with images!' : '¡Publicado en el blog con imágenes!');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConvertToBlog = async () => {
    if (!result || !user) return;
    setConvertingToBlog(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-article', {
        body: {
          passage: input,
          language: generationLang,
          title: `${toolTitle} — ${input.substring(0, 50)}`,
          image_style: imageStyle,
          source_content: result,
          source_type: toolId,
        },
      });
      if (error) throw error;
      if (data?.success) {
        setBlogArticle({
          id: data.material_id,
          title: data.title,
          content: data.content,
          passage: data.passage,
          cover_image_url: data.cover_image_url,
          article_images: data.article_images,
          queue_status: 'draft',
          queue_id: null,
          language: data.language,
        });
        setEditorOpen(true);
        toast.success(lang === 'PT' ? 'Artigo completo gerado e pronto para edição.' : lang === 'EN' ? 'Full article generated and ready to edit.' : 'Artículo completo generado y listo para editar.');
      } else {
        throw new Error(data?.error || 'Unknown error');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error converting to blog');
    } finally {
      setConvertingToBlog(false);
    }
  };

  const handleSaveBlogArticle = async () => {
    if (!blogArticle) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('materials')
        .update({ title: blogArticle.title, content: blogArticle.content, updated_at: new Date().toISOString() })
        .eq('id', blogArticle.id);
      if (error) throw error;
      toast.success(lang === 'PT' ? 'Artigo salvo.' : lang === 'EN' ? 'Article saved.' : 'Artículo guardado.');
    } catch (err: any) {
      toast.error(err.message || 'Error saving article');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishBlogArticle = async () => {
    if (!blogArticle || !user) return;
    setPublishingArticle(true);
    try {
      if (blogArticle.queue_id) {
        const { error } = await supabase
          .from('editorial_queue')
          .update({ status: 'published', published_at: new Date().toISOString() })
          .eq('id', blogArticle.queue_id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('editorial_queue')
          .insert({
            user_id: user.id,
            material_id: blogArticle.id,
            status: 'published',
            published_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        if (error) throw error;
        setBlogArticle({ ...blogArticle, queue_id: data.id });
      }
      setBlogArticle((current) => current ? { ...current, queue_status: 'published' } : current);
      toast.success(lang === 'PT' ? 'Artigo publicado no blog.' : lang === 'EN' ? 'Article published to blog.' : 'Artículo publicado en el blog.');
    } catch (err: any) {
      toast.error(err.message || 'Error publishing article');
    } finally {
      setPublishingArticle(false);
    }
  };

  const handleArchiveBlogArticle = async () => {
    if (!blogArticle || !user) return;
    setArchivingArticle(true);
    try {
      const nextStatus = blogArticle.queue_status === 'archived' ? 'published' : 'archived';
      if (blogArticle.queue_id) {
        const { error } = await supabase
          .from('editorial_queue')
          .update({ status: nextStatus, published_at: nextStatus === 'published' ? new Date().toISOString() : null })
          .eq('id', blogArticle.queue_id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('editorial_queue')
          .insert({
            user_id: user.id,
            material_id: blogArticle.id,
            status: nextStatus,
            published_at: nextStatus === 'published' ? new Date().toISOString() : null,
          })
          .select('id')
          .single();
        if (error) throw error;
        setBlogArticle({ ...blogArticle, queue_id: data.id });
      }
      setBlogArticle((current) => current ? { ...current, queue_status: nextStatus } : current);
      toast.success(lang === 'PT' ? 'Status do artigo atualizado.' : lang === 'EN' ? 'Article status updated.' : 'Estado del artículo actualizado.');
    } catch (err: any) {
      toast.error(err.message || 'Error updating article');
    } finally {
      setArchivingArticle(false);
    }
  };

  const handleDeleteBlogArticle = async () => {
    if (!blogArticle) return;
    setDeletingArticle(true);
    try {
      if (blogArticle.queue_id) {
        await supabase.from('editorial_queue').delete().eq('id', blogArticle.queue_id);
      }
      const { error } = await supabase.from('materials').delete().eq('id', blogArticle.id);
      if (error) throw error;
      setEditorOpen(false);
      setBlogArticle(null);
      toast.success(lang === 'PT' ? 'Artigo excluído.' : lang === 'EN' ? 'Article deleted.' : 'Artículo eliminado.');
    } catch (err: any) {
      toast.error(err.message || 'Error deleting article');
    } finally {
      setDeletingArticle(false);
    }
  };

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="theme-app max-w-2xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col bg-background text-foreground min-h-0 max-md:w-full max-md:h-full max-md:max-h-full max-md:rounded-none max-md:m-0">
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

        <div className="space-y-4 mt-1 min-h-0 flex-1 overflow-y-auto pr-1">
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
                <ScrollArea className="h-[50vh] min-h-0 rounded-lg bg-muted/30">
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
                <Button size="sm" variant="ghost" className="gap-1 ml-auto" onClick={resetForm}>
                  <RefreshCw className="h-3 w-3" /> {lang === 'PT' ? 'Novo' : lang === 'EN' ? 'New' : 'Nuevo'}
                </Button>
              </div>

              {/* CTA: Reels → Social Studio */}
              {toolId === 'reels-script' && result && (
                <Button
                  size="lg"
                  className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                  onClick={() => {
                    // Extract text overlay / scene phrases from the reels script
                    const lines = result.split('\n').filter(l => l.trim().length > 0);
                    const scenes: string[] = [];

                    // Try to extract "Texto Overlay" or bold phrases from the table/script
                    for (const line of lines) {
                      // Match bold text like **"phrase"** or **phrase**
                      const boldMatches = line.match(/\*\*"?([^*"]+)"?\*\*/g);
                      if (boldMatches) {
                        for (const m of boldMatches) {
                          const clean = m.replace(/\*\*/g, '').replace(/^"|"$/g, '').trim();
                          if (clean.length > 10 && clean.length < 200) {
                            scenes.push(clean);
                          }
                        }
                      }
                      // Match quoted text
                      const quoteMatches = line.match(/"([^"]{10,150})"/g);
                      if (quoteMatches) {
                        for (const m of quoteMatches) {
                          const clean = m.replace(/^"|"$/g, '').trim();
                          if (!scenes.includes(clean) && clean.length > 10) {
                            scenes.push(clean);
                          }
                        }
                      }
                    }

                    // Fallback: use first meaningful paragraphs
                    if (scenes.length === 0) {
                      const paragraphs = result
                        .split(/\n{2,}/)
                        .map(p => p.replace(/^#+\s*/gm, '').replace(/\*\*/g, '').trim())
                        .filter(p => p.length > 20 && p.length < 200);
                      scenes.push(...paragraphs.slice(0, 5));
                    }

                    const uniqueScenes = [...new Set(scenes)].slice(0, 6);

                    onOpenChange(false);
                    navigate('/social-studio', {
                      state: {
                        prefilledSlides: uniqueScenes.map((text, i) => ({
                          text,
                          subtitle: i === 0 ? input : undefined,
                          slideNumber: i + 1,
                          totalSlides: uniqueScenes.length,
                        })),
                        defaultTab: 'carousel',
                        defaultAspectRatio: '9:16' as const,
                      },
                    });
                  }}
                >
                  <ImageIcon className="h-5 w-5" />
                  {lang === 'PT'
                    ? '🎨 Transformar Cenas em Imagens (Estúdio Social)'
                    : lang === 'EN'
                    ? '🎨 Transform Scenes into Images (Social Studio)'
                    : '🎨 Transformar Escenas en Imágenes (Estudio Social)'}
                </Button>
              )}

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

          <BlogArticleEditorDialog
            open={editorOpen}
            onOpenChange={setEditorOpen}
            article={blogArticle}
            onArticleChange={setBlogArticle}
            onSave={handleSaveBlogArticle}
            onPublish={handlePublishBlogArticle}
            onArchive={handleArchiveBlogArticle}
            onDelete={handleDeleteBlogArticle}
            lang={lang}
            saving={saving}
            publishing={publishingArticle}
            archiving={archivingArticle}
            deleting={deletingArticle}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
