// @ts-nocheck
import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Send, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  PT: {
    question: 'O que achou deste material?',
    commentPlaceholder: 'Deixe um comentário (opcional)...',
    send: 'Enviar',
    thanks: 'Obrigado pelo seu feedback!',
    error: 'Erro ao enviar feedback.',
  },
  EN: {
    question: 'What did you think of this material?',
    commentPlaceholder: 'Leave a comment (optional)...',
    send: 'Send',
    thanks: 'Thanks for your feedback!',
    error: 'Error sending feedback.',
  },
  ES: {
    question: '¿Qué te pareció este material?',
    commentPlaceholder: 'Deja un comentario (opcional)...',
    send: 'Enviar',
    thanks: '¡Gracias por tu feedback!',
    error: 'Error al enviar feedback.',
  },
};

interface MaterialFeedbackProps {
  materialType: string;
  materialTitle?: string;
  toolId?: string;
}

export function MaterialFeedback({ materialType, materialTitle, toolId }: MaterialFeedbackProps) {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const text = labels[lang];

  const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (selectedRating: 'positive' | 'negative') => {
    if (!user) return;
    setSending(true);

    try {
      const { error } = await (supabase as any).from('material_feedback' as any).insert({
        user_id: user.id,
        material_type: materialType,
        material_title: materialTitle || null,
        tool_id: toolId || null,
        rating: selectedRating,
        comment: comment.trim() || null,
      } as any);

      if (error) throw error;
      setSubmitted(true);
      toast.success(text.thanks);
    } catch {
      toast.error(text.error);
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 rounded-lg border border-border/60 bg-muted/30 text-sm text-muted-foreground">
        <Check className="h-4 w-4 text-green-600" />
        {text.thanks}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3">
      <p className="text-sm font-medium text-foreground">{text.question}</p>

      <div className="flex items-center gap-2">
        <Button
          variant={rating === 'positive' ? 'default' : 'outline'}
          size="sm"
          className="gap-1.5"
          onClick={() => setRating('positive')}
          disabled={sending}
        >
          <ThumbsUp className="h-4 w-4" />
        </Button>
        <Button
          variant={rating === 'negative' ? 'default' : 'outline'}
          size="sm"
          className="gap-1.5"
          onClick={() => setRating('negative')}
          disabled={sending}
        >
          <ThumbsDown className="h-4 w-4" />
        </Button>
      </div>

      {rating && (
        <div className="space-y-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={text.commentPlaceholder}
            rows={2}
            className="text-sm"
          />
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => handleSubmit(rating)}
            disabled={sending}
          >
            <Send className="h-3.5 w-3.5" />
            {text.send}
          </Button>
        </div>
      )}
    </div>
  );
}
