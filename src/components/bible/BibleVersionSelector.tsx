import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getVersionsByLanguage, getBibleVersion, type BibleVersion, type L } from '@/lib/bible-data';
import { BookOpen, Check, Globe } from 'lucide-react';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from '@/components/ui/select';

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

export function BibleVersionSelector({ value, onChange, compact }: Props) {
  const { lang } = useLanguage();
  const groups = useMemo(() => getVersionsByLanguage(), []);
  const current = getBibleVersion(value);

  if (compact) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-auto h-8 px-3 gap-1.5 text-xs font-medium border-border bg-muted/60 rounded-lg">
          <Globe className="h-3 w-3 text-primary/60" />
          <SelectValue placeholder={current?.shortLabel || value} />
        </SelectTrigger>
        <SelectContent className="bible-light max-h-[340px]">
          {Object.entries(groups).map(([groupName, versions]) => (
            <SelectGroup key={groupName}>
              <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-bold px-2 py-1.5">
                {langGroupLabels[groupName]?.[lang] || groupName}
              </SelectLabel>
              {versions.filter(v => v.isAvailable).map(v => (
                <SelectItem key={v.code} value={v.code} className="text-xs">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{v.shortLabel}</span>
                    <span className="text-muted-foreground">{v.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="space-y-2">
      {/* Active version banner */}
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-primary/8 border border-primary/15">
        <BookOpen className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground truncate">
            {current?.name || value}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {current ? `${current.shortLabel} • ${current.language}` : ''}
          </p>
        </div>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-auto h-8 px-3 gap-1.5 text-xs font-medium border-primary/20 bg-primary/10 text-primary rounded-lg hover:bg-primary/15 transition-colors">
            <span>{lang === 'PT' ? 'Trocar' : lang === 'ES' ? 'Cambiar' : 'Change'}</span>
          </SelectTrigger>
          <SelectContent className="bible-light max-h-[400px]">
            {Object.entries(groups).map(([groupName, versions]) => (
              <SelectGroup key={groupName}>
                <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-bold px-2 py-1.5">
                  {langGroupLabels[groupName]?.[lang] || groupName}
                </SelectLabel>
                {versions.filter(v => v.isAvailable).map(v => (
                  <SelectItem key={v.code} value={v.code} className="text-xs">
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{v.shortLabel}</span>
                      <span className="text-muted-foreground">{v.name}</span>
                      {v.code === value && <Check className="h-3 w-3 text-primary ml-auto" />}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
