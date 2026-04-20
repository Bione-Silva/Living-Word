import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search, Sparkles, Loader2, BookOpen, MessageSquare, Video,
  Feather, Megaphone, Type, Copy, Check
} from 'lucide-react';
import { toast } from 'sonner';

type L = 'PT' | 'EN' | 'ES';

const labels: Record<string, Record<L, string>> = {
  verseTitle: { PT: '📖 Versículo', EN: '📖 Verse', ES: '📖 Versículo' },
  versePlaceholder: { PT: 'Ex: João 3:16', EN: 'E.g.: John 3:16', ES: 'Ej: Juan 3:16' },
  search: { PT: 'Buscar', EN: 'Search', ES: 'Buscar' },
  surprise: { PT: '✨ Versículo Surpresa', EN: '✨ Surprise Verse', ES: '✨ Versículo Sorpresa' },
  searching: { PT: 'Buscando...', EN: 'Searching...', ES: 'Buscando...' },
  contentTitle: { PT: '✍️ Gerar Conteúdo', EN: '✍️ Generate Content', ES: '✍️ Generar Contenido' },
  contentDesc: { PT: 'Crie textos para suas redes sociais com IA', EN: 'Create social media texts with AI', ES: 'Crea textos para tus redes sociales con IA' },
  topicPlaceholder: { PT: 'Tema ou passagem (Ex: "Gratidão", "Salmo 23")', EN: 'Topic or passage (E.g. "Gratitude", "Psalm 23")', ES: 'Tema o pasaje (Ej: "Gratitud", "Salmo 23")' },
  generate: { PT: 'Gerar', EN: 'Generate', ES: 'Generar' },
  generating: { PT: 'Gerando...', EN: 'Generating...', ES: 'Generando...' },
  caption: { PT: 'Legenda Social', EN: 'Social Caption', ES: 'Leyenda Social' },
  reels: { PT: 'Roteiro Reels', EN: 'Reels Script', ES: 'Guión Reels' },
  poetry: { PT: 'Poesia Cristã', EN: 'Christian Poetry', ES: 'Poesía Cristiana' },
  announcement: { PT: 'Avisos', EN: 'Announcements', ES: 'Avisos' },
  copied: { PT: 'Copiado!', EN: 'Copied!', ES: '¡Copiado!' },
  useOnCanvas: { PT: 'Usar no Canvas', EN: 'Use on Canvas', ES: 'Usar en Canvas' },
};

const contentTools = [
  { id: 'social-caption', icon: MessageSquare, labelKey: 'caption', tool: 'social-caption' },
  { id: 'reels-script', icon: Video, labelKey: 'reels', tool: 'reels-script' },
  { id: 'poetry', icon: Feather, labelKey: 'poetry', tool: 'poetry' },
  { id: 'announcements', icon: Megaphone, labelKey: 'announcement', tool: 'announcements' },
];

// Map UI tool IDs to search-pastoral-tools backend tool names
const TOOL_MAP: Record<string, string> = {
  'social-caption': 'social_caption',
  'reels-script': 'reels_script',
  'poetry': 'poetry',
  'announcements': 'announcements',
};

interface VerseResult {
  text: string;
  book: string;
  topic_image: string;
}

interface Props {
  onVerseGenerated: (verse: VerseResult) => void;
  onTextGenerated: (text: string) => void;
  /** Tema/título pré-carregado (sermão, versículo, devocional vindos de outras telas). */
  prefillTopic?: string;
}

