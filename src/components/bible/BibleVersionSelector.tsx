import { useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getVersionsByLanguage, getBibleVersion, type L } from '@/lib/bible-data';
import { BookOpen, Check, Globe, Search, Sparkles } from 'lucide-react';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Props {
  value: string;
  onChange: (code: string) => void;
  compact?: boolean;
}

const langGroupLabels: Record<string, Record<L, string>> = {
  'Português': { PT: 'Português', EN: 'Portuguese', ES: 'Portugués' },
  'English': { PT: 'Inglês', EN: 'English', ES: 'Inglés' },
  'Español': { PT: 'Espanhol', EN: 'Spanish', ES: 'Español' },
};

const recommendedLabel: Record<L, string> = { PT: 'Recomendada', EN: 'Recommended', ES: 'Recomendada' };
const searchPlaceholder: Record<L, string> = {
  PT: 'Buscar versão (ex: NVI)...',
  EN: 'Search version (e.g. NIV)...',
  ES: 'Buscar versión (ej: NVI)...',
};
const noResults: Record<L, string> = {
  PT: 'Nenhuma versão encontrada',
  EN: 'No version found',
  ES: 'Ninguna versión encontrada',
};
const changeLabel: Record<L, string> = { PT: 'Trocar', EN: 'Change', ES: 'Cambiar' };

export function BibleVersionSelector({ value, onChange, compact }: Props) {
  const { lang } = useLanguage();
  const groups = useMemo(() => getVersionsByLanguage(), []);
  const current = getBibleVersion(value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const handleSelect = (code: string) => {
    onChange(code);
    setOpen(false);
    setQuery('');
  };

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return groups;
    const q = query.trim().toLowerCase();
    const out: Record<string, typeof groups[string]> = {};
    Object.entries(groups).forEach(([groupName, versions]) => {
      const matched = versions.filter(v =>
        v.shortLabel.toLowerCase().includes(q) ||
        v.name.toLowerCase().includes(q) ||
        v.code.toLowerCase().includes(q),
      );
      if (matched.length) out[groupName] = matched;
    });
    return out;
  }, [groups, query]);

  const hasResults = Object.keys(filteredGroups).length > 0;

  const VersionList = (
    <div className="bible-light max-h-[360px] overflow-y-auto">
      <div className="sticky top-0 z-10 bg-background border-b border-border p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder[lang]}
            autoFocus
            className="pl-8 h-8 text-xs bg-card border-border"
          />
        </div>
      </div>
      {hasResults ? (
        <div className="p-1">
          {Object.entries(filteredGroups).map(([groupName, versions]) => (
            <div key={groupName} className="mb-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-bold px-2 py-1.5">
                {langGroupLabels[groupName]?.[lang] || groupName}
              </div>
              {versions.filter(v => v.isAvailable).map(v => (
                <button
                  key={v.code}
                  onClick={() => handleSelect(v.code)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs hover:bg-muted/60 transition-colors ${
                    v.code === value ? 'bg-primary/10' : ''
                  }`}
                >
                  <span className="font-semibold text-foreground min-w-[40px] text-left">{v.shortLabel}</span>
                  <span className="text-muted-foreground truncate flex-1 text-left">{v.name}</span>
                  {v.isDefault && (
                    <Badge variant="secondary" className="h-4 px-1.5 text-[9px] gap-0.5 shrink-0 bg-primary/15 text-primary border-0">
                      <Sparkles className="h-2.5 w-2.5" />
                      {recommendedLabel[lang]}
                    </Badge>
                  )}
                  {v.code === value && <Check className="h-3 w-3 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 px-4 text-center text-xs text-muted-foreground">{noResults[lang]}</div>
      )}
    </div>
  );

  if (compact) {
    return (
      <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(''); }}>
        <PopoverTrigger asChild>
          <button className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium border border-border bg-muted/60 rounded-lg hover:bg-muted transition-colors">
            <Globe className="h-3 w-3 text-primary/60" />
            <span>{current?.shortLabel || value}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0 bible-light" align="end">
          {VersionList}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-primary/8 border border-primary/15">
        <BookOpen className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground truncate flex items-center gap-1.5">
            {current?.name || value}
            {current?.isDefault && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[9px] gap-0.5 bg-primary/15 text-primary border-0">
                <Sparkles className="h-2.5 w-2.5" />
                {recommendedLabel[lang]}
              </Badge>
            )}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {current ? `${current.shortLabel} • ${current.language}` : ''}
          </p>
        </div>
        <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(''); }}>
          <PopoverTrigger asChild>
            <button className="h-8 px-3 text-xs font-medium border border-primary/20 bg-primary/10 text-primary rounded-lg hover:bg-primary/15 transition-colors">
              {changeLabel[lang]}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0 bible-light" align="end">
            {VersionList}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
