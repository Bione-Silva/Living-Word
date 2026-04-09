import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Share2, FileDown, BookOpen, MessageCircle, ListChecks, X } from 'lucide-react';
import { toast } from 'sonner';

type L = 'PT' | 'EN' | 'ES';

interface DevotionalData {
  title: string;
  category: string;
  anchor_verse: string;
  anchor_verse_text: string;
  body_text: string;
  daily_practice?: string;
  reflection_question: string;
  scheduled_date: string;
  closing_prayer?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: DevotionalData;
  lang: L;
}

const labels = {
  title: { PT: 'Versão Escrita Completa', EN: 'Full Written Version', ES: 'Versión Escrita Completa' },
  meditation: { PT: '📖 Meditação', EN: '📖 Meditation', ES: '📖 Meditación' },
  prayer: { PT: '🙏 Oração', EN: '🙏 Prayer', ES: '🙏 Oración' },
  practice: { PT: '💡 Prática do Dia', EN: '💡 Daily Practice', ES: '💡 Práctica del Día' },
  reflection: { PT: '💭 Reflexão', EN: '💭 Reflection', ES: '💭 Reflexión' },
  copy: { PT: 'Copiar tudo', EN: 'Copy all', ES: 'Copiar todo' },
  share: { PT: 'Compartilhar', EN: 'Share', ES: 'Compartir' },
  pdf: { PT: 'Salvar PDF', EN: 'Save PDF', ES: 'Guardar PDF' },
  copied: { PT: 'Copiado!', EN: 'Copied!', ES: '¡Copiado!' },
  verse: { PT: 'Versículo-âncora', EN: 'Anchor verse', ES: 'Versículo ancla' },
} satisfies Record<string, Record<L, string>>;

