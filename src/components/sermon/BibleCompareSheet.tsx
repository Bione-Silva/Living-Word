import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Check, Copy, Loader2, Settings2, Share2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  BIBLE_VERSIONS,
  DEFAULT_COMPARE_VERSIONS,
  getVersionLabel,
  type BibleVersionLang,
} from '@/lib/bible-versions';

type Lang = 'PT' | 'EN' | 'ES';
type PodiumTheme = 'dark' | 'light';

const tr = {
  title: { PT: 'Comparar Versões', EN: 'Compare Versions', ES: 'Comparar Versiones' },
  subtitle: {
    PT: 'O versículo do sermão lado a lado com outras traduções.',
    EN: 'Your sermon verse side by side with other translations.',
    ES: 'El versículo del sermón junto a otras traducciones.',
  },
  loading: { PT: 'Buscando versículos...', EN: 'Loading verses...', ES: 'Buscando versículos...' },
  errorEmpty: {
    PT: 'Não conseguimos carregar este versículo agora.',
    EN: "We couldn't load this verse right now.",
    ES: 'No pudimos cargar este versículo ahora.',
  },
  retry: { PT: 'Tentar novamente', EN: 'Try again', ES: 'Reintentar' },
  copy: { PT: 'Copiar', EN: 'Copy', ES: 'Copiar' },
  copied: { PT: 'Copiado!', EN: 'Copied!', ES: '¡Copiado!' },
  share: { PT: 'Compartilhar', EN: 'Share', ES: 'Compartir' },
  shareText: {
    PT: 'Comparação de versões — Living Word',
    EN: 'Version comparison — Living Word',
    ES: 'Comparación de versiones — Living Word',
  },
  sermonVersion: { PT: 'Versão do sermão', EN: 'Sermon version', ES: 'Versión del sermón' },
  pickerLabel: { PT: 'Trocar versão', EN: 'Change version', ES: 'Cambiar versión' },
  saveDefaults: { PT: 'Tornar padrão', EN: 'Save as default', ES: 'Guardar por defecto' },
  saved: { PT: 'Versões padrão salvas!', EN: 'Default versions saved!', ES: '¡Versiones predeterminadas guardadas!' },
  close: { PT: 'Fechar', EN: 'Close', ES: 'Cerrar' },
  noText: { PT: '— versículo indisponível —', EN: '— verse unavailable —', ES: '— versículo no disponible —' },
};

interface VerseResult {
  version: string;
  text: string;
  book: string;
  version_mismatch?: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** A referência clicada, ex: "Efésios 6:10-18" */
  reference: string;
  /** Versão usada no sermão. Ex: 'ARA'. */
  primaryVersion: string;
  /** Versão de comparação 2 (escolhida pelo pregador). */
  defaultCompareVersion2?: string | null;
  /** Versão de comparação 3 (escolhida pelo pregador). */
  defaultCompareVersion3?: string | null;
  lang: Lang;
  theme?: PodiumTheme;
  /** Callback: salvar como padrão no perfil do usuário. Recebe (v2, v3). */
  onSaveDefaults?: (v2: string, v3: string) => Promise<void> | void;
}

function useBreakpoint(query: string): boolean {
  const [match, setMatch] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = () => setMatch(mql.matches);
    mql.addEventListener?.('change', handler);
    return () => mql.removeEventListener?.('change', handler);
  }, [query]);
  return match;
}

