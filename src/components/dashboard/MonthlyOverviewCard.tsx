import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight } from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

const COPY = {
  title: { PT: 'RESUMO DO MÊS', EN: 'MONTH OVERVIEW', ES: 'RESUMEN DEL MES' } as Record<L, string>,
  details: { PT: 'Ver detalhes', EN: 'See details', ES: 'Ver detalles' } as Record<L, string>,
  sermons: { PT: 'Sermões criados', EN: 'Sermons created', ES: 'Sermones creados' } as Record<L, string>,
  studies: { PT: 'Estudos concluídos', EN: 'Studies completed', ES: 'Estudios concluidos' } as Record<L, string>,
  arts: { PT: 'Artes criadas', EN: 'Arts created', ES: 'Artes creadas' } as Record<L, string>,
  usage: { PT: 'Tempo de uso', EN: 'Time spent', ES: 'Tiempo de uso' } as Record<L, string>,
  vsLast: { PT: 'vs mês anterior', EN: 'vs last month', ES: 'vs mes anterior' } as Record<L, string>,
};

function monthRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function pctDelta(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function formatDuration(seconds: number, lang: L): string {
  if (seconds <= 0) return lang === 'EN' ? '0h 0m' : '0h 0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

interface Tile {
  label: string;
  value: string;
  delta: number | null;
}

export function MonthlyOverviewCard() {
  const { user } = useAuth();
  const { lang: cur } = useLanguage();
  const lang = (cur || 'PT') as L;

  const [tiles, setTiles] = useState<Tile[]>([
    { label: COPY.sermons[lang], value: '0', delta: null },
    { label: COPY.studies[lang], value: '0', delta: null },
    { label: COPY.arts[lang], value: '0', delta: null },
    { label: COPY.usage[lang], value: '0h 0m', delta: null },
  ]);

  useEffect(() => {
    if (!user) return;
    const cur = monthRange(0);
    const prev = monthRange(-1);

    void (async () => {
      // Run all counts in parallel
      const countMaterials = (types: string[], range: { start: string; end: string }) =>
        supabase
          .from('materials')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('type', types)
          .gte('created_at', range.start)
          .lt('created_at', range.end);

      const countArts = (range: { start: string; end: string }) =>
        supabase
          .from('social_arts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', range.start)
          .lt('created_at', range.end);

      const sumDuration = (range: { start: string; end: string }) =>
        supabase
          .from('devotional_engagements')
          .select('duration_seconds')
          .eq('user_id', user.id)
          .gte('created_at', range.start)
          .lt('created_at', range.end);

      const [
        sermonsCur, sermonsPrev,
        studiesCur, studiesPrev,
        artsCur, artsPrev,
        timeCur, timePrev,
      ] = await Promise.all([
        countMaterials(['sermon', 'pastoral'], cur),
        countMaterials(['sermon', 'pastoral'], prev),
        countMaterials(['study', 'biblical-study', 'expos'], cur),
        countMaterials(['study', 'biblical-study', 'expos'], prev),
        countArts(cur),
        countArts(prev),
        sumDuration(cur),
        sumDuration(prev),
      ]);

      const totalSeconds = (rows: { duration_seconds: number | null }[] | null) =>
        (rows ?? []).reduce((acc, r) => acc + (r.duration_seconds || 0), 0);

      const sCur = sermonsCur.count ?? 0;
      const sPrev = sermonsPrev.count ?? 0;
      const stCur = studiesCur.count ?? 0;
      const stPrev = studiesPrev.count ?? 0;
      const aCur = artsCur.count ?? 0;
      const aPrev = artsPrev.count ?? 0;
      const tCur = totalSeconds(timeCur.data as any);
      const tPrev = totalSeconds(timePrev.data as any);

      setTiles([
        { label: COPY.sermons[lang], value: String(sCur), delta: pctDelta(sCur, sPrev) },
        { label: COPY.studies[lang], value: String(stCur), delta: pctDelta(stCur, stPrev) },
        { label: COPY.arts[lang], value: String(aCur), delta: pctDelta(aCur, aPrev) },
        { label: COPY.usage[lang], value: formatDuration(tCur, lang), delta: pctDelta(tCur, tPrev) },
      ]);
    })();
  }, [user, lang]);

  if (!user) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] font-bold tracking-[0.18em] uppercase text-foreground">
          {COPY.title[lang]}
        </h3>
        <Link
          to="/calendario"
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
        >
          {COPY.details[lang]} <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-xl border border-border bg-background/60 p-4 flex flex-col gap-1.5"
          >
            <span className="text-[11px] font-medium text-muted-foreground leading-tight">
              {t.label}
            </span>
            <p className="text-2xl font-bold text-foreground leading-none tracking-tight">
              {t.value}
            </p>
            {t.delta !== null ? (
              <p
                className={`text-[11px] font-semibold leading-tight ${
                  t.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {t.delta >= 0 ? '+' : ''}
                {t.delta}% <span className="font-normal text-muted-foreground">{COPY.vsLast[lang]}</span>
              </p>
            ) : (
              <p className="text-[11px] font-normal text-muted-foreground leading-tight">
                — {COPY.vsLast[lang]}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
