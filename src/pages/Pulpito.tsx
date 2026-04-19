import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Megaphone, MonitorPlay, Mic, ArrowRight, Plus, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const copy = {
  PT: {
    title: 'Modo Púlpito',
    subtitle: 'Escolha um sermão para abrir no editor. De lá você pode iniciar o Modo Púlpito em tela grande.',
    empty: 'Você ainda não salvou nenhum sermão.',
    emptyCta: 'Criar meu primeiro sermão',
    open: 'Abrir sermão',
    create: 'Novo Sermão',
    badge: 'Premium',
    listLabel: 'Seus sermões salvos',
    loading: 'Carregando…',
  },
  EN: {
    title: 'Pulpit Mode',
    subtitle: 'Pick a sermon to open in the editor. From there you can launch Pulpit Mode full-screen.',
    empty: 'You have no saved sermons yet.',
    emptyCta: 'Create my first sermon',
    open: 'Open sermon',
    create: 'New Sermon',
    badge: 'Premium',
    listLabel: 'Your saved sermons',
    loading: 'Loading…',
  },
  ES: {
    title: 'Modo Púlpito',
    subtitle: 'Elige un sermón para abrirlo en el editor. Desde allí puedes iniciar el Modo Púlpito en pantalla completa.',
    empty: 'Aún no has guardado ningún sermón.',
    emptyCta: 'Crear mi primer sermón',
    open: 'Abrir sermón',
    create: 'Nuevo Sermón',
    badge: 'Premium',
    listLabel: 'Tus sermones guardados',
    loading: 'Cargando…',
  },
};

interface SermonItem {
  id: string;
  title: string;
  passage: string | null;
  updated_at: string;
}

export default function Pulpito() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const t = copy[lang];

  const [sermons, setSermons] = useState<SermonItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from('materials')
        .select('id, title, passage, updated_at')
        .eq('user_id', user.id)
        .eq('type', 'sermon')
        .order('updated_at', { ascending: false })
        .limit(30);
      if (alive) {
        setSermons((data as SermonItem[]) || []);
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user]);

  // Abre o sermão no editor (Criador de Sermão).
  // De lá o usuário decide se quer entrar no Modo Púlpito.
  const openInPulpit = (id: string) => {
    navigate(`/sermoes?materialId=${id}`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-6 sm:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start gap-4">
          <div className="shrink-0 h-14 w-14 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
            <MonitorPlay className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                {t.title}
              </h1>
              <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">
                <Sparkles className="h-2.5 w-2.5 mr-1" />
                {lang === 'PT' ? 'NOVO' : 'NEW'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              {t.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => navigate('/sermoes')} className="gap-2">
          <Plus className="h-4 w-4" />
          {t.create}
        </Button>
      </div>

      {/* List */}
      <div>
        <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3 px-1">
          {t.listLabel}
        </h2>

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : sermons.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <Mic className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">{t.empty}</p>
            <Link to="/sermoes">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t.emptyCta}
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {sermons.map((s) => (
              <button
                key={s.id}
                onClick={() => openInPulpit(s.id)}
                className="w-full text-left group"
              >
                <Card className="p-4 hover:border-primary/40 hover:shadow-md transition-all flex items-center gap-3 group-active:scale-[0.99]">
                  <div className="shrink-0 h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Megaphone className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{s.title}</p>
                    {s.passage && (
                      <p className="text-xs text-muted-foreground truncate">{s.passage}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-primary shrink-0 group-hover:translate-x-0.5 transition-transform">
                    <span className="hidden sm:inline">{t.open}</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
