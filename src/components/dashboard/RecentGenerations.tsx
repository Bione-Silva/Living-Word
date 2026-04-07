import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

interface RecentItem {
  id: string;
  title: string;
  type: string;
  passage: string | null;
  created_at: string;
}

const typeIcons: Record<string, string> = {
  sermon: '🎤', pastoral: '🎤', study: '📖', biblical_study: '📖',
  article: '✍️', blog: '✍️', blog_article: '✍️', devotional: '✨',
};
const typeLabels: Record<string, Record<L, string>> = {
  sermon: { PT: 'Sermão', EN: 'Sermon', ES: 'Sermón' },
  pastoral: { PT: 'Pastoral', EN: 'Pastoral', ES: 'Pastoral' },
  study: { PT: 'Estudo', EN: 'Study', ES: 'Estudio' },
  biblical_study: { PT: 'Estudo Bíblico', EN: 'Bible Study', ES: 'Estudio Bíblico' },
  article: { PT: 'Artigo', EN: 'Article', ES: 'Artículo' },
  blog: { PT: 'Blog', EN: 'Blog', ES: 'Blog' },
  blog_article: { PT: 'Artigo', EN: 'Article', ES: 'Artículo' },
  devotional: { PT: 'Devocional', EN: 'Devotional', ES: 'Devocional' },
};

export function RecentGenerations() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('materials')
      .select('id, title, type, passage, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setItems(data);
      });
  }, [user]);

  if (items.length === 0) return null;

  const sectionTitle = {
    PT: '📝 CRIAÇÕES RECENTES',
    EN: '📝 RECENT CREATIONS',
    ES: '📝 CREACIONES RECIENTES',
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground">
          {sectionTitle[lang]}
        </p>
        <Link to="/biblioteca" className="text-[11px] font-medium text-primary flex items-center gap-0.5 hover:underline">
          {lang === 'PT' ? 'Ver tudo' : lang === 'EN' ? 'View all' : 'Ver todo'}
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="space-y-1.5">
        {items.map((m) => (
          <div key={m.id} className="rounded-xl p-3 flex items-center gap-3 bg-card border border-border hover:shadow-sm transition-all">
            <span className="text-base shrink-0">{typeIcons[m.type] || '📄'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
              <p className="text-[10px] text-muted-foreground">
                {typeLabels[m.type]?.[lang] || m.type}
                {m.passage && ` · ${m.passage}`}
              </p>
            </div>
            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
              {typeLabels[m.type]?.[lang] || m.type}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
