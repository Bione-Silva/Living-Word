// @ts-nocheck
import { Clock, Coins, Cpu, Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GenerationMeta } from '@/types/generation-meta';
import { GenerationUILang } from '@/lib/generation-ui';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GenerationMetaFooterProps {
  lang: GenerationUILang;
  meta: GenerationMeta;
}

const labels = {
  PT: { attempts: 'tentativas', attempt: 'tentativa' },
  EN: { attempts: 'attempts', attempt: 'attempt' },
  ES: { attempts: 'intentos', attempt: 'intento' },
} as const;

export function GenerationMetaFooter({ lang, meta }: GenerationMetaFooterProps) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (supabase as any).rpc('is_admin').then(({ data }) => {
      if (data === true) setIsAdmin(true);
    });
  }, []);

  if (!isAdmin) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/50 bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <Cpu className="h-3.5 w-3.5" />
        <span className="font-medium">{meta.model.split('/').pop()}</span>
      </div>

      <span className="text-border">|</span>

      <div className="flex items-center gap-1.5">
        <Hash className="h-3.5 w-3.5" />
        <span>{meta.total_tokens.toLocaleString()} tokens</span>
      </div>

      <span className="text-border">|</span>

      <div className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        <span>{(meta.elapsed_ms / 1000).toFixed(1)}s</span>
      </div>

      <span className="text-border">|</span>

      <div className="flex items-center gap-1.5">
        <Coins className="h-3.5 w-3.5" />
        <span>${meta.total_cost_usd.toFixed(4)}</span>
      </div>

      {typeof meta.attempts_used === 'number' && meta.attempts_used > 0 && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
          {meta.attempts_used} {meta.attempts_used > 1 ? labels[lang].attempts : labels[lang].attempt}
        </Badge>
      )}

      {meta.per_format && Object.entries(meta.per_format).map(([key, detail]) => (
        <Badge key={key} variant="outline" className="text-[10px] px-1.5 py-0.5">
          {key}: {detail.words ?? 0}w{detail.attempts ? ` · ${detail.attempts}x` : ''}
        </Badge>
      ))}
    </div>
  );
}
