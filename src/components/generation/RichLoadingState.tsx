import { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { GenerationUILang } from '@/lib/generation-ui';

interface RichLoadingStateProps {
  lang: GenerationUILang;
  messages: Record<GenerationUILang, string[]>;
  hint?: Record<GenerationUILang, string>;
  minHeightClassName?: string;
}

export function RichLoadingState({
  lang,
  messages,
  hint,
  minHeightClassName = 'min-h-[420px]',
}: RichLoadingStateProps) {
  const steps = useMemo(() => messages[lang] ?? messages.PT, [lang, messages]);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    setStepIndex(0);
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 4000);

    return () => clearInterval(timer);
  }, [steps]);

  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 text-center ${minHeightClassName}`}>
      <div className="relative mb-6">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary" />
      </div>

      <p className="mb-2 text-sm font-semibold text-primary transition-all duration-500">{steps[stepIndex]}</p>

      <div className="mb-4 h-1.5 w-52 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary/70 transition-all duration-700 ease-out"
          style={{ width: `${Math.min(((stepIndex + 1) / steps.length) * 100, 95)}%` }}
        />
      </div>

      <p className="max-w-xs text-xs text-muted-foreground">{hint?.[lang] ?? hint?.PT}</p>
    </div>
  );
}