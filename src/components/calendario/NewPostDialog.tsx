import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { NETWORK_META, type NetworkKey } from './NetworkFilterBar';

type L = 'PT' | 'EN' | 'ES';

const COPY = {
  title: { PT: 'Novo post', EN: 'New post', ES: 'Nuevo post' },
  network: { PT: 'Rede social', EN: 'Network', ES: 'Red social' },
  caption: { PT: 'Legenda', EN: 'Caption', ES: 'Leyenda' },
  captionPh: {
    PT: 'O que você quer dizer?',
    EN: 'What do you want to say?',
    ES: '¿Qué quieres decir?',
  },
  hashtags: { PT: 'Hashtags', EN: 'Hashtags', ES: 'Hashtags' },
  date: { PT: 'Data', EN: 'Date', ES: 'Fecha' },
  time: { PT: 'Hora', EN: 'Time', ES: 'Hora' },
  imageUrl: { PT: 'URL da imagem (opcional)', EN: 'Image URL (optional)', ES: 'URL de imagen (opcional)' },
  cancel: { PT: 'Cancelar', EN: 'Cancel', ES: 'Cancelar' },
  save: { PT: 'Agendar', EN: 'Schedule', ES: 'Programar' },
  saved: { PT: 'Post agendado!', EN: 'Post scheduled!', ES: '¡Post programado!' },
  fillCaption: {
    PT: 'Escreva uma legenda',
    EN: 'Write a caption',
    ES: 'Escribe una leyenda',
  },
} satisfies Record<string, Record<L, string>>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lang: L;
}

export function NewPostDialog({ open, onOpenChange, lang }: Props) {
  const t = (k: keyof typeof COPY) => COPY[k][lang];
  const { user } = useAuth();
  const qc = useQueryClient();

  const [network, setNetwork] = useState<NetworkKey>('instagram');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('09:00');

  const reset = () => {
    setNetwork('instagram');
    setCaption('');
    setHashtags('');
    setImageUrl('');
    setDate(today);
    setTime('09:00');
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      if (!caption.trim()) throw new Error(t('fillCaption'));
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
      const { error } = await supabase.from('social_calendar_posts').insert({
        user_id: user.id,
        network,
        caption: caption.trim(),
        hashtags: hashtags.trim(),
        image_url: imageUrl.trim() || null,
        scheduled_at: scheduledAt,
        status: 'scheduled',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['social-calendar'] });
      toast.success(t('saved'));
      reset();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{t('title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide">{t('network')}</Label>
            <Select value={network} onValueChange={(v) => setNetwork(v as NetworkKey)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['instagram', 'facebook', 'x', 'linkedin', 'tiktok', 'youtube'] as NetworkKey[]).map(
                  (k) => {
                    const m = NETWORK_META[k];
                    const Icon = m.icon;
                    return (
                      <SelectItem key={k} value={k}>
                        <span className="inline-flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${m.color}`} />
                          {m.label}
                        </span>
                      </SelectItem>
                    );
                  },
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide">{t('caption')}</Label>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t('captionPh')}
              rows={4}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide">{t('hashtags')}</Label>
            <Input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#fé #esperança"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide">{t('imageUrl')}</Label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">{t('date')}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">{t('time')}</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
