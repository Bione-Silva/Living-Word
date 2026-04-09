import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Language } from '@/lib/i18n';
import { toast } from 'sonner';

const languages: { code: Language; label: string }[] = [
  { code: 'PT', label: 'Português' },
  { code: 'EN', label: 'English' },
  { code: 'ES', label: 'Español' },
];

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  const { profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleLanguageChange = async (nextLang: Language) => {
    if (nextLang === lang || saving) return;

    const previousLang = lang;
    setLang(nextLang);

    if (!profile?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ language: nextLang, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (error) throw error;
      await refreshProfile();
    } catch {
      setLang(previousLang);
      toast.error(
        previousLang === 'PT'
          ? 'Não foi possível atualizar o idioma.'
          : previousLang === 'EN'
            ? 'Could not update the language.'
            : 'No fue posible actualizar el idioma.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground" disabled={saving}>
          <Globe className="h-4 w-4" />
          <span className="text-xs font-medium">{lang}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => void handleLanguageChange(l.code)}
            className={lang === l.code ? 'bg-accent' : ''}
          >
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
