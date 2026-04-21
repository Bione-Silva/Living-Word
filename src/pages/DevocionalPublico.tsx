import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { BookOpen, Play, Pause, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

type L = 'PT' | 'EN' | 'ES';

interface ShareData {
  id: string;
  user_id: string;
  devocional_date: string;
  share_token: string;
  cliques: number;
}

interface DevotionalData {
  id: string;
  title: string;
  anchor_verse: string;
  anchor_verse_text: string;
  body_text: string;
  daily_practice?: string;
  reflection_question?: string;
  closing_prayer?: string;
  cover_image_url?: string | null;
  audio_url_onyx?: string | null;
  scheduled_date: string;
  category: string;
}

interface SharerProfile {
  full_name: string;
  avatar_url?: string | null;
}

const labels = {
  sharedBy: { PT: 'compartilhou este devocional com você', EN: 'shared this devotional with you', ES: 'compartió este devocional contigo' },
  joinFree: { PT: 'Junte-se gratuitamente à Living Word', EN: 'Join Living Word for free', ES: 'Únete gratis a Living Word' },
  listenFull: { PT: 'Ouça o devocional completo', EN: 'Listen to the full devotional', ES: 'Escucha el devocional completo' },
  signUpFree: { PT: 'Cadastre-se gratuitamente', EN: 'Sign up for free', ES: 'Regístrate gratis' },
  readFull: { PT: 'Leia o devocional completo', EN: 'Read the full devotional', ES: 'Lee el devocional completo' },
  itsFree: { PT: 'É grátis!', EN: "It's free!", ES: '¡Es gratis!' },
  ctaTitle: { PT: 'Ouça a Palavra de hoje e compartilhe esperança', EN: 'Listen to the Word and share hope', ES: 'Escucha la Palabra y comparte esperanza' },
  ctaDesc: { 
    PT: <>Na Living Word você também pode <strong>estudar a Palavra de Deus</strong>, <strong>criar sermões incríveis</strong>, e <strong>gerar conteúdo completo para o seu Instagram e redes sociais</strong>. Crie sua conta grátis agora.</>, 
    EN: <>At Living Word you can also <strong>study the Word of God</strong>, <strong>create incredible sermons</strong>, and <strong>generate complete content for your Instagram and social networks</strong>. Create your free account now.</>, 
    ES: <>En Living Word también puedes <strong>estudiar la Palabra de Dios</strong>, <strong>crear sermones increíbles</strong> y <strong>generar contenido completo para tu Instagram y redes sociales</strong>. Crea tu cuenta gratis ahora.</> 
  },
  ctaButton: { PT: 'Criar minha conta grátis', EN: 'Create my free account', ES: 'Crear mi cuenta gratis' },
  notFound: { PT: 'Devocional não encontrado', EN: 'Devotional not found', ES: 'Devocional no encontrado' },
  meditation: { PT: 'MEDITAÇÃO', EN: 'MEDITATION', ES: 'MEDITACIÓN' },
};

export default function DevocionalPublico() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { lang } = useLanguage();
  const l = lang as L;
  const [loading, setLoading] = useState(true);
  const [share, setShare] = useState<ShareData | null>(null);
  const [devotional, setDevotional] = useState<DevotionalData | null>(null);
  const [sharer, setSharer] = useState<SharerProfile | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!shareToken) return;
    (async () => {
      // Increment click
      await supabase.rpc('increment_share_click', { p_token: shareToken } as any);

      // Get share data
      const { data: shareData } = await supabase
        .from('devocional_compartilhamentos' as any)
        .select('*')
        .eq('share_token', shareToken)
        .single();

      if (!shareData) { setLoading(false); return; }
      setShare(shareData as any);

      // Get devotional for that date
      const { data: devData } = await supabase
        .from('devotionals')
        .select('*')
        .eq('scheduled_date', (shareData as any).devocional_date)
        .limit(1)
        .single();

      if (devData) setDevotional(devData as any);

      // Get sharer profile (public name)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', (shareData as any).user_id)
        .single();

      if (profileData) setSharer(profileData);
      setLoading(false);
    })();
  }, [shareToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(252,100%,99%)]">
        <Header l={l} shareToken={shareToken} />
        <div className="max-w-2xl mx-auto px-5 py-12 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!devotional || !share) {
    return (
      <div className="min-h-screen bg-[hsl(252,100%,99%)]">
        <Header l={l} shareToken={shareToken} />
        <div className="max-w-2xl mx-auto px-5 py-20 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">{labels.notFound[l]}</p>
        </div>
      </div>
    );
  }

  // Split body into paragraphs
  const paragraphs = devotional.body_text.split(/\n\n+/).filter(Boolean);

  const sharerName = sharer?.full_name || 'Living Word';

  const audioSrc = devotional?.audio_url_onyx;
  
  const togglePlay = () => {
    if (!audioSrc) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(audioSrc);
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) setProgress(audioRef.current.currentTime);
      });
      audioRef.current.addEventListener('ended', () => {
        setPlaying(false);
        setProgress(0);
      });
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(252,100%,99%)]">
      {/* Header */}
      <Header l={l} shareToken={shareToken} />

      {/* Shared by banner */}
      <div className="bg-[hsl(263,70%,50%)]/10 border-b border-[hsl(270,43%,92%)] px-5 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2 text-sm">
          <span>📖</span>
          <span className="font-semibold text-[hsl(256,56%,16%)]">{sharerName}</span>
          <span className="text-[hsl(256,56%,16%)]/70">{labels.sharedBy[l]}</span>
          <span className="text-[hsl(256,56%,16%)]/50 hidden sm:inline">|</span>
          <span className="text-[hsl(263,70%,50%)] font-medium hidden sm:inline">{labels.joinFree[l]}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-8">
        {/* Cover image */}
        {devotional.cover_image_url && (
          <div className="rounded-2xl overflow-hidden border border-[hsl(270,43%,92%)]">
            <img src={devotional.cover_image_url} alt={devotional.title} className="w-full h-auto" />
          </div>
        )}

        {/* Title & verse */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(263,70%,50%)]">
            {devotional.category}
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[hsl(256,56%,16%)] mt-1 leading-tight">
            {devotional.title}
          </h1>
          <div className="mt-4 pl-4 border-l-[3px] border-[hsl(263,70%,50%)]">
            <p className="text-sm font-medium text-[hsl(263,70%,50%)]">{devotional.anchor_verse}</p>
            <p className="text-base italic text-[hsl(256,56%,16%)] mt-1 font-serif leading-relaxed">
              "{devotional.anchor_verse_text}"
            </p>
          </div>
        </div>

        {/* Audio Player */}
        {audioSrc && (
          <div className="bg-[hsl(252,100%,99%)] rounded-2xl border border-[hsl(270,43%,92%)] p-4 sm:p-6 flex items-center gap-4 sm:gap-5 shadow-sm">
            <button
              onClick={togglePlay}
              className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full bg-[hsl(263,70%,50%)] flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md shadow-[hsl(263,70%,50%)]/20"
            >
              {playing ? <Pause className="h-5 w-5 sm:h-6 sm:w-6 text-white" /> : <Play className="h-5 w-5 sm:h-6 sm:w-6 text-white ml-1" />}
            </button>
            <div className="flex-1 min-w-0 flex flex-col gap-2">
               <p className="text-sm font-semibold text-[hsl(256,56%,16%)] truncate">{labels.listenFull[l]}</p>
               <div className="h-1.5 bg-[hsl(270,43%,92%)] rounded-full overflow-hidden w-full max-w-[280px]">
                 <div className="h-full bg-[hsl(263,70%,50%)] transition-all ease-linear" style={{ width: audioRef.current?.duration ? `${(progress / audioRef.current.duration) * 100}%` : '0%' }} />
               </div>
            </div>
            <div className="text-xs font-semibold text-[hsl(263,70%,50%)] w-12 text-right tabular-nums">
              {Math.floor(progress / 60)}:{(Math.floor(progress % 60)).toString().padStart(2, '0')}
            </div>
          </div>
        )}

        {/* Meditation - all paragraphs */}
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-[hsl(263,70%,50%)]/10">
              <BookOpen className="h-4 w-4 text-[hsl(263,70%,50%)]" />
            </div>
            <h2 className="text-[11px] font-bold tracking-[0.15em] uppercase text-[hsl(263,70%,50%)]">
              {labels.meditation[l]}
            </h2>
          </div>
          <div className="space-y-4 font-serif text-base leading-relaxed text-[hsl(256,56%,16%)]">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>

        {/* CTA Card */}
        <div className="rounded-2xl border-2 border-[hsl(263,70%,50%)]/30 bg-gradient-to-br from-[hsl(263,70%,50%)]/5 to-[hsl(252,100%,99%)] p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[hsl(263,70%,50%)]/10 flex items-center justify-center mx-auto">
            <BookOpen className="h-7 w-7 text-[hsl(263,70%,50%)]" />
          </div>
          <h3 className="text-xl font-serif font-bold text-[hsl(256,56%,16%)]">
            {labels.ctaTitle[l]}
          </h3>
          <p className="text-sm text-[hsl(257,61%,32%)] max-w-md mx-auto">
            {labels.ctaDesc[l]}
          </p>
          <Link to={`/cadastro?ref=${shareToken}`}>
            <Button className="bg-[hsl(263,70%,50%)] hover:bg-[hsl(263,70%,50%)] text-white px-8 py-3 text-base rounded-xl shadow-lg mt-2">
              {labels.ctaButton[l]} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[hsl(270,43%,92%)] py-6 text-center">
        <p className="text-xs text-[hsl(263,70%,50%)]">Living Word © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

function Header({ l, shareToken }: { l: L; shareToken?: string }) {
  return (
    <header className="border-b border-[hsl(270,43%,92%)] bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[hsl(263,70%,50%)]" />
          <span className="text-lg font-serif font-bold text-[hsl(256,56%,16%)]">Living Word</span>
        </Link>
        <Link to={`/cadastro${shareToken ? `?ref=${shareToken}` : ''}`}>
          <Button size="sm" className="bg-[hsl(263,70%,50%)] hover:bg-[hsl(263,70%,50%)] text-white rounded-lg text-xs">
            {l === 'PT' ? 'Criar conta grátis' : l === 'ES' ? 'Crear cuenta gratis' : 'Create free account'}
          </Button>
        </Link>
      </div>
    </header>
  );
}