export function ContentGenerator({ onVerseGenerated, onTextGenerated, prefillTopic }: Props) {
  const { lang } = useLanguage();
  const { profile } = useAuth();
  const l = lang as L;
  const lb = (key: string) => labels[key]?.[l] || labels[key]?.['PT'] || key;

  const [passage, setPassage] = useState('');
  const [verseLoading, setVerseLoading] = useState(false);

  const [topic, setTopic] = useState(prefillTopic ?? '');
  const [activeTool, setActiveTool] = useState('social-caption');
  const [contentLoading, setContentLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [copied, setCopied] = useState(false);

  // Sincroniza o tema quando um novo artefato é carregado de outra tela
  // (sermão, versículo, devocional) para que o usuário só precise clicar "Gerar".
  useEffect(() => {
    if (prefillTopic && prefillTopic.trim()) {
      setTopic(prefillTopic.trim().slice(0, 240));
    }
  }, [prefillTopic]);

  const fetchVerse = async () => {
    if (!passage.trim()) return;
    setVerseLoading(true);
    try {
      const version = profile?.bible_version || 'ARA';
      const { data, error } = await supabase.functions.invoke('fetch-bible-verse', {
        body: { passage: passage.trim(), version, language: lang },
      });
      if (error) throw error;
      if (data?.text && data?.book) {
        onVerseGenerated({
          text: data.text,
          book: data.book,
          topic_image: data.topic_image || 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&q=80',
        });
      }
    } catch {
      toast.error(l === 'PT' ? 'Erro ao buscar versículo' : l === 'EN' ? 'Error fetching verse' : 'Error al buscar versículo');
    } finally {
      setVerseLoading(false);
    }
  };

  const generateSurprise = async () => {
    setVerseLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-verse', {
        body: { language: lang },
      });
      if (error) throw error;
      if (data?.text && data?.book) {
        onVerseGenerated({
          text: data.text,
          book: data.book,
          topic_image: data.topic_image || 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&q=80',
        });
      }
    } catch {
      toast.error(l === 'PT' ? 'Erro ao gerar versículo' : l === 'EN' ? 'Error generating verse' : 'Error al generar versículo');
    } finally {
      setVerseLoading(false);
    }
  };

  const generateContent = async () => {
    if (!topic.trim()) return;
    setContentLoading(true);
    setGeneratedContent('');
    try {
      const backendTool = TOOL_MAP[activeTool] || 'social_caption';
      const { data, error } = await supabase.functions.invoke('search-pastoral-tools', {
        body: { tool: backendTool, userPrompt: topic.trim(), language: lang },
      });
      if (error) throw error;
      setGeneratedContent(data?.content || '');
    } catch {
      toast.error(l === 'PT' ? 'Erro ao gerar conteúdo' : l === 'EN' ? 'Error generating content' : 'Error al generar contenido');
    } finally {
      setContentLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    toast.success(lb('copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Verse Search */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            {lb('verseTitle')}
          </h3>
          <div className="flex gap-2">
            <Input
              value={passage}
              onChange={(e) => setPassage(e.target.value)}
              placeholder={lb('versePlaceholder')}
              className="flex-1 bg-background text-foreground placeholder:text-muted-foreground h-9 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && fetchVerse()}
            />
            <Button onClick={fetchVerse} disabled={verseLoading || !passage.trim()} size="sm" className="gap-1.5 shrink-0">
              {verseLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              {verseLoading ? lb('searching') : lb('search')}
            </Button>
          </div>
          <Button
            onClick={generateSurprise}
            disabled={verseLoading}
            variant="outline"
            size="sm"
            className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
          >
            {verseLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {lb('surprise')}
          </Button>
        </CardContent>
      </Card>

      {/* Content Generator */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Type className="h-4 w-4 text-primary" />
              {lb('contentTitle')}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{lb('contentDesc')}</p>
          </div>

          {/* Tool selector pills */}
          <div className="flex flex-wrap gap-1.5">
            {contentTools.map((t) => {
              const active = activeTool === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTool(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {lb(t.labelKey)}
                </button>
              );
            })}
          </div>

          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={lb('topicPlaceholder')}
            className="bg-background text-foreground placeholder:text-muted-foreground h-9 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && generateContent()}
          />

          <Button
            onClick={generateContent}
            disabled={contentLoading || !topic.trim()}
            size="sm"
            className="w-full gap-2"
          >
            {contentLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {contentLoading ? lb('generating') : lb('generate')}
          </Button>

          {generatedContent && (
            <div className="space-y-2 animate-in fade-in duration-300">
              <Textarea
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                className="min-h-[120px] text-xs bg-background text-foreground border-border"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5 flex-1">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? lb('copied') : 'Copy'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onTextGenerated(generatedContent)}
                  className="gap-1.5 flex-1 border-primary/30 text-primary hover:bg-primary/5"
                >
                  <Type className="h-3.5 w-3.5" />
                  {lb('useOnCanvas')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
