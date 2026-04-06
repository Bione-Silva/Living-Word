import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { captureNodeAsPng } from './export-utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, Share2, Linkedin, ExternalLink, CheckCircle2 } from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

const labels: Record<L, {
  publishTitle: string; shareNative: string; postLinkedIn: string; savePin: string;
  postX: string; instagram: string; facebook: string; tiktok: string; comingSoon: string;
  auditTooltip: string; captionLabel: string; publish: string; cancel: string;
  shareSuccess: string; shareError: string; openApis: string; bigTech: string;
  uploading: string; publishing: string; published: string; uploadError: string;
  captionPlaceholder: string;
}> = {
  PT: {
    publishTitle: '📡 Publicar Agora',
    shareNative: '📲 Compartilhar',
    postLinkedIn: 'Postar no LinkedIn',
    savePin: 'Salvar no Pinterest',
    postX: 'Postar no X (Twitter)',
    instagram: 'Instagram Business',
    facebook: 'Facebook Pages',
    tiktok: 'TikTok Direto',
    comingSoon: 'Em Breve',
    auditTooltip: 'Estamos passando pela auditoria de segurança corporativa da Meta/ByteDance para seu conforto. Liberado nas próximas semanas!',
    captionLabel: 'Escreva a legenda que acompanhará sua publicação',
    publish: 'Publicar',
    cancel: 'Cancelar',
    shareSuccess: 'Compartilhado com sucesso!',
    shareError: 'Erro ao compartilhar',
    openApis: 'Redes Disponíveis',
    bigTech: 'Em Avaliação',
    uploading: 'Enviando imagem...',
    publishing: 'Publicando...',
    published: 'Publicado com sucesso! 🎉',
    uploadError: 'Erro ao enviar imagem',
    captionPlaceholder: 'Escreva sua legenda aqui...',
  },
  EN: {
    publishTitle: '📡 Publish Now',
    shareNative: '📲 Share',
    postLinkedIn: 'Post to LinkedIn',
    savePin: 'Save to Pinterest',
    postX: 'Post to X (Twitter)',
    instagram: 'Instagram Business',
    facebook: 'Facebook Pages',
    tiktok: 'TikTok Direct',
    comingSoon: 'Coming Soon',
    auditTooltip: "We're undergoing Meta/ByteDance corporate security audit for your comfort. Available in the coming weeks!",
    captionLabel: 'Write the caption for your post',
    publish: 'Publish',
    cancel: 'Cancel',
    shareSuccess: 'Shared successfully!',
    shareError: 'Error sharing',
    openApis: 'Available Networks',
    bigTech: 'Under Review',
    uploading: 'Uploading image...',
    publishing: 'Publishing...',
    published: 'Published successfully! 🎉',
    uploadError: 'Error uploading image',
    captionPlaceholder: 'Write your caption here...',
  },
  ES: {
    publishTitle: '📡 Publicar Ahora',
    shareNative: '📲 Compartir',
    postLinkedIn: 'Publicar en LinkedIn',
    savePin: 'Guardar en Pinterest',
    postX: 'Publicar en X (Twitter)',
    instagram: 'Instagram Business',
    facebook: 'Facebook Pages',
    tiktok: 'TikTok Directo',
    comingSoon: 'Próximamente',
    auditTooltip: 'Estamos pasando por la auditoría de seguridad corporativa de Meta/ByteDance para su comodidad. ¡Disponible en las próximas semanas!',
    captionLabel: 'Escribe la leyenda para tu publicación',
    publish: 'Publicar',
    cancel: 'Cancelar',
    shareSuccess: '¡Compartido con éxito!',
    shareError: 'Error al compartir',
    openApis: 'Redes Disponibles',
    bigTech: 'En Evaluación',
    uploading: 'Subiendo imagen...',
    publishing: 'Publicando...',
    published: '¡Publicado con éxito! 🎉',
    uploadError: 'Error al subir imagen',
    captionPlaceholder: 'Escribe tu leyenda aquí...',
  },
};

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  );
}

type Network = 'linkedin' | 'pinterest' | 'x';

interface Props {
  targetRef: React.RefObject<HTMLDivElement>;
  lang: L;
}

