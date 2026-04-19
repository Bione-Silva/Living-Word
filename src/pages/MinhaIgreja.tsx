import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Church, MapPin, Users, BookOpen, Mic, Palette,
  ArrowRight, Sparkles, UserPlus, Settings,
} from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

interface TeamMember {
  id: string;
  email: string;
  role: string;
  status: string;
}

const COPY = {
  title: { PT: 'Minha Igreja', EN: 'My Church', ES: 'Mi Iglesia' },
  subtitle: {
    PT: 'O perfil pastoral que orienta toda a IA do Living Word.',
    EN: 'The pastoral profile that guides all of Living Word AI.',
    ES: 'El perfil pastoral que guía toda la IA de Living Word.',
  },
  identity: { PT: 'Identidade Pastoral', EN: 'Pastoral Identity', ES: 'Identidad Pastoral' },
  context: { PT: 'Contexto da Congregação', EN: 'Congregation Context', ES: 'Contexto de la Congregación' },
  team: { PT: 'Equipe Ministerial', EN: 'Ministry Team', ES: 'Equipo Ministerial' },
  brand: { PT: 'Identidade Visual do Blog', EN: 'Blog Visual Identity', ES: 'Identidad Visual del Blog' },
  edit: { PT: 'Editar', EN: 'Edit', ES: 'Editar' },
  invite: { PT: 'Convidar membro', EN: 'Invite member', ES: 'Invitar miembro' },
  manageTeam: { PT: 'Gerenciar equipe', EN: 'Manage team', ES: 'Gestionar equipo' },
  emptyTeam: {
    PT: 'Nenhum membro ainda. Convide co-pastores e líderes.',
    EN: 'No members yet. Invite co-pastors and leaders.',
    ES: 'Sin miembros aún. Invita co-pastores y líderes.',
  },
  notSet: { PT: 'Não definido', EN: 'Not set', ES: 'No definido' },
  pending: { PT: 'Pendente', EN: 'Pending', ES: 'Pendiente' },
  accepted: { PT: 'Ativo', EN: 'Active', ES: 'Activo' },
  completeProfile: {
    PT: 'Complete seu perfil para que a IA gere conteúdo realmente seu.',
    EN: 'Complete your profile so the AI generates content that is truly yours.',
    ES: 'Completa tu perfil para que la IA genere contenido realmente tuyo.',
  },
  completeCta: { PT: 'Completar perfil', EN: 'Complete profile', ES: 'Completar perfil' },
  doctrine: { PT: 'Doutrina', EN: 'Doctrine', ES: 'Doctrina' },
  tone: { PT: 'Tom pastoral', EN: 'Pastoral tone', ES: 'Tono pastoral' },
  preachingStyle: { PT: 'Estilo de pregação', EN: 'Preaching style', ES: 'Estilo de predicación' },
  audience: { PT: 'Audiência', EN: 'Audience', ES: 'Audiencia' },
  bibleVersion: { PT: 'Versão bíblica', EN: 'Bible version', ES: 'Versión bíblica' },
  church: { PT: 'Igreja', EN: 'Church', ES: 'Iglesia' },
  role: { PT: 'Função', EN: 'Role', ES: 'Rol' },
  location: { PT: 'Localização', EN: 'Location', ES: 'Ubicación' },
  denomination: { PT: 'Denominação', EN: 'Denomination', ES: 'Denominación' },
  blogStyle: { PT: 'Estilo do blog', EN: 'Blog style', ES: 'Estilo del blog' },
  themeColor: { PT: 'Cor do tema', EN: 'Theme color', ES: 'Color del tema' },
  font: { PT: 'Tipografia', EN: 'Typography', ES: 'Tipografía' },
};

