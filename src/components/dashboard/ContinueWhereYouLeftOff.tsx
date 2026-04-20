import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Mic, BookOpen, ImageIcon, Calendar, ChevronRight } from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

const L10N = {
  section: { PT: 'CONTINUE DE ONDE PAROU', EN: 'CONTINUE WHERE YOU LEFT OFF', ES: 'CONTINÚA DONDE LO DEJASTE' },
  viewAll: { PT: 'Ver tudo', EN: 'View all', ES: 'Ver todo' },
  sermon: { PT: 'Esboço de Sermão', EN: 'Sermon Outline', ES: 'Esquema de Sermón' },
  study: { PT: 'Estudo Bíblico', EN: 'Bible Study', ES: 'Estudio Bíblico' },
  social: { PT: 'Estúdio Social', EN: 'Social Studio', ES: 'Estudio Social' },
  calendar: { PT: 'Calendário', EN: 'Calendar', ES: 'Calendario' },
  none: { PT: 'Nenhum em andamento', EN: 'Nothing in progress', ES: 'Ninguno en curso' },
  start: { PT: 'Começar', EN: 'Start', ES: 'Comenzar' },
  agoH: { PT: 'há {n}h', EN: '{n}h ago', ES: 'hace {n}h' },
  agoD: { PT: 'há {n} dias', EN: '{n}d ago', ES: 'hace {n} días' },
  today: { PT: 'hoje', EN: 'today', ES: 'hoy' },
  pct: { PT: 'concluído', EN: 'complete', ES: 'completo' },
  upcomingIn: { PT: 'em {n} dias', EN: 'in {n} days', ES: 'en {n} días' },
} satisfies Record<string, Record<L, string>>;

interface CardItem {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  type: string;
  title: string;
  subtitle: string;
  progress: number;
  progressColor: string;
  to: string;
}

function timeAgo(iso: string, lang: L): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000 / 60 / 60;
  if (diff < 24) return L10N.agoH[lang].replace('{n}', Math.max(1, Math.round(diff)).toString());
  return L10N.agoD[lang].replace('{n}', Math.round(diff / 24).toString());
}

export function ContinueWhereYouLeftOff() {
  const { user } = useAuth();
  const { lang: cur } = useLanguage();
  const lang = (cur || 'PT') as L;
  const [cards, setCards] = useState<CardItem[]>([]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      // last sermon
      const { data: sermon } = await supabase
        .from('materials')
        .select('id, title, updated_at')
        .eq('user_id', user.id)
        .in('type', ['sermon', 'pastoral'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // last bible study
      const { data: study } = await supabase
        .from('materials')
        .select('id, title, updated_at, passage')
        .eq('user_id', user.id)
        .in('type', ['biblical_study', 'study'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // last social art
      const { data: art } = await supabase
        .from('social_arts')
        .select('id, title, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // next event
      const { data: event } = await supabase
        .from('editorial_queue')
        .select('id, scheduled_at, materials(title)')
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      const built: CardItem[] = [];

      if (sermon) {
        built.push({
          icon: Mic,
          iconBg: 'bg-primary/10',
          iconColor: 'text-primary',
          type: L10N.sermon[lang],
          title: sermon.title,
          subtitle: `${lang === 'PT' ? 'Editado' : lang === 'EN' ? 'Edited' : 'Editado'} ${timeAgo(sermon.updated_at, lang)}`,
          progress: 75,
          progressColor: 'bg-emerald-500',
          to: `/sermoes`,
        });
      }
      if (study) {
        built.push({
          icon: BookOpen,
          iconBg: 'bg-emerald-500/10',
          iconColor: 'text-emerald-500',
          type: L10N.study[lang],
          title: study.title || study.passage || '—',
          subtitle: `${lang === 'PT' ? 'Última leitura' : lang === 'EN' ? 'Last read' : 'Última lectura'} ${timeAgo(study.updated_at, lang)}`,
          progress: 40,
          progressColor: 'bg-blue-500',
          to: `/estudos`,
        });
      }
      if (art) {
        built.push({
          icon: ImageIcon,
          iconBg: 'bg-orange-500/10',
          iconColor: 'text-orange-500',
          type: L10N.social[lang],
          title: art.title || (lang === 'PT' ? 'Arte sem título' : lang === 'EN' ? 'Untitled art' : 'Arte sin título'),
          subtitle: `${lang === 'PT' ? 'Criado' : lang === 'EN' ? 'Created' : 'Creado'} ${timeAgo(art.created_at, lang)}`,
          progress: 60,
          progressColor: 'bg-orange-500',
          to: `/social-studio`,
        });
      }
      if (event) {
        const days = Math.max(1, Math.round((new Date(event.scheduled_at).getTime() - Date.now()) / 1000 / 60 / 60 / 24));
        built.push({
          icon: Calendar,
          iconBg: 'bg-pink-500/10',
          iconColor: 'text-pink-500',
          type: L10N.calendar[lang],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          title: (event as any).materials?.title || '—',
          subtitle: L10N.upcomingIn[lang].replace('{n}', String(days)),
          progress: 100 - Math.min(days * 14, 90),
          progressColor: 'bg-pink-500',
          to: `/calendario`,
        });
      }

      setCards(built);
    })();
  }, [user, lang]);

  if (cards.length === 0) return null;

  return (
    <section className="min-w-0 w-full">
      <div className="flex items-center justify-between mb-3 px-0.5 gap-2 min-w-0">
        <p className="text-[10px] font-normal tracking-[0.18em] uppercase text-muted-foreground truncate">
          {L10N.section[lang]}
        </p>
        <Link to="/biblioteca" className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-0.5 shrink-0">
          {L10N.viewAll[lang]} <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div
        className={`grid gap-3 grid-cols-1 sm:grid-cols-2 min-w-0 ${
          cards.length >= 4 ? 'xl:grid-cols-4' : cards.length === 3 ? 'xl:grid-cols-3' : ''
        }`}
      >
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Link
              key={i}
              to={c.to}
              className="rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all px-3.5 py-3 flex flex-col gap-2 group min-w-0 overflow-hidden"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className={`h-9 w-9 rounded-lg ${c.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-4 w-4 ${c.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground truncate">
                    {c.type}
                  </p>
                  <p className="text-[13px] font-medium text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors break-words">
                    {c.title}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground -mt-1 truncate">{c.subtitle}</p>
              <div className="mt-auto min-w-0">
                <div className="text-[10px] font-medium text-foreground/70 mb-1">
                  {c.progress}% {L10N.pct[lang]}
                </div>
                <div className="h-[3px] rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full ${c.progressColor} transition-all`}
                    style={{ width: `${c.progress}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
