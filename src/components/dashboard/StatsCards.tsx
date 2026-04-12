// @ts-nocheck
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Mic, BookOpen, FileText, Heart, BarChart3, Zap } from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

interface StatItem {
  icon: React.ElementType;
  value: number;
  label: Record<L, string>;
}

export function StatsCards() {
  const { user, profile } = useAuth();
  const { lang } = useLanguage();
  const [counts, setCounts] = useState({ sermons: 0, studies: 0, articles: 0, devotionals: 0, total: 0 });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('materials')
        .select('type')
        .eq('user_id', user.id);
      if (!data) return;
      const s = { sermons: 0, studies: 0, articles: 0, devotionals: 0, total: data.length };
      for (const m of data) {
        if (m.type === 'sermon' || m.type === 'pastoral') s.sermons++;
        else if (m.type === 'biblical_study' || m.type === 'study') s.studies++;
        else if (m.type === 'article' || m.type === 'blog' || m.type === 'blog_article') s.articles++;
        else if (m.type === 'devotional') s.devotionals++;
      }
      setCounts(s);
    };
    fetch();
  }, [user]);

  const used = profile?.generations_used || 0;

  const stats: StatItem[] = [
    { icon: Mic, value: counts.sermons, label: { PT: 'Sermões', EN: 'Sermons', ES: 'Sermones' } },
    { icon: BookOpen, value: counts.studies, label: { PT: 'Estudos', EN: 'Studies', ES: 'Estudios' } },
    { icon: FileText, value: counts.articles, label: { PT: 'Artigos', EN: 'Articles', ES: 'Artículos' } },
    { icon: Heart, value: counts.devotionals, label: { PT: 'Devocionais', EN: 'Devotionals', ES: 'Devocionales' } },
    { icon: BarChart3, value: counts.total, label: { PT: 'Total Criados', EN: 'Total Created', ES: 'Total Creados' } },
    { icon: Zap, value: used, label: { PT: 'Uso do Mês', EN: 'Monthly Use', ES: 'Uso del Mes' } },
  ];

  return (
    <div className="grid grid-cols-6 gap-1.5">
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-2 flex flex-col items-center gap-0.5 text-center"
          >
            <Icon className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span className="text-base font-bold text-foreground leading-none">{s.value}</span>
            <span className="text-[8px] sm:text-[9px] text-muted-foreground leading-tight truncate w-full">{s.label[lang]}</span>
          </div>
        );
      })}
    </div>
  );
}
