import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { ChevronRight, Mic, BookOpen, PenLine, Sparkles, Image as ImageIcon, Calendar, FileText, MoreHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

interface RecentItem {
  id: string;
  title: string;
  type: string;
  passage: string | null;
  created_at: string;
}

interface TypeStyle {
  icon: LucideIcon;
  /** Colored chip background for the icon */
  iconWrap: string;
  /** Icon color */
  iconColor: string;
  /** Badge background */
  badgeBg: string;
  /** Badge text color */
  badgeText: string;
}

const typeStyles: Record<string, TypeStyle> = {
  sermon: {
    icon: Mic,
    iconWrap: 'bg-violet-100 dark:bg-violet-500/15',
    iconColor: 'text-violet-600 dark:text-violet-400',
    badgeBg: 'bg-violet-100 dark:bg-violet-500/15',
    badgeText: 'text-violet-700 dark:text-violet-300',
  },
  pastoral: {
    icon: Mic,
    iconWrap: 'bg-violet-100 dark:bg-violet-500/15',
    iconColor: 'text-violet-600 dark:text-violet-400',
    badgeBg: 'bg-violet-100 dark:bg-violet-500/15',
    badgeText: 'text-violet-700 dark:text-violet-300',
  },
  study: {
    icon: BookOpen,
    iconWrap: 'bg-emerald-100 dark:bg-emerald-500/15',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-500/15',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
  },
  biblical_study: {
    icon: BookOpen,
    iconWrap: 'bg-emerald-100 dark:bg-emerald-500/15',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-500/15',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
  },
  expos: {
    icon: BookOpen,
    iconWrap: 'bg-emerald-100 dark:bg-emerald-500/15',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-500/15',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
  },
  article: {
    icon: PenLine,
    iconWrap: 'bg-amber-100 dark:bg-amber-500/15',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-100 dark:bg-amber-500/15',
    badgeText: 'text-amber-700 dark:text-amber-300',
  },
  blog: {
    icon: PenLine,
    iconWrap: 'bg-amber-100 dark:bg-amber-500/15',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-100 dark:bg-amber-500/15',
    badgeText: 'text-amber-700 dark:text-amber-300',
  },
  blog_article: {
    icon: PenLine,
    iconWrap: 'bg-amber-100 dark:bg-amber-500/15',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-100 dark:bg-amber-500/15',
    badgeText: 'text-amber-700 dark:text-amber-300',
  },
  devotional: {
    icon: Sparkles,
    iconWrap: 'bg-sky-100 dark:bg-sky-500/15',
    iconColor: 'text-sky-600 dark:text-sky-400',
    badgeBg: 'bg-sky-100 dark:bg-sky-500/15',
    badgeText: 'text-sky-700 dark:text-sky-300',
  },
  art: {
    icon: ImageIcon,
    iconWrap: 'bg-orange-100 dark:bg-orange-500/15',
    iconColor: 'text-orange-600 dark:text-orange-400',
    badgeBg: 'bg-orange-100 dark:bg-orange-500/15',
    badgeText: 'text-orange-700 dark:text-orange-300',
  },
  event: {
    icon: Calendar,
    iconWrap: 'bg-rose-100 dark:bg-rose-500/15',
    iconColor: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-100 dark:bg-rose-500/15',
    badgeText: 'text-rose-700 dark:text-rose-300',
  },
};

const fallbackStyle: TypeStyle = {
  icon: FileText,
  iconWrap: 'bg-muted',
  iconColor: 'text-muted-foreground',
  badgeBg: 'bg-muted',
  badgeText: 'text-muted-foreground',
};

const typeLabels: Record<string, Record<L, string>> = {
  sermon: { PT: 'Sermão', EN: 'Sermon', ES: 'Sermón' },
  pastoral: { PT: 'Pastoral', EN: 'Pastoral', ES: 'Pastoral' },
  study: { PT: 'Estudo', EN: 'Study', ES: 'Estudio' },
  biblical_study: { PT: 'Estudo', EN: 'Study', ES: 'Estudio' },
  expos: { PT: 'Estudo', EN: 'Study', ES: 'Estudio' },
  article: { PT: 'Artigo', EN: 'Article', ES: 'Artículo' },
  blog: { PT: 'Artigo', EN: 'Article', ES: 'Artículo' },
  blog_article: { PT: 'Artigo', EN: 'Article', ES: 'Artículo' },
  devotional: { PT: 'Devocional', EN: 'Devotional', ES: 'Devocional' },
  art: { PT: 'Arte', EN: 'Art', ES: 'Arte' },
  event: { PT: 'Evento', EN: 'Event', ES: 'Evento' },
};

const sectionTitle: Record<L, string> = {
  PT: 'SUAS CRIAÇÕES RECENTES',
  EN: 'YOUR RECENT CREATIONS',
  ES: 'TUS CREACIONES RECIENTES',
};

const viewAll: Record<L, string> = {
  PT: 'Ver tudo',
  EN: 'View all',
  ES: 'Ver todo',
};

function relativeTime(iso: string, lang: L): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffD = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const dict = {
    edited: { PT: 'Editado', EN: 'Edited', ES: 'Editado' },
    created: { PT: 'Criado', EN: 'Created', ES: 'Creado' },
    yesterday: { PT: 'ontem', EN: 'yesterday', ES: 'ayer' },
    hoursAgo: { PT: (n: number) => `há ${n}h`, EN: (n: number) => `${n}h ago`, ES: (n: number) => `hace ${n}h` },
    daysAgo: { PT: (n: number) => `há ${n} dia${n > 1 ? 's' : ''}`, EN: (n: number) => `${n} day${n > 1 ? 's' : ''} ago`, ES: (n: number) => `hace ${n} día${n > 1 ? 's' : ''}` },
    today: { PT: 'hoje', EN: 'today', ES: 'hoy' },
  };

  if (diffH < 1) return `${dict.created[lang]} ${dict.today[lang]}`;
  if (diffD < 1) return `${dict.created[lang]} ${dict.hoursAgo[lang](diffH)}`;
  if (diffD === 1) return `${dict.created[lang]} ${dict.yesterday[lang]}`;
  return `${dict.created[lang]} ${dict.daysAgo[lang](diffD)}`;
}

