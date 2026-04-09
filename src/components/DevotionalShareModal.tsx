import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Copy, Check, Send, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

type L = 'PT' | 'EN' | 'ES';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devotionalTitle: string;
  devotionalVerse: string;
  devotionalDate: string; // YYYY-MM-DD
}

const labels = {
  title: { PT: 'Compartilhe a Palavra de Hoje! 🙌', EN: 'Share Today\'s Word! 🙌', ES: '¡Comparte la Palabra de Hoy! 🙌' },
  desc: {
    PT: 'Quando você compartilha, seus amigos recebem um convite para se cadastrar gratuitamente na Living Word',
    EN: 'When you share, your friends get an invite to sign up for Living Word for free',
    ES: 'Cuando compartes, tus amigos reciben una invitación para registrarse gratis en Living Word',
  },
  copyLink: { PT: 'Copiar Link', EN: 'Copy Link', ES: 'Copiar Link' },
  copied: { PT: 'Link copiado! Compartilhe com seus amigos 🎉', EN: 'Link copied! Share with your friends 🎉', ES: '¡Link copiado! Comparte con tus amigos 🎉' },
  whatsapp: { PT: 'WhatsApp', EN: 'WhatsApp', ES: 'WhatsApp' },
  telegram: { PT: 'Telegram', EN: 'Telegram', ES: 'Telegram' },
  totalClicks: { PT: 'pessoas já acessaram seus links', EN: 'people accessed your links', ES: 'personas accedieron a tus links' },
};

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export function DevotionalShareModal({ open, onOpenChange, devotionalTitle, devotionalVerse, devotionalDate }: Props) {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const l = lang as L;
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [totalClicks, setTotalClicks] = useState(0);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    generateShareLink();
    loadTotalClicks();
  }, [open, user]);

  const generateShareLink = async () => {
    if (!user) return;
    setGenerating(true);

    // Check if share already exists for this user + date
    const { data: existing } = await supabase
      .from('devocional_compartilhamentos' as any)
      .select('share_token')
      .eq('user_id', user.id)
      .eq('devocional_date', devotionalDate)
      .single();

    if (existing) {
      setShareUrl(`${window.location.origin}/devocional/publico/${(existing as any).share_token}`);
      setGenerating(false);
      return;
    }

    // Create new share
    const token = crypto.randomUUID();
    const { error } = await supabase
      .from('devocional_compartilhamentos' as any)
      .insert({
        user_id: user.id,
        devocional_date: devotionalDate,
        share_token: token,
      } as any);

    if (!error) {
      setShareUrl(`${window.location.origin}/devocional/publico/${token}`);
    }
    setGenerating(false);
  };

  const loadTotalClicks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('devocional_compartilhamentos' as any)
      .select('cliques')
      .eq('user_id', user.id);

    if (data) {
      const total = (data as any[]).reduce((sum: number, r: any) => sum + (r.cliques || 0), 0);
      setTotalClicks(total);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success(labels.copied[l]);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleWhatsApp = () => {
    const text = `✨ *${devotionalTitle}*\n📖 ${devotionalVerse}\n\nLeia o devocional de hoje:\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleTelegram = () => {
    const text = `✨ ${devotionalTitle}\n📖 ${devotionalVerse}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[hsl(36,30%,97%)] border-[hsl(38,40%,80%)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif text-[hsl(24,30%,20%)]">
            {labels.title[l]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Preview */}
          <div className="rounded-xl bg-white border border-[hsl(38,40%,85%)] p-4">
            <p className="font-serif font-bold text-[hsl(24,30%,20%)]">{devotionalTitle}</p>
            <p className="text-sm text-[hsl(38,52%,48%)] mt-1">📖 {devotionalVerse}</p>
          </div>

          {/* Share buttons */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              onClick={handleWhatsApp}
              disabled={!shareUrl}
              className="bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-xl flex items-center gap-2"
            >
              <WhatsAppIcon /> {labels.whatsapp[l]}
            </Button>
            <Button
              onClick={handleTelegram}
              disabled={!shareUrl}
              className="bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl flex items-center gap-2"
            >
              <TelegramIcon /> {labels.telegram[l]}
            </Button>
            <Button
              onClick={handleCopy}
              disabled={!shareUrl}
              variant="outline"
              className="rounded-xl border-[hsl(38,40%,80%)] flex items-center gap-2"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {labels.copyLink[l]}
            </Button>
          </div>

          {/* Description */}
          <p className="text-xs text-[hsl(24,30%,45%)] text-center leading-relaxed">
            {labels.desc[l]}
          </p>

          {/* Stats */}
          {totalClicks > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-[hsl(38,52%,48%)] bg-[hsl(38,52%,58%)]/5 rounded-lg py-2">
              <BarChart3 className="h-4 w-4" />
              <span className="font-semibold">{totalClicks}</span>
              <span>{labels.totalClicks[l]}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
