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
    let wrapper: HTMLDivElement | null = null;
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const { BRAND } = await import('@/lib/export-branding');

      // Build the full document HTML inline so we control sizing, fonts and brand chrome.
      const dateStr = formatDate(data.scheduled_date, lang);
      const esc = (s: string) =>
        (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const paragraphs = (data.body_text || '')
        .split('\n\n')
        .filter(p => p.trim())
        .map(p => `<p style="margin:0 0 14px 0;font-family:Georgia,serif;font-size:13px;line-height:1.85;color:#1a1430;">${esc(p.trim())}</p>`)
        .join('');

      const sectionTitle = (label: string) =>
        `<h3 style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${BRAND.colors.gold};margin:0 0 10px 0;">${esc(label)}</h3>`;

      const verseBlock = data.anchor_verse_text
        ? `<div style="border-left:4px solid ${BRAND.colors.gold};background:#F8F6FF;padding:14px 18px;margin:18px 0 22px 0;border-radius:6px;">
             <blockquote style="margin:0;font-family:Georgia,serif;font-size:13px;font-style:italic;line-height:1.7;color:#1a1430;">&ldquo;${esc(data.anchor_verse_text)}&rdquo;</blockquote>
             <p style="margin:8px 0 0 0;font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:${BRAND.colors.gold};">— ${esc(data.anchor_verse)}</p>
           </div>` : '';

      const prayerBlock = data.closing_prayer
        ? `<div style="background:#E8E0F5;padding:14px 18px;margin:18px 0;border-radius:6px;page-break-inside:avoid;">
             ${sectionTitle(labels.prayer[lang])}
             <p style="margin:0;font-family:Georgia,serif;font-size:13px;font-style:italic;line-height:1.8;color:#2a1f4d;">${esc(data.closing_prayer)}</p>
           </div>` : '';

      const practiceBlock = data.daily_practice
        ? `<div style="background:#F8F6FF;border:1px solid #d6c8f0;padding:14px 18px;margin:18px 0;border-radius:6px;page-break-inside:avoid;">
             ${sectionTitle(labels.practice[lang])}
             <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;line-height:1.7;color:#1a1430;">${esc(data.daily_practice)}</p>
           </div>` : '';

      const reflectionBlock = data.reflection_question
        ? `<div style="border-left:3px solid #b9a3e0;padding:8px 0 8px 16px;margin:18px 0;page-break-inside:avoid;">
             ${sectionTitle(labels.reflection[lang])}
             <p style="margin:0;font-family:Georgia,serif;font-size:13px;font-style:italic;line-height:1.7;color:#2a1f4d;">${esc(data.reflection_question)}</p>
           </div>` : '';

      wrapper = document.createElement('div');
      // Render offscreen at A4-ish width so html2canvas captures full layout (not the modal's narrow viewport)
      wrapper.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#ffffff;padding:0;';
      wrapper.innerHTML = `
        <div style="width:794px;background:#ffffff;color:#1a1430;">
          <div style="display:flex;align-items:center;gap:12px;padding:20px 32px 14px 32px;border-bottom:2px solid ${BRAND.colors.gold};">
            <img src="${BRAND.logoPath}" crossorigin="anonymous" style="height:40px;width:40px;object-fit:contain;" alt="Living Word" />
            <span style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:${BRAND.colors.brown};letter-spacing:0.5px;">${BRAND.name}</span>
          </div>
          <div style="padding:28px 32px 20px 32px;">
            <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:900;line-height:1.2;color:#0F0A18;margin:0 0 8px 0;">${esc(data.title)}</h1>
            <p style="font-family:Arial,sans-serif;font-size:11px;color:#6b5b8a;margin:0 0 6px 0;text-transform:capitalize;">${esc(dateStr)}</p>
            ${data.category ? `<span style="display:inline-block;font-family:Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${BRAND.colors.gold};background:#F8F6FF;padding:4px 10px;border-radius:999px;">✦ ${esc(data.category)}</span>` : ''}
            ${verseBlock}
            <div style="margin-top:8px;">
              ${sectionTitle(labels.meditation[lang])}
              ${paragraphs}
            </div>
            ${prayerBlock}
            ${practiceBlock}
            ${reflectionBlock}
          </div>
          <div style="margin:20px 32px 24px 32px;padding-top:14px;border-top:1px solid #e5dff0;text-align:center;font-family:Arial,sans-serif;font-size:10px;color:#999;">
            ${BRAND.name} • ${BRAND.site}
          </div>
        </div>`;
      document.body.appendChild(wrapper);

      await html2pdf().set({
        margin: [10, 0, 12, 0],
        filename: `devocional-${data.scheduled_date}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 794 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      }).from(wrapper).save();

      toast.success(lang === 'PT' ? 'PDF salvo!' : lang === 'ES' ? '¡PDF guardado!' : 'PDF saved!');
    } catch (err) {
      console.error('[DevotionalPDF]', err);
      toast.error(lang === 'PT' ? 'Erro ao gerar PDF' : lang === 'ES' ? 'Error al generar PDF' : 'Error generating PDF');
    } finally {
      if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
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

        {/* Scrollable content — flex-1 fills remaining modal height; ScrollArea handles overflow */}
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
