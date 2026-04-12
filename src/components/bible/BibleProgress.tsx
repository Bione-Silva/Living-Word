// @ts-nocheck
// @ts-nocheck
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Flame, BookOpen, Star, Library } from 'lucide-react';
import { bibleBooks } from '@/lib/bible-data';
import { ntBookIds } from '@/data/bible-book-descriptions';
import type { L } from '@/lib/bible-data';

const TOTAL_CHAPTERS = bibleBooks.reduce((s, b) => s + b.chapters, 0);
const OT_CHAPTERS = bibleBooks.filter(b => !ntBookIds.has(b.id)).reduce((s, b) => s + b.chapters, 0);
const NT_CHAPTERS = bibleBooks.filter(b => ntBookIds.has(b.id)).reduce((s, b) => s + b.chapters, 0);

const labels = {
  title: { PT: 'Estatísticas de Leitura', EN: 'Reading Stats', ES: 'Estadísticas de Lectura' },
  subtitle: { PT: 'Acompanhe seu progresso na Bíblia', EN: 'Track your Bible progress', ES: 'Sigue tu progreso bíblico' },
  streak: { PT: 'Sequência', EN: 'Streak', ES: 'Racha' },
  days: { PT: 'dias', EN: 'days', ES: 'días' },
  chaptersRead: { PT: 'Cap. lidos', EN: 'Ch. read', ES: 'Cap. leídos' },
  booksComplete: { PT: 'Livros completos', EN: 'Books complete', ES: 'Libros completos' },
  favorites: { PT: 'Favoritos', EN: 'Favorites', ES: 'Favoritos' },
  overall: { PT: 'Progresso Geral', EN: 'Overall Progress', ES: 'Progreso General' },
  of: { PT: 'de', EN: 'of', ES: 'de' },
  chapRead: { PT: 'capítulos lidos', EN: 'chapters read', ES: 'capítulos leídos' },
  byTestament: { PT: 'Por Testamento', EN: 'By Testament', ES: 'Por Testamento' },
  ot: { PT: 'Antigo Testamento', EN: 'Old Testament', ES: 'Antiguo Testamento' },
  nt: { PT: 'Novo Testamento', EN: 'New Testament', ES: 'Nuevo Testamento' },
  chapters: { PT: 'capítulos', EN: 'chapters', ES: 'capítulos' },
} satisfies Record<string, Record<L, string>>;

export function BibleProgress() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [stats, setStats] = useState({ streak: 0, chapters: 0, books: 0, favorites: 0, otChapters: 0, ntChapters: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: progress }, { data: favs }] = await Promise.all([
        (supabase as any).from('reading_plan_progress').select('*').eq('user_id', user.id).eq('completed', true),
        (supabase as any).from('bible_favorites').select('id').eq('user_id', user.id),
      ]);

      const chaptersRead = progress?.length || 0;
      const favCount = favs?.length || 0;

      // Simple streak calculation based on consecutive days
      let streak = 0;
      if (progress && progress.length > 0) {
        const dates = [...new Set(progress.map(p => p.completed_at.split('T')[0]))].sort().reverse();
        const today = new Date().toISOString().split('T')[0];
        if (dates[0] === today || dates[0] === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
          streak = 1;
          for (let i = 1; i < dates.length; i++) {
            const d1 = new Date(dates[i - 1]);
            const d2 = new Date(dates[i]);
            const diff = (d1.getTime() - d2.getTime()) / 86400000;
            if (diff <= 1) streak++;
            else break;
          }
        }
      }

      setStats({ streak, chapters: chaptersRead, books: 0, favorites: favCount, otChapters: 0, ntChapters: 0 });
    })();
  }, [user]);

  const overallPct = TOTAL_CHAPTERS > 0 ? Math.round((stats.chapters / TOTAL_CHAPTERS) * 100) : 0;
  const otPct = OT_CHAPTERS > 0 ? Math.round((stats.otChapters / OT_CHAPTERS) * 100) : 0;
  const ntPct = NT_CHAPTERS > 0 ? Math.round((stats.ntChapters / NT_CHAPTERS) * 100) : 0;

  const statCards = [
    { icon: Flame, value: `${stats.streak}`, sub: `${labels.days[lang]}`, label: labels.streak[lang] },
    { icon: BookOpen, value: `${stats.chapters}`, sub: '', label: labels.chaptersRead[lang] },
    { icon: Library, value: `${stats.books}`, sub: '', label: labels.booksComplete[lang] },
    { icon: Star, value: `${stats.favorites}`, sub: '', label: labels.favorites[lang] },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-bold text-foreground">{labels.title[lang]}</h3>
        <p className="text-sm text-muted-foreground">{labels.subtitle[lang]}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {statCards.map((s, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-1">
            <s.icon className="h-5 w-5 text-primary/70" />
            <p className="font-display text-2xl font-bold text-foreground">{s.value} {s.sub && <span className="text-sm font-normal text-muted-foreground">{s.sub}</span>}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-display text-sm font-bold text-foreground">{labels.overall[lang]}</p>
          <span className="text-sm text-primary font-medium">{overallPct}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${overallPct}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">{stats.chapters} {labels.of[lang]} {TOTAL_CHAPTERS} {labels.chapRead[lang]}</p>
      </div>

      {/* By testament */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <p className="font-display text-sm font-bold text-foreground">{labels.byTestament[lang]}</p>
        {[
          { label: labels.ot[lang], pct: otPct, read: stats.otChapters, total: OT_CHAPTERS },
          { label: labels.nt[lang], pct: ntPct, read: stats.ntChapters, total: NT_CHAPTERS },
        ].map(t => (
          <div key={t.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground">{t.label}</span>
              <span className="text-xs text-primary font-medium">{t.pct}%</span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${t.pct}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground">{t.read} / {t.total} {labels.chapters[lang]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
