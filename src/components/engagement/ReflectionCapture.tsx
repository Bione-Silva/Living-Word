import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  placeholder: { PT: 'Escreva sua reflexão pessoal...', EN: 'Write your personal reflection...', ES: 'Escribe tu reflexión personal...' },
  save: { PT: 'Salvar Reflexão', EN: 'Save Reflection', ES: 'Guardar Reflexión' },
  saving: { PT: 'Analisando...', EN: 'Analyzing...', ES: 'Analizando...' },
  saved: { PT: 'Reflexão salva!', EN: 'Reflection saved!', ES: '¡Reflexión guardada!' },
  error: { PT: 'Erro ao salvar', EN: 'Error saving', ES: 'Error al guardar' },
  sentiment: {
    positive: { PT: '😊 Sentimento positivo', EN: '😊 Positive sentiment', ES: '😊 Sentimiento positivo' },
    negative: { PT: '😔 Sentimento difícil', EN: '😔 Difficult sentiment', ES: '😔 Sentimiento difícil' },
    mixed: { PT: '🤔 Sentimento misto', EN: '🤔 Mixed sentiment', ES: '🤔 Sentimiento mixto' },
  },
} satisfies Record<string, Record<L, string> | Record<string, Record<L, string>>>;

interface ReflectionCaptureProps {
  devotionalId?: string;
  theme?: string;
  onSaved?: (sentiment: string) => void;
}

export function ReflectionCapture({ devotionalId, theme, onSaved }: ReflectionCaptureProps) {
  const { lang: currentLang } = useLanguage();
  const lang = (currentLang || 'PT') as L;
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentiment, setSentiment] = useState<string | null>(null);

  const handleSave = async () => {
    if (!text.trim()) return;
    setLoading(true);

    try {
      // Analyze sentiment (graceful degradation if session expired)
      const { data: sentimentData, unauthorized: sentUnauth } = await safeInvoke<{ sentiment?: string }>(
        'analyze-sentiment',
        { body: { text: text.trim() } }
      );
      const detectedSentiment = sentUnauth ? 'mixed' : (sentimentData?.sentiment || 'mixed');

      // Track the reflection engagement
      const { unauthorized: trackUnauth } = await safeInvoke('track-engagement', {
        body: {
          devotionalId,
          action: 'complete_reflection',
          reflectionText: text.trim(),
          reflectionSentiment: detectedSentiment,
          theme,
        },
      });

      if (trackUnauth) {
        toast.error((labels.error as Record<L, string>)[lang]);
        return;
      }

      toast.success((labels.saved as Record<L, string>)[lang]);
      onSaved?.(detectedSentiment);
    } catch {
      toast.error((labels.error as Record<L, string>)[lang]);
    } finally {
      setLoading(false);
    }
  };

  const sentimentLabels = labels.sentiment as Record<string, Record<L, string>>;

  return (
    <div className="space-y-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={(labels.placeholder as Record<L, string>)[lang]}
        className="min-h-[100px] resize-none border-muted bg-muted/30 text-foreground"
        maxLength={2000}
      />


      <Button
        onClick={handleSave}
        disabled={!text.trim() || loading}
        size="sm"
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {(labels.saving as Record<L, string>)[lang]}
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            {(labels.save as Record<L, string>)[lang]}
          </>
        )}
      </Button>
    </div>
  );
}
