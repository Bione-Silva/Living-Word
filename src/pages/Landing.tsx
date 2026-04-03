import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen, FileText, Heart, Film, Languages, Users, PenTool,
  Check, X as XIcon, Sparkles, ArrowRight, Crown
} from 'lucide-react';

const formats = [
  { icon: BookOpen, name: { PT: 'Sermão', EN: 'Sermon', ES: 'Sermón' }, free: true },
  { icon: FileText, name: { PT: 'Esboço', EN: 'Outline', ES: 'Esquema' }, free: true },
  { icon: Heart, name: { PT: 'Devocional', EN: 'Devotional', ES: 'Devocional' }, free: true },
  { icon: Film, name: { PT: 'Reels', EN: 'Reels', ES: 'Reels' }, free: false },
  { icon: Languages, name: { PT: 'Bilíngue', EN: 'Bilingual', ES: 'Bilingüe' }, free: false },
  { icon: Users, name: { PT: 'Célula', EN: 'Cell Group', ES: 'Célula' }, free: false },
  { icon: PenTool, name: { PT: 'Artigo de Blog', EN: 'Blog Article', ES: 'Artículo de Blog' }, free: false },
];

const plans = [
  {
    name: { PT: 'Grátis', EN: 'Free', ES: 'Gratis' },
    price: '$0',
    features: { PT: ['5 gerações/mês', '3 formatos', 'Blog com watermark', '1 artigo de blog'], EN: ['5 generations/month', '3 formats', 'Blog with watermark', '1 blog article'], ES: ['5 generaciones/mes', '3 formatos', 'Blog con marca de agua', '1 artículo de blog'] },
    cta: { PT: 'Começar grátis', EN: 'Start free', ES: 'Empezar gratis' },
    featured: false,
  },
  {
    name: { PT: 'Pastoral', EN: 'Pastoral', ES: 'Pastoral' },
    price: '$9',
    features: { PT: ['40 gerações/mês', 'Todos os 7 formatos', 'Sem watermark', 'Domínio próprio', 'Vozes pastorais premium'], EN: ['40 generations/month', 'All 7 formats', 'No watermark', 'Custom domain', 'Premium pastoral voices'], ES: ['40 generaciones/mes', 'Los 7 formatos', 'Sin marca de agua', 'Dominio propio', 'Voces pastorales premium'] },
    cta: { PT: '7 dias grátis', EN: '7 days free', ES: '7 días gratis' },
    featured: true,
  },
  {
    name: { PT: 'Church', EN: 'Church', ES: 'Iglesia' },
    price: '$29',
    features: { PT: ['Equipe + multi-autor', '150 gerações/mês', 'API WordPress', 'Calendário editorial'], EN: ['Team + multi-author', '150 generations/month', 'WordPress API', 'Editorial calendar'], ES: ['Equipo + multi-autor', '150 generaciones/mes', 'API WordPress', 'Calendario editorial'] },
    cta: { PT: '7 dias grátis', EN: '7 days free', ES: '7 días gratis' },
    featured: false,
  },
  {
    name: { PT: 'Ministry', EN: 'Ministry', ES: 'Ministerio' },
    price: '$79',
    features: { PT: ['White label', 'Gerações ilimitadas', 'Suporte prioritário', 'Treinamento personalizado'], EN: ['White label', 'Unlimited generations', 'Priority support', 'Custom training'], ES: ['White label', 'Generaciones ilimitadas', 'Soporte prioritario', 'Entrenamiento personalizado'] },
    cta: { PT: 'Falar com equipe', EN: 'Contact team', ES: 'Contactar equipo' },
    featured: false,
  },
];

export default function Landing() {
  const { lang, t } = useLanguage();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <span className="font-display text-2xl font-bold text-gradient-gold">Living Word</span>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link to="/login">
              <Button variant="ghost" size="sm">{t('nav.login')}</Button>
            </Link>
            <Link to="/cadastro">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                {t('nav.signup')}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="relative container mx-auto text-center px-4">
          <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6 animate-fade-in">
            {t('hero.title')}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.15s' }}>
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Link to="/cadastro">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-base px-8 glow-amber">
                <Sparkles className="h-5 w-5" />
                {t('hero.cta')}
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="gap-2 text-base px-8 border-border/50">
              {t('hero.cta2')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-4xl font-bold text-center mb-14">{t('how.title')}</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[1, 2, 3].map((step) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/15 text-primary flex items-center justify-center text-2xl font-display font-bold mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{t(`how.step${step}.title`)}</h3>
                <p className="text-muted-foreground text-sm">{t(`how.step${step}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formats */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-4xl font-bold text-center mb-14">{t('formats.title')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 max-w-5xl mx-auto">
            {formats.map((fmt, i) => {
              const Icon = fmt.icon;
              return (
                <Card key={i} className="glass-card hover:border-primary/40 transition-colors group relative">
                  <CardContent className="p-5 text-center">
                    <Icon className="h-8 w-8 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-medium">{fmt.name[lang]}</p>
                    {!fmt.free && (
                      <Badge variant="secondary" className="mt-2 text-[10px]">
                        <Crown className="h-3 w-3 mr-1" /> Pastoral
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-4xl font-bold text-center mb-4">{t('pricing.title')}</h2>
          <p className="text-muted-foreground text-center mb-14">{t('upgrade.trial')}</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, i) => (
              <Card key={i} className={`glass-card relative overflow-hidden ${plan.featured ? 'border-primary ring-1 ring-primary/30 glow-amber' : ''}`}>
                {plan.featured && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                    Popular
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="font-display text-xl font-semibold mb-2">{plan.name[lang]}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.price !== '$0' && <span className="text-sm text-muted-foreground">{t('pricing.month')}</span>}
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features[lang].map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/cadastro">
                    <Button className={`w-full ${plan.featured ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`} variant={plan.featured ? 'default' : 'outline'}>
                      {plan.cta[lang]}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <span className="font-display text-xl font-bold text-gradient-gold">Living Word</span>
          <p className="text-sm text-muted-foreground mt-3">{t('footer.tagline')}</p>
          <p className="text-xs text-muted-foreground/50 mt-4">© {new Date().getFullYear()} Living Word. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
