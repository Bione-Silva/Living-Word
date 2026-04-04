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
  'evangelical_general', 'reformed', 'pentecostal', 'baptist',
  'methodist', 'catholic', 'lutheran', 'interdenominational',
];

const voiceOptions = ['welcoming', 'prophetic', 'didactic', 'evangelistic', 'contemplative'];

const bibleVersions = ['ARA', 'NVI', 'NAA', 'KJV', 'ESV', 'NKJV', 'NIV', 'ARC'];

const depthOptions = ['basic', 'intermediate', 'advanced'];

const languageOptions = [
  { value: 'PT', label: 'Português' },
  { value: 'EN', label: 'English' },
  { value: 'ES', label: 'Español' },
];

export function StudyForm({ onSubmit, isLoading }: StudyFormProps) {
  const { lang, t } = useLanguage();
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
          {t('study.configure')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bible_passage">{t('study.passage')} *</Label>
            <Input
              id="bible_passage"
              placeholder={t('study.passage_placeholder')}
              value={formData.bible_passage}
              onChange={e => update('bible_passage', e.target.value)}
              className="min-h-[48px]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="theme">{t('study.theme')}</Label>
            <Input
              id="theme"
              placeholder={t('study.theme_placeholder')}
              value={formData.theme}
              onChange={e => update('theme', e.target.value)}
              className="min-h-[48px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t('study.doctrine')}</Label>
            <Select value={formData.doctrine_line} onValueChange={v => update('doctrine_line', v)}>
              <SelectTrigger className="min-h-[48px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {doctrineOptions.map(o => (
                  <SelectItem key={o} value={o}>{t(`study.doctrine.${o}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t('study.voice')}</Label>
            <Select value={formData.pastoral_voice} onValueChange={v => update('pastoral_voice', v)}>
              <SelectTrigger className="min-h-[48px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {voiceOptions.map(o => (
                  <SelectItem key={o} value={o}>{t(`study.voice.${o}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t('study.version')}</Label>
            <Select value={formData.bible_version} onValueChange={v => update('bible_version', v)}>
              <SelectTrigger className="min-h-[48px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {bibleVersions.map(v => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t('study.depth')}</Label>
            <Select value={formData.depth_level} onValueChange={v => update('depth_level', v)}>
              <SelectTrigger className="min-h-[48px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {depthOptions.map(o => (
                  <SelectItem key={o} value={o}>{t(`study.depth.${o}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t('study.language')}</Label>
            <Select value={formData.language} onValueChange={v => update('language', v)}>
              <SelectTrigger className="min-h-[48px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {languageOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full gap-2 min-h-[48px]" disabled={isLoading || !formData.bible_passage.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('study.generating')}
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4" />
                {t('study.generate')}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
