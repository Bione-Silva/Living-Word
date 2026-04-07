import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

type L = 'PT' | 'EN' | 'ES';

interface QuickItem {
  icon: string;
  label: Record<L, string>;
  action: () => void;
}

interface QuickAccessBarProps {
  onToolClick: (toolId: string) => void;
}

export function QuickAccessBar({ onToolClick }: QuickAccessBarProps) {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = useState<QuickItem[] | null>(null);

  const defaults: QuickItem[] = [
    { icon: '📖', label: { PT: 'Estúdio Pastoral', EN: 'Pastoral Studio', ES: 'Estudio Pastoral' }, action: () => onToolClick('studio') },
    { icon: '📚', label: { PT: 'Estudo Bíblico', EN: 'Bible Study', ES: 'Estudio Bíblico' }, action: () => navigate('/estudos/novo') },
    { icon: '✍️', label: { PT: 'Blog & Artigos', EN: 'Blog & Articles', ES: 'Blog y Artículos' }, action: () => navigate('/blog') },
    { icon: '🔎', label: { PT: 'Pesquisa', EN: 'Research', ES: 'Investigación' }, action: () => onToolClick('topic-explorer') },
  ];

  useEffect(() => {
    if (!user) return;
    const fetchRecent = async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data } = await supabase
        .from('materials')
        .select('type')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(30);

      if (!data || data.length < 3) return;

      const typeMap: Record<string, QuickItem> = {
        sermon: defaults[0],
        pastoral: defaults[0],
        biblical_study: defaults[1],
        study: defaults[1],
        article: defaults[2],
        blog: defaults[2],
        blog_article: defaults[2],
        devotional: defaults[0],
      };

      const freq: Record<string, number> = {};
      for (const m of data) {
        const item = typeMap[m.type];
        if (item) {
          const key = item.label.PT;
          freq[key] = (freq[key] || 0) + 1;
        }
      }

      const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
      const result: QuickItem[] = [];
      const seen = new Set<string>();

      for (const [key] of sorted) {
        if (result.length >= 4) break;
        if (seen.has(key)) continue;
        seen.add(key);
        const match = Object.values(typeMap).find(t => t.label.PT === key);
        if (match) result.push(match);
      }
      for (const d of defaults) {
        if (result.length >= 4) break;
        if (!seen.has(d.label.PT)) {
          seen.add(d.label.PT);
          result.push(d);
        }
      }
      if (result.length >= 4) setItems(result.slice(0, 4));
    };
    fetchRecent();
  }, [user]);

  const quickTools = items || defaults;

  return (
    <section>
      <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground mb-2.5 px-1">
        {lang === 'PT' ? '⚡ ACESSO RÁPIDO' : lang === 'EN' ? '⚡ QUICK ACCESS' : '⚡ ACCESO RÁPIDO'}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {quickTools.map((qt, i) => (
          <button
            key={i}
            onClick={qt.action}
            className="rounded-xl p-2.5 flex flex-col items-center gap-1.5 text-center transition-all hover:scale-[1.03] active:scale-[0.97] bg-card border border-border shadow-sm"
          >
            <span className="text-lg">{qt.icon}</span>
            <span className="text-[10px] sm:text-[11px] font-medium text-foreground leading-tight line-clamp-2">{qt.label[lang]}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