export function RecentGenerations() {
  const { user } = useAuth();
  const { lang: cur } = useLanguage();
  const lang = (cur || 'PT') as L;
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('materials')
      .select('id, title, type, passage, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => {
        if (data) setItems(data);
      });
  }, [user]);

  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-muted-foreground">
          {sectionTitle[lang]}
        </p>
        <Link
          to="/biblioteca"
          className="text-[11px] font-semibold text-primary flex items-center gap-0.5 hover:underline"
        >
          {viewAll[lang]}
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {items.map((m) => {
          const style = typeStyles[m.type] || fallbackStyle;
          const Icon = style.icon;
          const label = typeLabels[m.type]?.[lang] || m.type;

          // Route to the right editor based on material type
          const isSermon = /^(sermon|pastoral)$/i.test(m.type);
          const isArticle = /^(article|blog|blog_article)$/i.test(m.type);
          const isStudy = /^(study|biblical_study|expos)$/i.test(m.type);
          const to = isSermon
            ? `/sermoes?materialId=${m.id}`
            : isArticle
              ? `/blog?article=${m.id}`
              : isStudy
                ? `/biblioteca?material=${m.id}`
                : `/biblioteca?material=${m.id}`;

          return (
            <Link
              key={m.id}
              to={to}
              className="group rounded-xl p-3 flex items-center gap-3 bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <span
                className={`h-9 w-9 rounded-lg ${style.iconWrap} flex items-center justify-center shrink-0`}
              >
                <Icon className={`h-4 w-4 ${style.iconColor}`} />
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {m.title}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {relativeTime(m.created_at, lang)}
                </p>
              </div>

              <span
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${style.badgeBg} ${style.badgeText} shrink-0`}
              >
                {label}
              </span>

              <button
                type="button"
                aria-label="More"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 transition-colors"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
