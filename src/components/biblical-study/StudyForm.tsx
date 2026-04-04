import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Loader2 } from 'lucide-react';
import type { BiblicalStudyFormData } from '@/types/biblical-study';
import { useLanguage } from '@/contexts/LanguageContext';

interface StudyFormProps {
  onSubmit: (data: BiblicalStudyFormData) => void;
  isLoading: boolean;
}

const doctrineOptions = [
  { value: 'evangelical_general', label: 'Evangélico Geral' },
  { value: 'reformed', label: 'Reformada / Calvinista' },
  { value: 'pentecostal', label: 'Pentecostal / Carismática' },
  { value: 'baptist', label: 'Batista' },
  { value: 'methodist', label: 'Metodista' },
  { value: 'catholic', label: 'Católica' },
  { value: 'lutheran', label: 'Luterana' },
  { value: 'interdenominational', label: 'Interdenominacional' },
];

const voiceOptions = [
  { value: 'welcoming', label: 'Acolhedor' },
  { value: 'prophetic', label: 'Profético' },
  { value: 'didactic', label: 'Didático' },
  { value: 'evangelistic', label: 'Evangelístico' },
  { value: 'contemplative', label: 'Contemplativo' },
];

const bibleVersions = ['ARA', 'NVI', 'NAA', 'KJV', 'ESV', 'NKJV', 'NIV', 'ARC'];

const depthOptions = [
  { value: 'basic', label: 'Básico (grupos, células, iniciantes)' },
  { value: 'intermediate', label: 'Intermediário (líderes, professores)' },
  { value: 'advanced', label: 'Avançado (pastores, teólogos)' },
];

const languageOptions = [
  { value: 'PT', label: 'Português' },
  { value: 'EN', label: 'English' },
  { value: 'ES', label: 'Español' },
];

export function StudyForm({ onSubmit, isLoading }: StudyFormProps) {
  const { lang } = useLanguage();
  const [formData, setFormData] = useState<BiblicalStudyFormData>({
    bible_passage: '',
    theme: '',
    language: lang,
    bible_version: 'ARA',
    doctrine_line: 'evangelical_general',
    pastoral_voice: 'welcoming',
    depth_level: 'intermediate',
  });

  useEffect(() => {
    setFormData(prev => ({ ...prev, language: lang }));
  }, [lang]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bible_passage.trim()) return;
    onSubmit(formData);
  };

  const update = (field: keyof BiblicalStudyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Configurar Estudo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bible_passage">Passagem Bíblica *</Label>
            <Input
              id="bible_passage"
              placeholder="Ex: João 3:16 ou Romanos 8:1-11"
              value={formData.bible_passage}
              onChange={e => update('bible_passage', e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="theme">Tema ou Foco (opcional)</Label>
            <Input
              id="theme"
              placeholder="Ex: graça, fé, cura, salvação"
              value={formData.theme}
              onChange={e => update('theme', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Linha Doutrinária</Label>
            <Select value={formData.doctrine_line} onValueChange={v => update('doctrine_line', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {doctrineOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Tom Pastoral</Label>
            <Select value={formData.pastoral_voice} onValueChange={v => update('pastoral_voice', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {voiceOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Versão Bíblica</Label>
            <Select value={formData.bible_version} onValueChange={v => update('bible_version', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {bibleVersions.map(v => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Profundidade</Label>
            <Select value={formData.depth_level} onValueChange={v => update('depth_level', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {depthOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Idioma do Estudo</Label>
            <Select value={formData.language} onValueChange={v => update('language', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {languageOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full gap-2" disabled={isLoading || !formData.bible_passage.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando estudo teológico...
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4" />
                Gerar Estudo Bíblico
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
