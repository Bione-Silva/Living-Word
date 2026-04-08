import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Loader2, RefreshCw, Palette } from 'lucide-react';
import { toast } from 'sonner';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  back: { PT: 'Voltar', EN: 'Back', ES: 'Volver' },
  title: { PT: 'Histórias para Crianças', EN: 'Stories for Kids', ES: 'Historias para Niños' },
  subtitle: { PT: 'Escolha um personagem bíblico e receba uma história mágica!', EN: 'Pick a Bible character and get a magical story!', ES: '¡Elige un personaje bíblico y recibe una historia mágica!' },
  generate: { PT: 'Gerar história', EN: 'Generate story', ES: 'Generar historia' },
  generating: { PT: 'Criando história mágica...', EN: 'Creating magical story...', ES: 'Creando historia mágica...' },
  newStory: { PT: 'Nova história', EN: 'New story', ES: 'Nueva historia' },
  ageGroup: { PT: 'Faixa etária', EN: 'Age group', ES: 'Grupo de edad' },
} satisfies Record<string, Record<L, string>>;

const characters = [
  { id: 'david', emoji: '👑', name: { PT: 'Davi', EN: 'David', ES: 'David' } },
  { id: 'moses', emoji: '🌊', name: { PT: 'Moisés', EN: 'Moses', ES: 'Moisés' } },
  { id: 'noah', emoji: '🚢', name: { PT: 'Noé', EN: 'Noah', ES: 'Noé' } },
  { id: 'esther', emoji: '👸', name: { PT: 'Ester', EN: 'Esther', ES: 'Ester' } },
  { id: 'daniel', emoji: '🦁', name: { PT: 'Daniel', EN: 'Daniel', ES: 'Daniel' } },
  { id: 'joseph', emoji: '🌈', name: { PT: 'José', EN: 'Joseph', ES: 'José' } },
  { id: 'ruth', emoji: '🌾', name: { PT: 'Rute', EN: 'Ruth', ES: 'Rut' } },
  { id: 'jonah', emoji: '🐋', name: { PT: 'Jonas', EN: 'Jonah', ES: 'Jonás' } },
  { id: 'samuel', emoji: '📖', name: { PT: 'Samuel', EN: 'Samuel', ES: 'Samuel' } },
  { id: 'abraham', emoji: '⭐', name: { PT: 'Abraão', EN: 'Abraham', ES: 'Abraham' } },
  { id: 'elijah', emoji: '🔥', name: { PT: 'Elias', EN: 'Elijah', ES: 'Elías' } },
  { id: 'mary', emoji: '💙', name: { PT: 'Maria', EN: 'Mary', ES: 'María' } },
  { id: 'peter', emoji: '🐟', name: { PT: 'Pedro', EN: 'Peter', ES: 'Pedro' } },
  { id: 'paul', emoji: '✉️', name: { PT: 'Paulo', EN: 'Paul', ES: 'Pablo' } },
  { id: 'sarah', emoji: '😊', name: { PT: 'Sara', EN: 'Sarah', ES: 'Sara' } },
  { id: 'gideon', emoji: '🏺', name: { PT: 'Gideão', EN: 'Gideon', ES: 'Gedeón' } },
  { id: 'joshua', emoji: '🎺', name: { PT: 'Josué', EN: 'Joshua', ES: 'Josué' } },
  { id: 'solomon', emoji: '🏛️', name: { PT: 'Salomão', EN: 'Solomon', ES: 'Salomón' } },
  { id: 'samson', emoji: '💪', name: { PT: 'Sansão', EN: 'Samson', ES: 'Sansón' } },
  { id: 'miriam', emoji: '🎵', name: { PT: 'Miriã', EN: 'Miriam', ES: 'Miriam' } },
];

const ageGroups = [
  { value: '3-5', label: { PT: '3–5 anos', EN: '3–5 years', ES: '3–5 años' } },
  { value: '6-8', label: { PT: '6–8 anos', EN: '6–8 years', ES: '6–8 años' } },
  { value: '9-12', label: { PT: '9–12 anos', EN: '9–12 years', ES: '9–12 años' } },
];