export default function MinhaIgreja() {
  const { profile, loading } = useAuth();
  const { lang } = useLanguage();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from('team_members')
        .select('id, email, role, status')
        .order('created_at', { ascending: false });
      if (alive) {
        setMembers(data || []);
        setLoadingTeam(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const tr = (k: keyof typeof COPY) => COPY[k][lang as L] || COPY[k].PT;

  const profileIncomplete = !profile?.doctrine || !profile?.pastoral_voice || !profile?.church_name;

  const identityFields = [
    { label: tr('doctrine'), value: profile?.doctrine },
    { label: tr('tone'), value: profile?.pastoral_voice },
    { label: tr('preachingStyle'), value: profile?.preaching_style },
    { label: tr('audience'), value: profile?.audience },
    { label: tr('bibleVersion'), value: profile?.bible_version },
  ];

  const contextFields = [
    { label: tr('church'), value: profile?.church_name, icon: Church },
    { label: tr('role'), value: profile?.church_role, icon: Mic },
    { label: tr('denomination'), value: profile?.denomination, icon: BookOpen },
    {
      label: tr('location'),
      value: [profile?.city, profile?.state, profile?.country].filter(Boolean).join(', ') || null,
      icon: MapPin,
    },
  ];

  const brandFields = [
    { label: tr('themeColor'), value: profile?.theme_color },
    { label: tr('font'), value: profile?.font_family },
    { label: tr('blogStyle'), value: profile?.layout_style },
  ];

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-3">
            <Church className="h-7 w-7 text-primary" />
            {tr('title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{tr('subtitle')}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/configuracoes">
            <Settings className="h-4 w-4 mr-2" />
            {tr('edit')}
          </Link>
        </Button>
      </div>

      {/* Onboarding nudge */}
      {profileIncomplete && (
        <Card className="p-5 border-primary/30 bg-primary/5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">{tr('completeProfile')}</p>
              <Button asChild size="sm" className="mt-3">
                <Link to="/onboarding">
                  {tr('completeCta')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Identidade Pastoral */}
      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
          <Mic className="h-4 w-4 text-primary" />
          {tr('identity')}
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {identityFields.map((f) => (
            <div key={f.label} className="border-b border-border/50 pb-2">
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{f.label}</dt>
              <dd className="text-sm text-foreground mt-1 capitalize">
                {f.value || <span className="italic text-muted-foreground/70">{tr('notSet')}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      {/* Contexto da Congregação */}
      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          {tr('context')}
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {contextFields.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="flex items-start gap-3 border-b border-border/50 pb-2">
                <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{f.label}</dt>
                  <dd className="text-sm text-foreground mt-1 truncate">
                    {f.value || <span className="italic text-muted-foreground/70">{tr('notSet')}</span>}
                  </dd>
                </div>
              </div>
            );
          })}
        </dl>
      </Card>

      {/* Identidade Visual do Blog */}
      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          {tr('brand')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {brandFields.map((f) => (
            <div key={f.label} className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{f.label}</p>
              <p className="text-sm text-foreground mt-1 capitalize">
                {f.value || <span className="italic text-muted-foreground/70">{tr('notSet')}</span>}
              </p>
            </div>
          ))}
        </div>
        {profile?.blog_handle && (
          <Button asChild variant="ghost" size="sm" className="mt-4">
            <Link to={`/blog/${profile.blog_handle}`} target="_blank">
              {profile.blog_handle}.livingword.app
              <ArrowRight className="h-3.5 w-3.5 ml-2" />
            </Link>
          </Button>
        )}
      </Card>

      {/* Equipe Ministerial */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            {tr('team')}
          </h2>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/dashboard">
              <UserPlus className="h-4 w-4 mr-2" />
              {tr('manageTeam')}
            </Link>
          </Button>
        </div>

        {loadingTeam ? (
          <Skeleton className="h-20 w-full" />
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-6 text-center">{tr('emptyTeam')}</p>
        ) : (
          <ul className="divide-y divide-border">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{m.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
                </div>
                <Badge variant={m.status === 'accepted' ? 'default' : 'outline'} className="text-[10px]">
                  {m.status === 'accepted' ? tr('accepted') : tr('pending')}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
