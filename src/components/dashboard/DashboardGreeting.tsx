import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';

type L = 'PT' | 'EN' | 'ES';

const DAILY_VERSES: Record<L, { text: string; ref: string }[]> = {
  PT: [
    { text: '"O zelo da tua casa me consumiu."', ref: 'Salmos 69:9' },
    { text: '"Lâmpada para os meus pés é a tua palavra."', ref: 'Salmos 119:105' },
    { text: '"Tudo posso naquele que me fortalece."', ref: 'Filipenses 4:13' },
    { text: '"O Senhor é o meu pastor; nada me faltará."', ref: 'Salmos 23:1' },
    { text: '"Porque Deus amou o mundo de tal maneira..."', ref: 'João 3:16' },
    { text: '"Sede fortes e corajosos."', ref: 'Josué 1:9' },
    { text: '"Confie no Senhor de todo o seu coração."', ref: 'Provérbios 3:5' },
  ],
  EN: [
    { text: '"The zeal for your house consumes me."', ref: 'Psalm 69:9' },
    { text: '"Your word is a lamp to my feet."', ref: 'Psalm 119:105' },
    { text: '"I can do all things through Him who strengthens me."', ref: 'Philippians 4:13' },
    { text: '"The Lord is my shepherd; I shall not want."', ref: 'Psalm 23:1' },
    { text: '"For God so loved the world..."', ref: 'John 3:16' },
    { text: '"Be strong and courageous."', ref: 'Joshua 1:9' },
    { text: '"Trust in the Lord with all your heart."', ref: 'Proverbs 3:5' },
  ],
  ES: [
    { text: '"El celo de tu casa me consumió."', ref: 'Salmos 69:9' },
    { text: '"Lámpara es a mis pies tu palabra."', ref: 'Salmos 119:105' },
    { text: '"Todo lo puedo en Cristo que me fortalece."', ref: 'Filipenses 4:13' },
    { text: '"El Señor es mi pastor; nada me faltará."', ref: 'Salmos 23:1' },
    { text: '"Porque de tal manera amó Dios al mundo..."', ref: 'Juan 3:16' },
    { text: '"Sé fuerte y valiente."', ref: 'Josué 1:9' },
    { text: '"Confía en el Señor de todo tu corazón."', ref: 'Proverbios 3:5' },
  ],
};

const shareLabels: Record<L, { share: string; copied: string; verseOfDay: string }> = {
  PT: { share: 'Compartilhar', copied: 'Imagem copiada! Cole no WhatsApp.', verseOfDay: 'Versículo do Dia' },
  EN: { share: 'Share', copied: 'Image copied! Paste on WhatsApp.', verseOfDay: 'Verse of the Day' },
  ES: { share: 'Compartir', copied: 'Imagen copiada! Pega en WhatsApp.', verseOfDay: 'Versículo del Día' },
};

function getTimeGreeting(lang: L): string {
  const h = new Date().getHours();
  if (h < 12) return lang === 'PT' ? 'Bom dia' : lang === 'EN' ? 'Good morning' : 'Buenos días';
  if (h < 18) return lang === 'PT' ? 'Boa tarde' : lang === 'EN' ? 'Good afternoon' : 'Buenas tardes';
  return lang === 'PT' ? 'Boa noite' : lang === 'EN' ? 'Good evening' : 'Buenas noches';
}

function formatDate(lang: L): string {
  const now = new Date();
  return now.toLocaleDateString(lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es-ES' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function DashboardGreeting() {
  const { profile } = useAuth();
  const { lang } = useLanguage();
  const name = profile?.full_name?.split(' ')[0] || (lang === 'PT' ? 'Amigo' : lang === 'EN' ? 'Friend' : 'Amigo');
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  const [verse, setVerse] = useState<{ text: string; ref: string } | null>(null);

  useEffect(() => {
    const verses = DAILY_VERSES[lang];
    const dayIndex = new Date().getDate() % verses.length;
    setVerse(verses[dayIndex]);
  }, [lang]);

  const handleShare = useCallback(async () => {
    if (!verse || !shareCardRef.current) return;
    setSharing(true);

    try {
      // Make the hidden card visible for capture
      const el = shareCardRef.current;
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      el.style.top = '0';
      el.style.display = 'flex';

      const dataUrl = await toPng(el, { pixelRatio: 2, width: 1080, height: 1080 });

      el.style.display = 'none';

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'versiculo-do-dia.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: shareLabels[lang].verseOfDay,
          text: `${verse.text} — ${verse.ref}`,
          files: [file],
        });
      } else {
        // Fallback: copy image to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        toast.success(shareLabels[lang].copied);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        // Final fallback: share as text
        const text = `✝️ ${shareLabels[lang].verseOfDay}\n\n${verse.text}\n— ${verse.ref}\n\n${formatDate(lang)}\n\nLiving Word`;
        if (navigator.share) {
          await navigator.share({ text }).catch(() => {});
        } else {
          await navigator.clipboard.writeText(text).catch(() => {});
          toast.success(shareLabels[lang].copied);
        }
      }
    } finally {
      setSharing(false);
    }
  }, [verse, lang]);

  return (
    <div className="px-1">
      {verse && (
        <div className="flex items-start gap-2 mb-1.5">
          <p className="text-sm md:text-base text-foreground font-bold italic leading-snug flex-1">
            {verse.text} — <span className="font-extrabold not-italic text-primary">{verse.ref}</span>
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary mt-0.5"
            onClick={handleShare}
            disabled={sharing}
            aria-label={shareLabels[lang].share}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      )}
      <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight">
        {getTimeGreeting(lang)}, <span className="text-primary">{name}</span>! 👋
      </h1>

      {/* Hidden share card rendered off-screen for image capture */}
      {verse && (
        <div
          ref={shareCardRef}
          style={{
            display: 'none',
            width: 1080,
            height: 1080,
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            padding: 80,
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            color: '#FFF8E7',
            textAlign: 'center',
            position: 'fixed',
            left: -9999,
            top: 0,
          }}
        >
          <div style={{ fontSize: 28, letterSpacing: 6, textTransform: 'uppercase' as const, color: 'rgba(212,168,83,0.6)', marginBottom: 40, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
            {shareLabels[lang].verseOfDay}
          </div>
          <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.3, marginBottom: 48, maxWidth: 900 }}>
            {verse.text}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 40, height: 1, backgroundColor: 'rgba(212,168,83,0.5)' }} />
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase' as const, color: 'rgba(212,168,83,0.85)', fontFamily: "'DM Sans', sans-serif" }}>
              {verse.ref}
            </div>
            <div style={{ width: 40, height: 1, backgroundColor: 'rgba(212,168,83,0.5)' }} />
          </div>
          <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Sans', sans-serif", marginTop: 20 }}>
            {formatDate(lang)}
          </div>
          <div style={{ fontSize: 14, letterSpacing: 8, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, marginTop: 60 }}>
            Living Word
          </div>
        </div>
      )}
    </div>
  );
}