export default function Kids() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [ageGroup, setAgeGroup] = useState('6-8');
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState<{ title: string; content: string } | null>(null);
  const [lesson, setLesson] = useState<string | null>(null);
  const [storyImage, setStoryImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [drawingImage, setDrawingImage] = useState<string | null>(null);
  const [drawingLoading, setDrawingLoading] = useState(false);

  const handleGenerate = async () => {
    if (!selected || !user) return;
    const char = characters.find(c => c.id === selected);
    if (!char) return;

    setLoading(true);
    setStory(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-tool', {
        body: {
          systemPrompt: `You are a children's story writer specializing in Bible stories. Write a story for children aged ${ageGroup} about ${char.name.EN}. 
The story should be:
- Written in ${lang === 'PT' ? 'Portuguese' : lang === 'ES' ? 'Spanish' : 'English'}
- Age-appropriate and engaging
- 300-500 words
- Include a moral lesson
- Use simple, vivid language with dialogue
- Be biblically accurate but told in a fun way

Return ONLY valid JSON: {"title": "story title", "content": "full story with paragraphs separated by \\n\\n"}`,
          userPrompt: `Tell me a story about ${char.name[lang]} for children aged ${ageGroup}`,
          toolId: 'kids-story',
        },
      });

      if (error) throw error;
      const content = data?.content;
      if (content) {
        let parsed: { title: string; content: string };
        try {
          parsed = JSON.parse(content);
        } catch {
          parsed = { title: char.name[lang], content };
        }
        setStory(parsed);
        // Generate illustration
        generateImage(char.name.EN, parsed.title);
      }
    } catch {
      toast.error(lang === 'PT' ? 'Erro ao gerar história' : 'Error generating story');
    } finally {
      setLoading(false);
    }
  };

  const generateImage = async (characterName: string, storyTitle: string) => {
    setImageLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-tool', {
        body: {
          systemPrompt: `You are an illustration generator. Return ONLY a single URL of a placeholder illustration. Actually, generate a vivid text description for an illustration.
Return ONLY valid JSON: {"description": "a warm, colorful children's book illustration of..."}`,
          userPrompt: `Describe a children's book illustration for a Bible story about ${characterName}: "${storyTitle}"`,
          toolId: 'kids-illustration',
        },
      });
      if (!error && data?.content) {
        try {
          const parsed = JSON.parse(data.content);
          // Use the description as alt-text; generate image via Lovable AI
          const imgRes = await supabase.functions.invoke('ai-tool', {
            body: {
              systemPrompt: 'Generate a children\'s book style illustration based on the description. Use warm colors, friendly characters, and a storybook feel. Return the image.',
              userPrompt: parsed.description || `Children's Bible illustration of ${characterName}`,
              toolId: 'kids-image',
              model: 'google/gemini-2.5-flash',
              modalities: ['image', 'text'],
            },
          });
          if (imgRes.data?.images?.[0]?.image_url?.url) {
            setStoryImage(imgRes.data.images[0].image_url.url);
          }
        } catch { /* ignore parse errors */ }
      }
    } catch { /* ignore image errors */ }
    setImageLoading(false);
  };

  const handleReset = () => {
    setStory(null);
    setStoryImage(null);
    setSelected(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> {labels.back[lang]}
      </Link>

      <div className="text-center space-y-2">
        <h1 className="text-2xl font-display font-bold text-foreground">
          🧒 {labels.title[lang]}
        </h1>
        <p className="text-sm text-muted-foreground">{labels.subtitle[lang]}</p>
      </div>

      {!story ? (
        <>
          {/* Age selector */}
          <div className="flex justify-center gap-2">
            {ageGroups.map(ag => (
              <button
                key={ag.value}
                onClick={() => setAgeGroup(ag.value)}
                className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                  ageGroup === ag.value
                    ? 'bg-primary/15 border-primary/50 text-primary'
                    : 'bg-background border-border text-muted-foreground hover:border-primary/30'
                }`}
              >
                {ag.label[lang]}
              </button>
            ))}
          </div>

          {/* Character grid */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {characters.map(char => (
              <button
                key={char.id}
                onClick={() => setSelected(char.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                  selected === char.id
                    ? 'bg-primary/10 border-primary/50 shadow-sm scale-105'
                    : 'bg-card border-border hover:border-primary/30 hover:bg-muted/50'
                }`}
              >
                <span className="text-3xl">{char.emoji}</span>
                <span className="text-[11px] font-medium text-foreground leading-tight text-center">{char.name[lang]}</span>
              </button>
            ))}
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!selected || loading}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {labels.generating[lang]}</>
            ) : (
              <>✨ {labels.generate[lang]}</>
            )}
          </button>
        </>
      ) : (
        <div className="space-y-4">
          {/* Story card */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{characters.find(c => c.id === selected)?.emoji}</span>
              <h2 className="text-xl font-display font-bold text-foreground">{story.title}</h2>
            </div>

            {/* AI Illustration */}
            {imageLoading && (
              <div className="rounded-xl bg-muted/30 h-48 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-xs text-muted-foreground">{lang === 'PT' ? 'Criando ilustração...' : 'Creating illustration...'}</span>
              </div>
            )}
            {storyImage && !imageLoading && (
              <img src={storyImage} alt={story.title} className="w-full rounded-xl object-cover max-h-64" />
            )}

            <div className="prose prose-sm max-w-none text-foreground/85 leading-[1.9]">
              {story.content.split('\n\n').map((p, i) => (
                <p key={i} className="mb-3">{p}</p>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 h-11 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> {labels.newStory[lang]}
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '🔄'} {lang === 'PT' ? 'Recontar' : 'Retell'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
