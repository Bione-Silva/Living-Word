import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Share2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Blog() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const isFree = profile?.plan === 'free';

  const handleShare = (type: 'whatsapp' | 'x' | 'copy', title: string) => {
    const url = `https://${profile?.blog_handle || 'demo'}.livingword.app`;
    if (type === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`, '_blank');
    } else if (type === 'x') {
      window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">{t('nav.blog')}</h1>
        {profile?.blog_handle && (
          <a href={`https://${profile.blog_handle}.livingword.app`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1">
              <ExternalLink className="h-3 w-3" /> Visitar blog
            </Button>
          </a>
        )}
      </div>

      {/* Blog articles placeholder */}
      <div className="grid gap-4">
        {[1, 2].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-mono mb-1">Publicado automaticamente</p>
                  <h3 className="font-display text-lg font-semibold mb-2">Devocional #{i}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    Este devocional foi gerado automaticamente durante o cadastro. Edite ou gere novos conteúdos no Estúdio.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => handleShare('whatsapp', `Devocional #${i}`)}>
                  <MessageCircle className="h-3 w-3" /> WhatsApp
                </Button>
                <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => handleShare('x', `Devocional #${i}`)}>
                  <Share2 className="h-3 w-3" /> X
                </Button>
                <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => handleShare('copy', `Devocional #${i}`)}>
                  Copiar link
                </Button>
              </div>
              {isFree && (
                <p className="text-[10px] text-muted-foreground/60 mt-3">
                  Gerado com Living Word · <a href="/upgrade" className="underline hover:text-primary">Remover marca d'água</a>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Blog limit trigger */}
      {isFree && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5 text-center">
            <p className="text-sm font-medium">Plano Free: 1 artigo de blog por mês</p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">Desbloqueie publicação ilimitada com o Pastoral</p>
            <Button size="sm" className="bg-primary text-primary-foreground" asChild>
              <a href="/upgrade">{t('upgrade.cta')}</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
