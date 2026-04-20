import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

type L = 'PT' | 'EN' | 'ES';

const L10N = {
  section: { PT: 'VERSÍCULO PARA HOJE', EN: 'VERSE OF THE DAY', ES: 'VERSÍCULO PARA HOY' },
  share: { PT: 'Compartilhar', EN: 'Share', ES: 'Compartir' },
  copied: { PT: 'Versículo copiado!', EN: 'Verse copied!', ES: '¡Versículo copiado!' },
} satisfies Record<string, Record<L, string>>;

const VERSES: Record<L, { text: string; ref: string }> = {
  PT: {
    text: 'Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.',
    ref: 'Salmos 37:5',
  },
  EN: {
    text: 'Commit your way to the Lord; trust in him, and he will act.',
    ref: 'Psalm 37:5',
  },
  ES: {
    text: 'Encomienda al Señor tu camino; confía en él, y él hará.',
    ref: 'Salmos 37:5',
  },
};

const MONTHS: Record<L, string[]> = {
  PT: ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'],
  EN: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
  ES: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],
};

export function VerseOfTheDay() {
  const { lang: cur } = useLanguage();
  const lang = (cur || 'PT') as L;
  const v = useMemo(() => VERSES[lang], [lang]);
  const today = new Date();
  const day = today.getDate();
  const month = MONTHS[lang][today.getMonth()];

  const handleShare = async () => {
    const text = `"${v.text}" — ${v.ref}`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // fallback to copy
      }
    }
    await navigator.clipboard.writeText(text);
    toast.success(L10N.copied[lang]);
  };

  return (
    <section className="h-full">
      <div className="flex items-center mb-3 px-1">
        <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-muted-foreground">
          {L10N.section[lang]}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center text-center gap-2 h-[calc(100%-1.75rem)]">
        <div className="text-4xl font-bold text-primary leading-none">{v.num}</div>
        <p className="text-[12px] text-foreground/90 leading-snug px-1">
          {v.text}
        </p>
        <p className="text-xs font-semibold text-primary mt-0.5">{v.ref}</p>
        <div className="mt-auto w-full pt-2">
          <Button
            onClick={handleShare}
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs gap-1.5"
          >
            <Share2 className="h-3.5 w-3.5" />
            {L10N.share[lang]}
          </Button>
        </div>
      </div>
    </section>
  );
}
