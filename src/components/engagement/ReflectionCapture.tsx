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
  const { language } = useLanguage();
  const lang = (language || 'PT') as L;
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentiment, setSentiment] = useState<string | null>(null);

  const handleSave = async () => {
    if (!text.trim()) return;
    setLoading(true);

    try {
      // Analyze sentiment
      const { data: sentimentData, error: sentimentError } = await supabase.functions.invoke('analyze-sentiment', {
        body: { text: text.trim() },
      });

      const detectedSentiment = sentimentError ? 'mixed' : sentimentData?.sentiment || 'mixed';
      setSentiment(detectedSentiment);

      // Track the reflection engagement
      await supabase.functions.invoke('track-engagement', {
        body: {
          devotionalId,
          action: 'complete_reflection',
          reflectionText: text.trim(),
          reflectionSentiment: detectedSentiment,
          theme,
        },
      });

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

      {sentiment && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Heart className="h-3.5 w-3.5" />
          <span>{sentimentLabels[sentiment]?.[lang] || sentiment}</span>
        </div>
      )}

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
