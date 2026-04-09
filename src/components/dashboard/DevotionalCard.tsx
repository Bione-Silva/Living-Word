import { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, ChevronRight, Headphones, Calendar, Heart, MessageCircle, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type L = 'PT' | 'EN' | 'ES';

interface DevotionalData {
  id: string;
  title: string;
  category: string;
  anchor_verse: string;
  anchor_verse_text: string;
  body_text: string;
  audio_url?: string;
  audio_duration_seconds?: number;
  reflection_question: string;
  scheduled_date: string;
}

const labels = {
  section: { PT: '☕ CAFÉ COM A PALAVRA VIVA DE DEUS', EN: '☕ COFFEE WITH THE LIVING WORD OF GOD', ES: '☕ CAFÉ CON LA PALABRA VIVA DE DIOS' },
  header: { PT: 'SUA LEITURA DIÁRIA', EN: 'YOUR DAILY READING', ES: 'TU LECTURA DIARIA' },
  listen: { PT: 'Escutar', EN: 'Listen', ES: 'Escuchar' },
  cta: { PT: 'Abrir leitura completa', EN: 'Open full reading', ES: 'Abrir lectura completa' },
  loading: { PT: 'Preparando sua palavra...', EN: 'Preparing your word...', ES: 'Preparando tu palabra...' },
  error: { PT: 'Não conseguimos carregar a palavra de hoje.', EN: 'We couldn\'t load today\'s word.', ES: 'No pudimos cargar la palabra de hoy.' },
  shared: { PT: 'Link copiado!', EN: 'Link copied!', ES: '¡Enlace copiado!' },
  commentPlaceholder: { PT: 'Escreva um comentário...', EN: 'Write a comment...', ES: 'Escribe un comentario...' },
} satisfies Record<string, Record<L, string>>;

function formatDate(dateStr: string, lang: L): string {
  const d = new Date(dateStr + 'T12:00:00');
  const locale = lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es-ES' : 'en-US';
  return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' mi';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + ' mil';
  return String(n);
}

/* ─── Engagement bar sub-component ─── */
function EngagementBar({ devotionalId, lang }: { devotionalId: string; lang: L }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<{ id: string; text: string; created_at: string; user_id: string }[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadCounts = useCallback(async () => {
    const [{ count: lc }, { count: cc }] = await Promise.all([
      supabase.from('devotional_likes').select('*', { count: 'exact', head: true }).eq('devotional_id', devotionalId),
      supabase.from('devotional_comments').select('*', { count: 'exact', head: true }).eq('devotional_id', devotionalId),
    ]);
    setLikesCount(lc ?? 0);
    setCommentsCount(cc ?? 0);
  }, [devotionalId]);

  useEffect(() => {
    if (!user) return;
    loadCounts();
    supabase
      .from('devotional_likes')
      .select('id')
      .eq('devotional_id', devotionalId)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setLiked(!!data));
  }, [user, devotionalId, loadCounts]);

  const toggleLike = async () => {
    if (!user) return;
    if (liked) {
      await supabase.from('devotional_likes').delete().eq('devotional_id', devotionalId).eq('user_id', user.id);
      setLiked(false);
      setLikesCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from('devotional_likes').insert({ devotional_id: devotionalId, user_id: user.id });
      setLiked(true);
      setLikesCount((c) => c + 1);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/devocional`;
    if (navigator.share) {
      await navigator.share({ url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(labels.shared[lang]);
    }
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from('devotional_comments')
      .select('id, text, created_at, user_id')
      .eq('devotional_id', devotionalId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setComments(data);
  };

  const toggleComments = () => {
    const next = !showComments;
    setShowComments(next);
    if (next) loadComments();
  };

  const submitComment = async () => {
    if (!user || !newComment.trim()) return;
    setSubmitting(true);
    await supabase.from('devotional_comments').insert({
      devotional_id: devotionalId,
      user_id: user.id,
      text: newComment.trim(),
    });
    setNewComment('');
    setSubmitting(false);
    setCommentsCount((c) => c + 1);
    loadComments();
  };

  return (
    <div className="space-y-3">
      {/* Action row */}
      <div className="flex items-center justify-between px-1">
        <button onClick={toggleLike} className="flex items-center gap-1.5 text-sm transition-colors group">
          <Heart
            className={`h-5 w-5 transition-colors ${liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground group-hover:text-red-400'}`}
          />
          <span className="text-xs text-muted-foreground">{formatCount(likesCount)}</span>
        </button>

        <button onClick={toggleComments} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
          <MessageCircle className="h-5 w-5" />
          <span className="text-xs">{formatCount(commentsCount)}</span>
        </button>

        <button onClick={handleShare} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
          <Share2 className="h-5 w-5" />
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="space-y-2 border-t border-border pt-3">
          {/* Input */}
          <div className="flex gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitComment()}
              placeholder={labels.commentPlaceholder[lang]}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              disabled={submitting}
            />
          </div>
          {/* List */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {comments.map((c) => (
              <div key={c.id} className="text-xs text-foreground/80 bg-muted/50 rounded-lg px-3 py-2">
                {c.text}
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                {lang === 'PT' ? 'Seja o primeiro a comentar!' : lang === 'ES' ? '¡Sé el primero en comentar!' : 'Be the first to comment!'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main DevotionalCard ─── */
export function DevotionalCard() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [data, setData] = useState<DevotionalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const { data: result, error: err } = await supabase.functions.invoke('get-devotional-today');
        if (err || !result) throw err;
        setData(result);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <section className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <Skeleton className="h-3 w-32" />
          <div className="flex-1 h-px bg-border/50" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-10 w-48 rounded-full mx-auto" />
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">{labels.error[lang]}</p>
      </div>
    );
  }

  return (
    <section className="space-y-2">
      {/* Section label */}
      <div className="flex items-center gap-2 px-1">
        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground whitespace-nowrap">
          {labels.section[lang]}
        </p>
        <div className="flex-1 h-px bg-border/50" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-primary">
                {labels.header[lang]}
              </p>
              <p className="text-base font-semibold text-foreground leading-snug mt-0.5">
                {data.title}
              </p>
            </div>
          </div>
          <Link to="/devocional" className="text-muted-foreground hover:text-primary transition-colors mt-1">
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 bg-primary/15 text-primary text-[11px] px-2.5 py-1 rounded-full font-medium">
            📗 {data.category}
          </span>
          {data.audio_url && (
            <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-[11px] px-2.5 py-1 rounded-full font-medium">
              <Headphones className="h-3 w-3" /> {labels.listen[lang]}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-muted-foreground text-[11px] px-2.5 py-1 rounded-full font-medium bg-muted">
            <Calendar className="h-3 w-3" /> {formatDate(data.scheduled_date, lang)}
          </span>
        </div>

        {/* Verse quote */}
        <div className="rounded-xl bg-background/40 border border-border/50 p-4">
          <blockquote className="text-sm italic text-foreground/90 leading-relaxed border-l-2 border-primary/40 pl-3">
            {data.anchor_verse_text}
          </blockquote>
          <p className="text-xs text-muted-foreground mt-2 pl-3">
            — {data.anchor_verse}
          </p>
        </div>

        {/* Engagement bar */}
        <EngagementBar devotionalId={data.id} lang={lang} />

        {/* CTA button */}
        <div className="flex justify-center">
          <Link
            to="/devocional"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            {labels.cta[lang]}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}