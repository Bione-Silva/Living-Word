import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Copy, Share2, FileDown, BookOpen, MessageCircle, ListChecks } from 'lucide-react';
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
    const loadingToast = toast.loading(lang === 'PT' ? 'Gerando PDF...' : lang === 'ES' ? 'Generando PDF...' : 'Generating PDF...');
    try {
      // Native jsPDF text rendering — uses helvetica (built-in WinAnsi support for accents).
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });

      const PAGE_W = 210;
      const PAGE_H = 297;
      const MARGIN_X = 18;
      const MARGIN_TOP = 20;
      const MARGIN_BOTTOM = 20;
      const CONTENT_W = PAGE_W - MARGIN_X * 2;
      const GOLD: [number, number, number] = [124, 58, 237]; // #7C3AED
      const TEXT: [number, number, number] = [26, 20, 48];   // #1a1430
      const MUTED: [number, number, number] = [107, 91, 138];

      let y = MARGIN_TOP;

      // Sanitize text — remove smart quotes/dashes that can cause WinAnsi gaps and any non-printable chars.
      const sanitize = (s: string): string =>
        (s ?? '')
          .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
          .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
          .replace(/[\u2013\u2014]/g, '-')
          .replace(/\u2026/g, '...')
          .replace(/\u00A0/g, ' ')
          .replace(/[\u200B-\u200F\uFEFF]/g, '')
          .trim();

      const ensureSpace = (needed: number) => {
        if (y + needed > PAGE_H - MARGIN_BOTTOM) {
          doc.addPage();
          y = MARGIN_TOP;
        }
      };

      const addText = (
        rawText: string,
        opts: { size?: number; style?: 'normal' | 'bold' | 'italic' | 'bolditalic'; color?: [number, number, number]; lineHeight?: number; spaceAfter?: number; align?: 'left' | 'center'; font?: 'helvetica' | 'times' } = {}
      ) => {
        // Force helvetica everywhere — built-in support for Latin-1 accents (PT/ES).
        const { size = 11, style = 'normal', color = TEXT, lineHeight = 1.5, spaceAfter = 3, align = 'left' } = opts;
        const text = sanitize(rawText);
        if (!text) return;
        doc.setFont('helvetica', style);
        doc.setFontSize(size);
        doc.setTextColor(color[0], color[1], color[2]);
        const lines = doc.splitTextToSize(text, CONTENT_W);
        const lineH = (size * 0.3528) * lineHeight; // pt→mm
        for (const line of lines) {
          ensureSpace(lineH);
          const x = align === 'center' ? PAGE_W / 2 : MARGIN_X;
          doc.text(line, x, y, { align });
          y += lineH;
        }
        y += spaceAfter;
      };

      const addDivider = (color: [number, number, number] = GOLD, thickness = 0.6) => {
        ensureSpace(4);
        doc.setDrawColor(color[0], color[1], color[2]);
        doc.setLineWidth(thickness);
        doc.line(MARGIN_X, y, PAGE_W - MARGIN_X, y);
        y += 4;
      };

      // Header brand
      addText(`✦ Living Word`, { size: 13, style: 'bold', color: GOLD, font: 'times', spaceAfter: 2 });
      addDivider(GOLD, 0.8);

      // Title
      addText(data.title, { size: 22, style: 'bold', color: TEXT, lineHeight: 1.2, spaceAfter: 3 });

      // Date + category
      const dateStr = formatDate(data.scheduled_date, lang);
      addText(dateStr, { size: 10, style: 'italic', color: MUTED, font: 'helvetica', spaceAfter: data.category ? 1 : 5 });
      if (data.category) addText(`✦ ${data.category.toUpperCase()}`, { size: 9, style: 'bold', color: GOLD, font: 'helvetica', spaceAfter: 6 });

      // Anchor verse
      if (data.anchor_verse_text) {
        ensureSpace(20);
        const verseStartY = y;
        addText(`"${data.anchor_verse_text}"`, { size: 12, style: 'italic', color: TEXT, lineHeight: 1.55, spaceAfter: 2 });
        addText(`— ${data.anchor_verse}`, { size: 10, style: 'bold', color: GOLD, font: 'helvetica', spaceAfter: 6 });
        // Left border
        doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
        doc.setLineWidth(1.2);
        doc.line(MARGIN_X - 4, verseStartY - 2, MARGIN_X - 4, y - 4);
      }

      // Meditation section
      addText(labels.meditation[lang].replace(/^[^\w]+/, '').toUpperCase(), { size: 10, style: 'bold', color: GOLD, font: 'helvetica', spaceAfter: 3 });
      const bodyParas = (data.body_text || '').split('\n\n').filter(p => p.trim());
      for (const p of bodyParas) {
        addText(p.trim(), { size: 12, style: 'normal', color: TEXT, lineHeight: 1.6, spaceAfter: 4 });
      }

      // Closing prayer
      if (data.closing_prayer) {
        y += 2;
        addText(labels.prayer[lang].replace(/^[^\w]+/, '').toUpperCase(), { size: 10, style: 'bold', color: GOLD, font: 'helvetica', spaceAfter: 3 });
        addText(data.closing_prayer, { size: 12, style: 'italic', color: TEXT, lineHeight: 1.6, spaceAfter: 5 });
      }

      // Daily practice
      if (data.daily_practice) {
        addText(labels.practice[lang].replace(/^[^\w]+/, '').toUpperCase(), { size: 10, style: 'bold', color: GOLD, font: 'helvetica', spaceAfter: 3 });
        addText(data.daily_practice, { size: 11, style: 'normal', color: TEXT, font: 'helvetica', lineHeight: 1.5, spaceAfter: 5 });
      }

      // Reflection
      if (data.reflection_question) {
        addText(labels.reflection[lang].replace(/^[^\w]+/, '').toUpperCase(), { size: 10, style: 'bold', color: GOLD, font: 'helvetica', spaceAfter: 3 });
        addText(data.reflection_question, { size: 12, style: 'italic', color: TEXT, lineHeight: 1.55, spaceAfter: 6 });
      }

      // Footer brand on every page
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(229, 223, 240);
        doc.setLineWidth(0.2);
        doc.line(MARGIN_X, PAGE_H - 14, PAGE_W - MARGIN_X, PAGE_H - 14);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        doc.text(`Living Word • livingwordgo.com`, PAGE_W / 2, PAGE_H - 9, { align: 'center' });
        doc.text(`${i} / ${totalPages}`, PAGE_W - MARGIN_X, PAGE_H - 9, { align: 'right' });
      }

      const fileName = lang === 'EN'
        ? `Devotional Living Word - ${data.scheduled_date}.pdf`
        : lang === 'ES'
        ? `Devocional Living Word - ${data.scheduled_date}.pdf`
        : `Devocional Living Word - ${data.scheduled_date}.pdf`;
      doc.save(fileName);

      toast.dismiss(loadingToast);
      toast.success(lang === 'PT' ? 'PDF salvo!' : lang === 'ES' ? '¡PDF guardado!' : 'PDF saved!');
    } catch (err) {
      console.error('[DevotionalPDF]', err);
      toast.dismiss(loadingToast);
      toast.error(lang === 'PT' ? 'Erro ao gerar PDF' : lang === 'ES' ? 'Error al generar PDF' : 'Error generating PDF');
    }
  };

  const colors = {
    bg: '#F8F6FF',
    text: '#0F0A18',
    textMuted: 'hsl(257, 61%, 32%)',
    gold: '#7C3AED',
    goldLight: 'hsl(252, 100%, 99%)',
    goldMuted: 'hsl(270, 35%, 78%)',
    verseBg: '#F8F6FF',
    prayerBg: '#E8E0F5',
    border: 'hsl(270, 43%, 92%)',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col" style={{ backgroundColor: colors.bg }}>
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

        {/* Scrollable content — native overflow inside flex column for reliable scrolling */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
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
                    <blockquote className="font-serif text-base italic leading-relaxed" style={{ color: 'hsl(261, 41%, 7%, 0.9)' }}>
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
                  <p key={i} className="font-serif text-[1.05rem] leading-[1.85]" style={{ color: 'hsl(261, 41%, 7%, 0.92)' }}>
                    {p.trim()}
                  </p>
                ))}
              </div>
            </section>

            {/* Section: Oração */}
            {data.closing_prayer && (
              <section className="rounded-xl p-5" style={{ backgroundColor: colors.prayerBg }}>
                <SectionHeader icon={<span className="text-base">🙏</span>} label={labels.prayer[lang]} color={colors.gold} bg="transparent" />
                <p className="mt-3 font-serif text-[1.05rem] italic leading-[1.85]" style={{ color: 'hsl(256, 56%, 16%, 0.85)' }}>
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
                <p className="mt-3 font-serif text-base italic leading-relaxed" style={{ color: 'hsl(256, 56%, 16%, 0.8)' }}>
                  {data.reflection_question}
                </p>
              </section>
            )}

            {/* Footer brand */}
            <div className="flex items-center justify-center gap-3 pt-4 pb-2">
              <span className="h-px w-8" style={{ backgroundColor: colors.goldMuted + '40' }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: colors.goldMuted }}>Living Word</span>
              <span className="h-px w-8" style={{ backgroundColor: colors.goldMuted + '40' }} />
            </div>
          </div>
        </div>
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
