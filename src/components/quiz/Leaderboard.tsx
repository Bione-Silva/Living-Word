import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal } from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  title: { PT: 'Ranking Global', EN: 'Global Ranking', ES: 'Ranking Global' },
  xp: { PT: 'XP', EN: 'XP', ES: 'XP' },
  you: { PT: 'Você', EN: 'You', ES: 'Tú' },
  empty: { PT: 'Nenhum jogador ainda.', EN: 'No players yet.', ES: 'Ningún jugador aún.' },
} satisfies Record<string, Record<L, string>>;

interface LeaderboardEntry {
  user_id: string;
  total_xp: number;
  level: number;
  games_played: number;
  full_name?: string;
}

export function Leaderboard() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('quiz_scores')
        .select('user_id, total_xp, level, games_played')
        .order('total_xp', { ascending: false })
        .limit(20);

      if (!data) return;

      // Fetch names
      const userIds = data.map(d => d.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const nameMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      const enriched = data.map(d => ({
        ...d,
        full_name: nameMap.get(d.user_id) || '—',
      }));

      setEntries(enriched);

      if (user) {
        const rank = enriched.findIndex(e => e.user_id === user.id);
        setUserRank(rank >= 0 ? rank + 1 : null);
      }
    };
    load();
  }, [user]);

  const medalColor = (i: number) => {
    if (i === 0) return 'text-yellow-500';
    if (i === 1) return 'text-gray-400';
    if (i === 2) return 'text-amber-700';
    return 'text-muted-foreground';
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">{labels.title[lang]}</h3>
        {userRank && (
          <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
            #{userRank}
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">{labels.empty[lang]}</p>
      ) : (
        <div className="space-y-1.5">
          {entries.slice(0, 10).map((e, i) => {
            const isMe = user?.id === e.user_id;
            return (
              <div
                key={e.user_id}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                  isMe ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'
                }`}
              >
                <span className={`w-5 text-center font-bold text-xs ${medalColor(i)}`}>
                  {i < 3 ? <Medal className="h-4 w-4 inline" /> : `${i + 1}`}
                </span>
                <span className="flex-1 font-medium text-foreground truncate">
                  {e.full_name?.split(' ')[0] || '—'}
                  {isMe && <span className="ml-1 text-[10px] text-primary">({labels.you[lang]})</span>}
                </span>
                <span className="text-xs font-bold text-primary">{e.total_xp} {labels.xp[lang]}</span>
                <span className="text-[10px] text-muted-foreground">Lv.{e.level}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