export function BibleCompareSheet({
  open,
  onClose,
  reference,
  primaryVersion,
  defaultCompareVersion2,
  defaultCompareVersion3,
  lang,
  theme = 'light',
  onSaveDefaults,
}: Props) {
  const isDesktop = useBreakpoint('(min-width: 768px)');
  const isDark = theme === 'dark';

  // Resolve the 3 versions: sermon version + 2 chosen by preacher (or sane defaults).
  const fallback = DEFAULT_COMPARE_VERSIONS[(lang as BibleVersionLang) || 'PT'];
  const [v1] = useState<string>(primaryVersion || fallback[0]);
  const [v2, setV2] = useState<string>(() => defaultCompareVersion2 || fallback[0]);
  const [v3, setV3] = useState<string>(() => defaultCompareVersion3 || fallback[1]);

  const [results, setResults] = useState<VerseResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [savingDefaults, setSavingDefaults] = useState(false);

  // Ensure no duplicate version slots — auto-shift if user picks the sermon version as a compare slot.
  const versionsToFetch = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const v of [v1, v2, v3]) {
      const key = (v || '').toUpperCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(v);
    }
    return out;
  }, [v1, v2, v3]);

  useEffect(() => {
    if (!open || !reference) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setResults([]);

    (async () => {
      try {
        const { data, error: fnErr } = await supabase.functions.invoke('fetch-bible-verse', {
          body: {
            passage: reference,
            language: lang,
            versions: versionsToFetch,
          },
        });
        if (cancelled) return;
        if (fnErr) throw fnErr;
        if (data?.results && Array.isArray(data.results)) {
          setResults(data.results as VerseResult[]);
        } else if (data?.error) {
          setError(data.error as string);
        } else {
          setError(tr.errorEmpty[lang]);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message || tr.errorEmpty[lang]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, reference, versionsToFetch, lang]);

  const handleCopy = async (idx: number) => {
    const r = results[idx];
    if (!r) return;
    const text = `${r.book || reference} (${r.version})\n${r.text}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1400);
    } catch {
      toast.error(tr.errorEmpty[lang]);
    }
  };

  const handleShareAll = async () => {
    const text = results
      .filter((r) => r.text)
      .map((r) => `— ${r.version} —\n${r.text}`)
      .join('\n\n');
    const title = `${reference} — ${tr.shareText[lang]}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `${title}\n\n${text}` });
        return;
      } catch {
        // user cancelled — silent
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${title}\n\n${text}`);
      toast.success(tr.copied[lang]);
    } catch {
      toast.error(tr.errorEmpty[lang]);
    }
  };

  const handleSaveDefaults = async () => {
    if (!onSaveDefaults) return;
    setSavingDefaults(true);
    try {
      await onSaveDefaults(v2, v3);
      toast.success(tr.saved[lang]);
    } finally {
      setSavingDefaults(false);
    }
  };

  if (!open) return null;

  /* ─────────────── Render ─────────────── */

  // Filter version options to exclude the sermon version + the OTHER compare slot, so user
  // never picks duplicates.
  const buildOptions = (excludeCodes: string[]) =>
    BIBLE_VERSIONS.filter((bv) => !excludeCodes.map((c) => c.toUpperCase()).includes(bv.code.toUpperCase()));

  const surfaceBg = isDark ? 'bg-slate-900 text-slate-50' : 'bg-white text-slate-900';
  const borderClass = isDark ? 'border-slate-800' : 'border-slate-200';
  const cardBg = isDark ? 'bg-slate-800/60' : 'bg-amber-50/70';
  const cardBorder = isDark ? 'border-slate-700' : 'border-amber-200';
  const verseText = isDark ? 'text-slate-100' : 'text-slate-800';
  const mutedText = isDark ? 'text-slate-400' : 'text-slate-500';

  /* Header always identical */
  const Header = (
    <header className={cn('flex items-center justify-between gap-3 px-4 py-3 border-b shrink-0', borderClass)}>
      <div className="flex items-center gap-2 min-w-0">
        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', isDark ? 'bg-amber-500/20' : 'bg-amber-100')}>
          <BookOpen className={cn('h-4 w-4', isDark ? 'text-amber-300' : 'text-amber-700')} />
        </div>
        <div className="min-w-0">
          <p className={cn('text-[10px] uppercase tracking-widest font-semibold', mutedText)}>
            {tr.title[lang]}
          </p>
          <h3 className="text-sm sm:text-base font-bold truncate">{reference}</h3>
        </div>
      </div>
      <button
        onClick={onClose}
        aria-label={tr.close[lang]}
        className={cn(
          'p-2 rounded-md transition-colors',
          isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
        )}
      >
        <X className="h-5 w-5" />
      </button>
    </header>
  );

  /* Body — 3 columns desktop, stacked mobile */
  const Body = (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
      <p className={cn('text-xs leading-relaxed', mutedText)}>{tr.subtitle[lang]}</p>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className={cn('h-5 w-5 animate-spin', isDark ? 'text-slate-400' : 'text-slate-500')} />
          <span className={cn('ml-2 text-sm', mutedText)}>{tr.loading[lang]}</span>
        </div>
      )}

      {!loading && error && results.every((r) => !r.text) && (
        <div className="py-10 text-center">
          <p className={cn('text-sm mb-3', mutedText)}>{tr.errorEmpty[lang]}</p>
          <Button size="sm" variant="outline" onClick={() => {
            // re-trigger by toggling a state — easiest: replace results
            setResults((prev) => [...prev]);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (setError as any)(null);
          }}>
            {tr.retry[lang]}
          </Button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Version pickers (only for the 2 compare slots) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className={cn('block text-[10px] uppercase tracking-wider font-semibold mb-1', mutedText)}>
                {tr.pickerLabel[lang]} 2
              </label>
              <Select value={v2} onValueChange={setV2}>
                <SelectTrigger className={cn('h-8 text-xs', isDark && 'bg-slate-800 border-slate-700')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {buildOptions([v1, v3]).map((bv) => (
                    <SelectItem key={bv.code} value={bv.code} className="text-xs">
                      {bv.full}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={cn('block text-[10px] uppercase tracking-wider font-semibold mb-1', mutedText)}>
                {tr.pickerLabel[lang]} 3
              </label>
              <Select value={v3} onValueChange={setV3}>
                <SelectTrigger className={cn('h-8 text-xs', isDark && 'bg-slate-800 border-slate-700')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {buildOptions([v1, v2]).map((bv) => (
                    <SelectItem key={bv.code} value={bv.code} className="text-xs">
                      {bv.full}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Verse cards */}
          <div className="grid grid-cols-1 gap-3">
            {results.map((r, idx) => {
              const isPrimary = idx === 0;
              return (
                <article
                  key={`${r.version}-${idx}`}
                  className={cn(
                    'rounded-xl border p-3 sm:p-4 transition-shadow',
                    cardBg,
                    cardBorder,
                    isPrimary && (isDark ? 'ring-1 ring-amber-400/40' : 'ring-2 ring-amber-300/70'),
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={cn(
                          'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                          isPrimary
                            ? (isDark ? 'bg-amber-500/30 text-amber-200' : 'bg-amber-200 text-amber-900')
                            : (isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-700'),
                        )}>
                          {getVersionLabel(r.version)}
                        </span>
                        {isPrimary && (
                          <span className={cn('text-[10px] font-medium', isDark ? 'text-amber-300/80' : 'text-amber-700')}>
                            {tr.sermonVersion[lang]}
                          </span>
                        )}
                      </div>
                      {r.book && (
                        <p className={cn('text-[11px] mt-1 font-medium', mutedText)}>{r.book}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopy(idx)}
                      disabled={!r.text}
                      aria-label={tr.copy[lang]}
                      className={cn(
                        'shrink-0 p-1.5 rounded-md transition-colors disabled:opacity-30',
                        isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200',
                      )}
                    >
                      {copiedIdx === idx ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <p
                    className={cn('text-sm sm:text-[15px] leading-relaxed font-serif', verseText)}
                    style={{ lineHeight: 1.7 }}
                  >
                    {r.text || <span className={cn('italic', mutedText)}>{tr.noText[lang]}</span>}
                  </p>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  /* Footer with global actions */
  const Footer = (
    <footer className={cn('flex items-center justify-between gap-2 px-4 py-3 border-t shrink-0', borderClass)}>
      {onSaveDefaults ? (
        <Button
          size="sm"
          variant="outline"
          onClick={handleSaveDefaults}
          disabled={savingDefaults}
          className="gap-1.5"
        >
          <Settings2 className="h-3.5 w-3.5" />
          {savingDefaults ? '...' : tr.saveDefaults[lang]}
        </Button>
      ) : <span />}
      <Button
        size="sm"
        onClick={handleShareAll}
        disabled={!results.some((r) => r.text)}
        className="gap-1.5"
      >
        <Share2 className="h-3.5 w-3.5" />
        {tr.share[lang]}
      </Button>
    </footer>
  );

  /* Desktop: right-side drawer. Mobile: bottom sheet. */
  if (isDesktop) {
    return createPortal(
      <>
        <button
          aria-label="overlay"
          onClick={onClose}
          className="fixed inset-0 z-[200] bg-black/50"
        />
        <aside
          className={cn(
            'fixed top-0 bottom-0 right-0 z-[210] w-[92vw] max-w-[520px] flex flex-col shadow-2xl border-l',
            surfaceBg,
            borderClass,
            'animate-in slide-in-from-right duration-300',
          )}
        >
          {Header}
          {Body}
          {Footer}
        </aside>
      </>,
      document.body,
    );
  }

  return createPortal(
    <>
      <button
        aria-label="overlay"
        onClick={onClose}
        className="fixed inset-0 z-[200] bg-black/60"
      />
      <div
        className={cn(
          'fixed left-0 right-0 bottom-0 z-[210] flex flex-col rounded-t-2xl shadow-2xl border-t',
          surfaceBg,
          borderClass,
          'max-h-[88vh] animate-in slide-in-from-bottom duration-300',
        )}
      >
        {/* drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <span className={cn('h-1.5 w-12 rounded-full', isDark ? 'bg-slate-700' : 'bg-slate-300')} />
        </div>
        {Header}
        {Body}
        {Footer}
      </div>
    </>,
    document.body,
  );
}
