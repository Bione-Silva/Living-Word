import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Wand2, BookOpen, ExternalLink, CalendarDays, Library, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();
  const { t } = useLanguage();

  const used = profile?.generations_used || 0;
  const limit = profile?.generations_limit || 5;
  const pct = Math.round((used / limit) * 100);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">{t('dashboard.title')}</h1>

      {/* Blog live card */}
      {profile?.blog_handle && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary">{t('dashboard.blog_live')}</p>
              <a
                href={`https://${profile.blog_handle}.livingword.app`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
              >
                {profile.blog_handle}.livingword.app
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <BookOpen className="h-8 w-8 text-primary/50" />
          </CardContent>
        </Card>
      )}

      {/* Generation counter */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">{t('dashboard.generations')}</p>
            <span className="font-mono text-sm text-muted-foreground">{used}/{limit}</span>
          </div>
          <Progress value={pct} className="h-2" />
          {pct >= 80 && (
            <p className="text-xs text-destructive mt-2">
              <Link to="/upgrade" className="underline">{t('nav.upgrade')}</Link> — desbloqueie mais gerações
            </p>
          )}
        </CardContent>
      </Card>

      {/* Generate CTA */}
      <Link to="/estudio">
        <Card className="border-primary/30 hover:border-primary/60 transition-colors cursor-pointer group">
          <CardContent className="p-8 text-center">
            <Wand2 className="h-12 w-12 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <p className="font-display text-xl font-semibold">{t('dashboard.generate_new')}</p>
          </CardContent>
        </Card>
      </Link>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Wand2, label: t('nav.studio'), path: '/estudio' },
          { icon: BookOpen, label: t('nav.blog'), path: '/blog' },
          { icon: Library, label: t('nav.library'), path: '/biblioteca' },
          { icon: CalendarDays, label: t('nav.calendar'), path: '/calendario' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path}>
              <Card className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4 text-center">
                  <Icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm">{item.label}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