export function PublishPanel({ targetRef, lang }: Props) {
  const l = labels[lang];
  const { user } = useAuth();
  const [sharing, setSharing] = useState(false);
  const [captionModal, setCaptionModal] = useState<{ network: Network } | null>(null);
  const [caption, setCaption] = useState('');
  const [publishState, setPublishState] = useState<'idle' | 'uploading' | 'publishing' | 'done'>('idle');

  const getImageBlob = useCallback(async (): Promise<Blob | null> => {
    if (!targetRef.current) return null;
    const dataUrl = await captureNodeAsPng(targetRef.current);
    const res = await fetch(dataUrl);
    return res.blob();
  }, [targetRef]);

  const handleNativeShare = useCallback(async () => {
    setSharing(true);
    try {
      const blob = await getImageBlob();
      if (!blob) return;
      const file = new File([blob], 'post.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Living Word' });
        toast.success(l.shareSuccess);
      } else {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'post.png';
        a.click();
        URL.revokeObjectURL(url);
        toast.success(lang === 'PT' ? 'Imagem salva! Compartilhe manualmente.' : lang === 'EN' ? 'Image saved! Share manually.' : '¡Imagen guardada! Comparte manualmente.');
      }
    } catch {
      // user cancelled
    } finally {
      setSharing(false);
    }
  }, [getImageBlob, l, lang]);

  const openCaptionModal = (network: Network) => {
    setCaption('');
    setPublishState('idle');
    setCaptionModal({ network });
  };

  const handlePublish = useCallback(async () => {
    if (!captionModal || !user) return;

    setPublishState('uploading');

    try {
      // 1. Capture image blob
      const blob = await getImageBlob();
      if (!blob) throw new Error('No image');

      // 2. Upload to Supabase Storage
      const fileName = `${user.id}/${Date.now()}-${captionModal.network}.png`;
      const { error: uploadError } = await supabase.storage
        .from('social_arts')
        .upload(fileName, blob, { contentType: 'image/png' });

      if (uploadError) throw uploadError;

      // 3. Get public URL
      const { data: urlData } = supabase.storage
        .from('social_arts')
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;

      // 4. Invoke edge function
      setPublishState('publishing');

      const { data, error } = await supabase.functions.invoke('publish-social', {
        body: {
          platform: captionModal.network,
          imageUrl,
          message: caption || 'Criado com Palavra Viva ✨',
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // 5. Success
      setPublishState('done');
      toast.success(l.published);

      setTimeout(() => {
        setCaptionModal(null);
        setPublishState('idle');
      }, 2000);

    } catch (err: any) {
      console.error('Publish error:', err);
      toast.error(err?.message || l.shareError);
      setPublishState('idle');
    }
  }, [captionModal, caption, getImageBlob, user, l]);

  const networkLabels: Record<Network, string> = {
    linkedin: l.postLinkedIn,
    pinterest: l.savePin,
    x: l.postX,
  };

  const networkIcons: Record<Network, React.ReactNode> = {
    linkedin: <Linkedin className="h-5 w-5 text-primary" />,
    pinterest: <PinterestIcon className="h-5 w-5 text-primary" />,
    x: <XIcon className="h-5 w-5 text-primary" />,
  };

  const isPublishing = publishState === 'uploading' || publishState === 'publishing';

  return (
    <TooltipProvider>
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
          {l.publishTitle}
        </h3>

        {/* 1. Native Share */}
        <Button
          onClick={handleNativeShare}
          disabled={sharing}
          className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          size="lg"
        >
          {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
          {l.shareNative}
        </Button>

        {/* 2. Open API networks */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{l.openApis}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button variant="outline" className="gap-2 border-border text-foreground hover:bg-accent hover:text-accent-foreground font-medium" onClick={() => openCaptionModal('linkedin')}>
              <Linkedin className="h-4 w-4" /> LinkedIn
            </Button>
            <Button variant="outline" className="gap-2 border-border text-foreground hover:bg-accent hover:text-accent-foreground font-medium" onClick={() => openCaptionModal('pinterest')}>
              <PinterestIcon className="h-4 w-4" /> Pinterest
            </Button>
            <Button variant="outline" className="gap-2 border-border text-foreground hover:bg-accent hover:text-accent-foreground font-medium" onClick={() => openCaptionModal('x')}>
              <XIcon className="h-4 w-4" /> X (Twitter)
            </Button>
          </div>
        </div>

        {/* 3. Big Tech — Coming Soon */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{l.bigTech}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { label: l.instagram, Icon: InstagramIcon },
              { label: l.facebook, Icon: FacebookIcon },
              { label: l.tiktok, Icon: TikTokIcon },
            ].map(({ label, Icon }) => (
              <Tooltip key={label}>
                <TooltipTrigger asChild>
                  <div>
                    <Button variant="outline" className="w-full gap-2 border-border text-muted-foreground font-medium opacity-50 cursor-not-allowed" disabled>
                      <Icon className="h-4 w-4" />
                      <span className="truncate">{label}</span>
                      <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 shrink-0">{l.comingSoon}</Badge>
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[260px] text-center text-xs">{l.auditTooltip}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>

      {/* Caption + Publish Modal — clean design */}
      <Dialog open={!!captionModal} onOpenChange={(open) => { if (!open && !isPublishing) setCaptionModal(null); }}>
        <DialogContent className="sm:max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-foreground">
              {captionModal && networkIcons[captionModal.network]}
              <span>{captionModal ? networkLabels[captionModal.network] : ''}</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {l.captionLabel}
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder={l.captionPlaceholder}
            className="min-h-[120px] bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary resize-none"
            disabled={isPublishing}
          />

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => setCaptionModal(null)}
              disabled={isPublishing}
              className="text-muted-foreground hover:text-foreground"
            >
              {l.cancel}
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isPublishing || publishState === 'done'}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold min-w-[140px]"
            >
              {publishState === 'uploading' ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {l.uploading}</>
              ) : publishState === 'publishing' ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {l.publishing}</>
              ) : publishState === 'done' ? (
                <><CheckCircle2 className="h-4 w-4" /> {l.published}</>
              ) : (
                <><ExternalLink className="h-4 w-4" /> {l.publish}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