function formatDate(dateStr: string, lang: L): string {
  const d = new Date(dateStr + 'T12:00:00');
  const locale = lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es-ES' : 'en-US';
  return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function DevotionalReadingModal({ open, onOpenChange, data, lang }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  const buildPlainText = () => {
    let text = `${data.title}\n${formatDate(data.scheduled_date, lang)}\n`;
    if (data.category) text += `${data.category}\n`;
    text += `\n📖 ${labels.verse[lang]}\n"${data.anchor_verse_text}"\n— ${data.anchor_verse}\n`;
    text += `\n${labels.meditation[lang].replace('📖 ', '')}\n${data.body_text}\n`;
    if (data.closing_prayer) text += `\n${labels.prayer[lang].replace('🙏 ', '')}\n${data.closing_prayer}\n`;
    if (data.daily_practice) text += `\n${labels.practice[lang].replace('💡 ', '')}\n${data.daily_practice}\n`;
    if (data.reflection_question) text += `\n${labels.reflection[lang].replace('💭 ', '')}\n${data.reflection_question}\n`;
    return text;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(buildPlainText());
    toast.success(labels.copied[lang]);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: data.title, text: buildPlainText() });
    } else {
      handleCopy();
    }
  };

  const handlePdf = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const el = contentRef.current;
      if (!el) return;
      await html2pdf().set({
        margin: [12, 12, 12, 12],
        filename: `devocional-${data.scheduled_date}.pdf`,
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(el).save();
      toast.success(lang === 'PT' ? 'PDF salvo!' : lang === 'ES' ? '¡PDF guardado!' : 'PDF saved!');
    } catch {
      toast.error(lang === 'PT' ? 'Erro ao gerar PDF' : lang === 'ES' ? 'Error al generar PDF' : 'Error generating PDF');
    }
  };

  const colors = {
    bg: '#FFFDF9',
    text: '#2C2416',
    textMuted: 'hsl(24, 18%, 45%)',
    gold: '#C9A84C',
    goldLight: 'hsl(38, 52%, 92%)',
    goldMuted: 'hsl(38, 40%, 75%)',
    verseBg: '#FEFCF5',
    prayerBg: '#F0EBE1',
    border: 'hsl(30, 20%, 85%)',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 max-h-[90vh] sm:max-h-[85vh] overflow-hidden" style={{ backgroundColor: colors.bg }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: colors.border }}>
          <DialogHeader className="flex-1 space-y-0">
            <DialogTitle className="font-playfair text-lg font-bold" style={{ color: colors.text }}>
              {labels.title[lang]}
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 px-5 py-3 border-b flex-wrap" style={{ borderColor: colors.border, backgroundColor: colors.goldLight + '60' }}>
          <button onClick={handleCopy} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors hover:opacity-80 min-h-[44px]" style={{ borderColor: colors.border, color: colors.text, backgroundColor: '#fff' }}>
            <Copy className="h-3.5 w-3.5" /> {labels.copy[lang]}
          </button>
          <button onClick={handleShare} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors hover:opacity-80 min-h-[44px]" style={{ borderColor: colors.border, color: colors.text, backgroundColor: '#fff' }}>
            <Share2 className="h-3.5 w-3.5" /> {labels.share[lang]}
          </button>
          <button onClick={handlePdf} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors hover:opacity-80 min-h-[44px]" style={{ borderColor: colors.gold + '50', color: colors.gold, backgroundColor: colors.goldLight }}>
            <FileDown className="h-3.5 w-3.5" /> {labels.pdf[lang]}
          </button>
        </div>

        {/* Scrollable content */}
        <ScrollArea className="flex-1 min-h-0">
          <div ref={contentRef} className="px-5 sm:px-8 py-6 space-y-6" style={{ backgroundColor: colors.bg }}>
            {/* Title + date + category */}
            <div>
              <h2 className="font-playfair text-2xl sm:text-[1.75rem] font-black leading-tight" style={{ color: colors.text }}>
                {data.title}
              </h2>
              <p className="text-xs mt-2 capitalize" style={{ color: colors.textMuted }}>
                {formatDate(data.scheduled_date, lang)}
              </p>
              {data.category && (
                <span className="inline-flex items-center gap-1.5 text-[10px] px-3 py-1 mt-2 rounded-full font-semibold uppercase tracking-wider" style={{ backgroundColor: colors.goldLight, color: colors.gold }}>
                  ✦ {data.category}
                </span>
              )}
            </div>

            {/* Anchor verse */}
            {data.anchor_verse_text && (
              <div className="rounded-xl p-5" style={{ borderLeft: `4px solid ${colors.gold}`, backgroundColor: colors.verseBg }}>
                <div className="flex gap-3">
                  <span className="text-3xl font-playfair font-black leading-none shrink-0 select-none" style={{ color: colors.goldMuted }}>&ldquo;</span>
                  <div>
                    <blockquote className="font-serif text-base italic leading-relaxed" style={{ color: 'hsl(24, 30%, 18%, 0.9)' }}>
                      {data.anchor_verse_text}
                    </blockquote>
                    <p className="text-xs font-bold mt-3" style={{ color: colors.gold }}>&mdash; {data.anchor_verse}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Section: Meditação */}
            <section>
              <SectionHeader icon={<BookOpen className="h-4 w-4" />} label={labels.meditation[lang]} color={colors.gold} bg={colors.goldLight} />
              <div className="mt-3 space-y-4">
                {data.body_text.split('\n\n').filter(p => p.trim()).map((p, i) => (
                  <p key={i} className="font-serif text-[1.05rem] leading-[1.85]" style={{ color: 'hsl(24, 30%, 18%, 0.92)' }}>
                    {p.trim()}
                  </p>
                ))}
              </div>
            </section>

            {/* Section: Oração */}
            {data.closing_prayer && (
              <section className="rounded-xl p-5" style={{ backgroundColor: colors.prayerBg }}>
                <SectionHeader icon={<span className="text-base">🙏</span>} label={labels.prayer[lang]} color={colors.gold} bg="transparent" />
                <p className="mt-3 font-serif text-[1.05rem] italic leading-[1.85]" style={{ color: 'hsl(24, 30%, 20%, 0.85)' }}>
                  {data.closing_prayer}
                </p>
              </section>
            )}

            {/* Section: Prática do Dia */}
            {data.daily_practice && (
              <section className="rounded-xl p-5" style={{ backgroundColor: colors.goldLight, border: `1px solid ${colors.goldMuted}40` }}>
                <SectionHeader icon={<ListChecks className="h-4 w-4" />} label={labels.practice[lang]} color={colors.gold} bg="transparent" />
                <p className="mt-3 text-sm leading-relaxed" style={{ color: colors.text }}>
                  {data.daily_practice}
                </p>
              </section>
            )}

            {/* Section: Reflexão */}
            {data.reflection_question && (
              <section className="pl-5 py-3" style={{ borderLeft: `3px solid ${colors.goldMuted}` }}>
                <SectionHeader icon={<MessageCircle className="h-4 w-4" />} label={labels.reflection[lang]} color={colors.gold} bg={colors.goldLight} />
                <p className="mt-3 font-serif text-base italic leading-relaxed" style={{ color: 'hsl(24, 30%, 20%, 0.8)' }}>
                  {data.reflection_question}
                </p>
              </section>
            )}

            {/* Footer brand */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <span className="h-px w-8" style={{ backgroundColor: colors.goldMuted + '40' }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: colors.goldMuted }}>Living Word</span>
              <span className="h-px w-8" style={{ backgroundColor: colors.goldMuted + '40' }} />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function SectionHeader({ icon, label, color, bg }: { icon: React.ReactNode; label: string; color: string; bg: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: bg, color }}>
        {icon}
      </div>
      <h3 className="text-[11px] font-bold tracking-[0.15em] uppercase" style={{ color }}>
        {label}
      </h3>
    </div>
  );
}
