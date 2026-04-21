import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Loader2, Sparkles, Wand2, ArrowRight, BookOpen, Image,
  Copy, Check, Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import type { SlideData } from '@/components/social-studio/SlideCanvas';

type L = 'PT' | 'EN' | 'ES';

const labels: Record<L, {
  title: string; empty: string; loadStudio: string; preview: string;
  slides: string; caption: string; quote: string; source: string;
  copied: string; copyCaption: string; createdAt: string;
}> = {
  PT: {
    title: '🤖 Posts Automáticos',
    empty: 'Nenhum carrossel automático ainda. Gere um sermão para ativar o AutoFeed!',
    loadStudio: 'Abrir no Estúdio',
    preview: 'Pré‑visualização',
    slides: 'Slides',
    caption: 'Legenda',
    quote: 'Citação',
    source: 'Origem',
    copied: 'Legenda copiada!',
    copyCaption: 'Copiar legenda',
    createdAt: 'Criado em',
  },
  EN: {
    title: '🤖 Auto Posts',
    empty: 'No auto carousels yet. Generate a sermon to activate AutoFeed!',
    loadStudio: 'Open in Studio',
    preview: 'Preview',
    slides: 'Slides',
    caption: 'Caption',
    quote: 'Quote',
    source: 'Source',
    copied: 'Caption copied!',
    copyCaption: 'Copy caption',
    createdAt: 'Created at',
  },
  ES: {
    title: '🤖 Posts Automáticos',
    empty: 'Aún no hay carruseles automáticos. ¡Genera un sermón para activar AutoFeed!',
    loadStudio: 'Abrir en Estudio',
    preview: 'Vista previa',
    slides: 'Slides',
    caption: 'Leyenda',
    quote: 'Cita',
    source: 'Origen',
    copied: '¡Leyenda copiada!',
    copyCaption: 'Copiar leyenda',
    createdAt: 'Creado en',
  },
};

interface AutofeedSlide {
  type: string;
  title: string;
  text: string;
}

interface AutofeedData {
  slides: AutofeedSlide[];
  caption: string;
  hashtags: string;
  image_url: string | null;
  source_title: string;
  source_passage: string;
  quote: { text: string; reference: string; caption: string; hashtags: string } | null;
}

interface AutofeedItem {
  id: string;
  created_at: string;
  format: string;
  language: string;
  slides_data: AutofeedData;
  material_id: string | null;
}

interface Props {
  lang: L;
}

const SLIDE_TYPE_EMOJI: Record<string, string> = {
  verse: '📖',
  hook: '🪝',
  insight: '💡',
  application: '🎯',
  cta: '📣',
};

