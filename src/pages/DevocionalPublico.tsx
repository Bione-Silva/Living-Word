import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { BookOpen, Lock, Play, ArrowRight } from 'lucide-react';
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
  ctaTitle: { PT: 'Continue sua jornada espiritual', EN: 'Continue your spiritual journey', ES: 'Continúa tu jornada espiritual' },
  ctaDesc: { PT: 'Acesse devocionais diários, estudos bíblicos e muito mais — 100% gratuito', EN: 'Access daily devotionals, Bible studies and more — 100% free', ES: 'Accede a devocionales diarios, estudios bíblicos y más — 100% gratis' },
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

  useEffect(() => {
    if (!shareToken) return;
    (async () => {
      // Increment click
      await (supabase as any).rpc('increment_share_click', { p_token: shareToken } as any);

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
      <div className="min-h-screen bg-[hsl(36,30%,96%)]">
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
      <div className="min-h-screen bg-[hsl(36,30%,96%)]">
        <Header l={l} shareToken={shareToken} />
        <div className="max-w-2xl mx-auto px-5 py-20 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">{labels.notFound[l]}</p>
        </div>
      </div>
    );
  }

  // Split body into paragraphs, show first 2
  const paragraphs = devotional.body_text.split(/\n\n+/).filter(Boolean);
  const visibleParagraphs = paragraphs.slice(0, 2);
  const hasMore = paragraphs.length > 2;

  const sharerName = sharer?.full_name || 'Living Word';

  return (
    <div className="min-h-screen bg-[hsl(36,30%,96%)]">
      {/* Header */}
      <Header l={l} shareToken={shareToken} />

      {/* Shared by banner */}
      <div className="bg-[hsl(38,52%,58%)]/10 border-b border-[hsl(38,40%,80%)] px-5 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2 text-sm">
          <span>📖</span>
          <span className="font-semibold text-[hsl(24,30%,25%)]">{sharerName}</span>
          <span className="text-[hsl(24,30%,25%)]/70">{labels.sharedBy[l]}</span>
          <span className="text-[hsl(24,30%,25%)]/50 hidden sm:inline">|</span>
          <span className="text-[hsl(38,52%,58%)] font-medium hidden sm:inline">{labels.joinFree[l]}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-8">
        {/* Cover image */}
        {devotional.cover_image_url && (
          <div className="rounded-2xl overflow-hidden border border-[hsl(38,40%,80%)]">
            <img src={devotional.cover_image_url} alt={devotional.title} className="w-full h-auto" />
          </div>
        )}

        {/* Title & verse */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(38,52%,58%)]">
            {devotional.category}
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[hsl(24,30%,20%)] mt-1 leading-tight">
            {devotional.title}
          </h1>
          <div className="mt-4 pl-4 border-l-[3px] border-[hsl(38,52%,58%)]">
            <p className="text-sm font-medium text-[hsl(38,52%,48%)]">{devotional.anchor_verse}</p>
            <p className="text-base italic text-[hsl(24,30%,30%)] mt-1 font-serif leading-relaxed">
              "{devotional.anchor_verse_text}"
            </p>
          </div>
        </div>

        {/* Audio: locked */}
        {devotional.audio_url_onyx && (
          <div className="relative rounded-2xl border border-[hsl(38,40%,80%)] p-6 overflow-hidden">
            <div className="absolute inset-0 bg-[hsl(36,30%,94%)]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <div className="w-14 h-14 rounded-full bg-[hsl(38,52%,58%)] flex items-center justify-center mb-3 shadow-lg">
                <Play className="h-6 w-6 text-white ml-0.5" />
              </div>
              <p className="text-sm font-semibold text-[hsl(24,30%,25%)]">{labels.listenFull[l]}</p>
              <Link to={`/cadastro?ref=${shareToken}`}>
                <Button variant="link" className="text-[hsl(38,52%,48%)] mt-1 text-xs">
                  {labels.signUpFree[l]} →
                </Button>
              </Link>
            </div>
            {/* Fake player behind blur */}
            <div className="h-20 flex items-center gap-4 opacity-40">
              <div className="w-10 h-10 rounded-full bg-[hsl(38,52%,58%)] flex items-center justify-center">
                <Play className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 h-2 bg-[hsl(38,40%,85%)] rounded-full">
                <div className="h-full w-1/3 bg-[hsl(38,52%,58%)] rounded-full" />
              </div>
              <span className="text-xs text-[hsl(24,30%,50%)]">0:00 / 5:42</span>
            </div>
          </div>
        )}

        {/* Meditation - visible paragraphs */}
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-[hsl(38,52%,58%)]/10">
              <BookOpen className="h-4 w-4 text-[hsl(38,52%,58%)]" />
            </div>
            <h2 className="text-[11px] font-bold tracking-[0.15em] uppercase text-[hsl(38,52%,58%)]">
              {labels.meditation[l]}
            </h2>
          </div>
          <div className="space-y-4 font-serif text-base leading-relaxed text-[hsl(24,30%,25%)]">
            {visibleParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>

        {/* Blur overlay for remaining content */}
        {hasMore && (
          <div className="relative">
            <div className="space-y-4 font-serif text-base leading-relaxed text-[hsl(24,30%,25%)]">
              <p className="line-clamp-3">{paragraphs[2]}</p>
            </div>
            {/* Gradient blur */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(36,30%,96%)]/70 to-[hsl(36,30%,96%)]" />
            <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-4">
              <Lock className="h-5 w-5 text-[hsl(38,52%,58%)] mb-2" />
              <p className="text-sm font-semibold text-[hsl(24,30%,25%)]">{labels.readFull[l]}</p>
              <p className="text-xs text-[hsl(38,52%,48%)]">{labels.itsFree[l]}</p>
            </div>
          </div>
        )}

        {/* CTA Card */}
        <div className="rounded-2xl border-2 border-[hsl(38,52%,58%)]/30 bg-gradient-to-br from-[hsl(38,52%,58%)]/5 to-[hsl(36,30%,94%)] p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[hsl(38,52%,58%)]/10 flex items-center justify-center mx-auto">
            <BookOpen className="h-7 w-7 text-[hsl(38,52%,58%)]" />
          </div>
          <h3 className="text-xl font-serif font-bold text-[hsl(24,30%,20%)]">
            {labels.ctaTitle[l]}
          </h3>
          <p className="text-sm text-[hsl(24,30%,40%)] max-w-md mx-auto">
            {labels.ctaDesc[l]}
          </p>
          <Link to={`/cadastro?ref=${shareToken}`}>
            <Button className="bg-[hsl(38,52%,58%)] hover:bg-[hsl(38,52%,48%)] text-white px-8 py-3 text-base rounded-xl shadow-lg mt-2">
              {labels.ctaButton[l]} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[hsl(38,40%,85%)] py-6 text-center">
        <p className="text-xs text-[hsl(24,30%,50%)]">Living Word © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

function Header({ l, shareToken }: { l: L; shareToken?: string }) {
  return (
    <header className="border-b border-[hsl(38,40%,85%)] bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[hsl(38,52%,58%)]" />
          <span className="text-lg font-serif font-bold text-[hsl(24,30%,20%)]">Living Word</span>
        </Link>
        <Link to={`/cadastro${shareToken ? `?ref=${shareToken}` : ''}`}>
          <Button size="sm" className="bg-[hsl(38,52%,58%)] hover:bg-[hsl(38,52%,48%)] text-white rounded-lg text-xs">
            {l === 'PT' ? 'Criar conta grátis' : l === 'ES' ? 'Crear cuenta gratis' : 'Create free account'}
          </Button>
        </Link>
      </div>
    </header>
  );
}