export function AutofeedCarousels({ lang }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const l = labels[lang];
  const [items, setItems] = useState<AutofeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<AutofeedItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('visual_outputs')
      .select('id, created_at, format, language, slides_data, material_id')
      .eq('user_id', user.id)
      .eq('output_type', 'autofeed_carousel')
      .order('created_at', { ascending: false })
      .limit(30);
    setItems((data as unknown as AutofeedItem[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleCopyCaption = (item: AutofeedItem) => {
    const text = `${item.slides_data.caption}\n\n${item.slides_data.hashtags}`.trim();
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    toast.success(l.copied);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /** Load the carousel into the main Studio editor for rendering/export. */
  const handleLoadInStudio = (item: AutofeedItem) => {
    const slides = item.slides_data.slides || [];
    const total = slides.length;
    const built: SlideData[] = slides.map((s, i) => ({
      text: s.type === 'verse' ? `"${s.text}"` : s.title,
      subtitle: s.type === 'verse'
        ? item.slides_data.source_passage
        : s.text,
      slideNumber: i + 1,
      totalSlides: total,
    }));

    navigate('/social-studio', {
      state: {
        prefilledSlides: built,
        defaultAspectRatio: '1:1',
        slideCount: total,
        presentationMode: false,
      },
    });
    toast.success(
      lang === 'PT' ? 'Carrossel carregado no Estúdio! Personalize e exporte.' :
      lang === 'EN' ? 'Carousel loaded in Studio! Customize and export.' :
      '¡Carrusel cargado en el Estudio! Personaliza y exporta.',
    );
  };

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
          <Wand2 className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">{l.title}</h3>
          <p className="text-[11px] text-muted-foreground leading-snug">
            {lang === 'PT' ? 'Gerados automaticamente a partir dos seus sermões'
              : lang === 'EN' ? 'Auto-generated from your sermons'
              : 'Generados automáticamente desde tus sermones'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/10 p-6 text-center">
          <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-xs text-muted-foreground">{l.empty}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item) => {
            const d = item.slides_data;
            const slideCount = d.slides?.length || 0;
            return (
              <Card
                key={item.id}
                className="bg-card border-border hover:border-primary/40 transition-all cursor-pointer group overflow-hidden"
                onClick={() => setPreview(item)}
              >
                {/* Top: image preview or gradient */}
                <div className="h-28 relative overflow-hidden">
                  {d.image_url ? (
                    <img src={d.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-600/30 to-fuchsia-500/20" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                  <div className="absolute bottom-2 left-2 flex gap-1.5">
                    <Badge variant="secondary" className="text-[10px] gap-1 bg-background/80 backdrop-blur-sm">
                      <Layers className="h-3 w-3" /> {slideCount} {l.slides}
                    </Badge>
                    {d.quote && (
                      <Badge variant="secondary" className="text-[10px] gap-1 bg-background/80 backdrop-blur-sm">
                        💬 {l.quote}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Bottom: info */}
                <div className="p-3 space-y-1.5">
                  <p className="text-xs font-bold text-foreground leading-tight line-clamp-2">
                    {d.source_title}
                  </p>
                  {d.source_passage && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> {d.source_passage}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground/70">
                    {new Date(item.created_at).toLocaleDateString(
                      lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es-ES' : 'en-US',
                    )}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Preview Dialog ── */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" />
              {preview?.slides_data.source_title || l.preview}
            </DialogTitle>
          </DialogHeader>
          {preview && (() => {
            const d = preview.slides_data;
            return (
              <div className="space-y-4">
                {/* Cover */}
                {d.image_url && (
                  <img src={d.image_url} alt="" className="w-full rounded-lg max-h-48 object-cover" />
                )}

                {/* Slides */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
                    {l.slides} ({d.slides?.length || 0})
                  </h4>
                  {d.slides?.map((s, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-secondary/50 border border-border p-3 space-y-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{SLIDE_TYPE_EMOJI[s.type] || '📌'}</span>
                        <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                          {s.type}
                        </span>
                        <Badge variant="outline" className="text-[9px] ml-auto">
                          {i + 1}/{d.slides.length}
                        </Badge>
                      </div>
                      {s.title && (
                        <p className="text-sm font-semibold text-foreground leading-snug">{s.title}</p>
                      )}
                      <p className="text-xs text-muted-foreground leading-relaxed">{s.text}</p>
                    </div>
                  ))}
                </div>

                {/* Quote */}
                {d.quote && d.quote.text && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-1">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wide">💬 {l.quote}</h4>
                    <p className="text-sm font-serif italic text-foreground">"{d.quote.text}"</p>
                    {d.quote.reference && (
                      <p className="text-xs text-muted-foreground">— {d.quote.reference}</p>
                    )}
                  </div>
                )}

                {/* Caption */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">{l.caption}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {d.caption}
                  </p>
                  {d.hashtags && (
                    <p className="text-[11px] text-primary/80">{d.hashtags}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    size="sm"
                    className="gap-1.5 flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-500 hover:to-fuchsia-400 text-white shadow-lg"
                    onClick={() => {
                      setPreview(null);
                      handleLoadInStudio(preview);
                    }}
                  >
                    <ArrowRight className="h-3.5 w-3.5" /> {l.loadStudio}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => handleCopyCaption(preview)}
                  >
                    {copiedId === preview.id
                      ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                      : <Copy className="h-3.5 w-3.5" />}
                    {l.copyCaption}
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
