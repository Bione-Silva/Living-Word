import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Wand2, Copy, BookOpen, Save, Lock, Loader2 } from 'lucide-react';
import { LockedTab } from '@/components/LockedTab';

const audiences = [
  { value: 'general', label: { PT: 'Congregação geral', EN: 'General congregation', ES: 'Congregación general' } },
  { value: 'youth', label: { PT: 'Jovens', EN: 'Youth', ES: 'Jóvenes' } },
  { value: 'immigrants', label: { PT: 'Imigrantes brasileiros', EN: 'Brazilian immigrants', ES: 'Inmigrantes brasileños' } },
  { value: 'women', label: { PT: 'Mulheres', EN: 'Women', ES: 'Mujeres' } },
  { value: 'leaders', label: { PT: 'Líderes de célula', EN: 'Cell leaders', ES: 'Líderes de célula' } },
];

const bibleVersions = [
  { value: 'ARA', label: 'ARA (Almeida Revista)', free: true },
  { value: 'NVI', label: 'NVI (Nova Versão Internacional)', free: true },
  { value: 'NAA', label: 'NAA (Nova Almeida Atualizada)', free: false },
  { value: 'ESV', label: 'ESV (English Standard)', free: false },
  { value: 'RVR', label: 'RVR (Reina Valera)', free: false },
];

const voices = [
  { value: 'acolhedor', label: { PT: 'Acolhedor', EN: 'Welcoming', ES: 'Acogedor' }, free: true },
  { value: 'profético', label: { PT: 'Profético', EN: 'Prophetic', ES: 'Profético' }, free: false },
  { value: 'expositivo', label: { PT: 'Expositivo', EN: 'Expository', ES: 'Expositivo' }, free: false },
  { value: 'jovem', label: { PT: 'Jovem', EN: 'Youth', ES: 'Joven' }, free: false },
];

const formatTabs = [
  { id: 'sermon', label: { PT: 'Sermão', EN: 'Sermon', ES: 'Sermón' }, free: true },
  { id: 'outline', label: { PT: 'Esboço', EN: 'Outline', ES: 'Esquema' }, free: true },
  { id: 'devotional', label: { PT: 'Devocional', EN: 'Devotional', ES: 'Devocional' }, free: true },
  { id: 'reels', label: { PT: 'Reels', EN: 'Reels', ES: 'Reels' }, free: false },
  { id: 'bilingual', label: { PT: 'Bilíngue', EN: 'Bilingual', ES: 'Bilingüe' }, free: false },
  { id: 'cell', label: { PT: 'Célula', EN: 'Cell Group', ES: 'Célula' }, free: false },
];

export default function Estudio() {
  const { user, profile } = useAuth();
  const { t, lang } = useLanguage();
  const isFree = profile?.plan === 'free';

  const [passage, setPassage] = useState('');
  const [audience, setAudience] = useState('general');
  const [context, setContext] = useState('');
  const [version, setVersion] = useState('ARA');
  const [voice, setVoice] = useState('acolhedor');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('sermon');
  const [upgradeHint, setUpgradeHint] = useState('');

  const handleGenerate = async () => {
    if (!passage.trim()) {
      toast.error(lang === 'PT' ? 'Informe uma passagem bíblica' : 'Enter a Bible passage');
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-pastoral-material', {
        body: {
          bible_passage: passage,
          audience,
          pain_point: context,
          language: lang,
          bible_version: version,
          output_modes: ['sermon', 'outline', 'devotional'],
        },
      });
      if (error) throw error;
      if (data?.outputs) {
        setOutputs(data.outputs);
      }
      if (data?.upgrade_hint) {
        setUpgradeHint(data.upgrade_hint);
      }
      toast.success(lang === 'PT' ? 'Material gerado com sucesso!' : 'Material generated!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar material');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(lang === 'PT' ? 'Copiado!' : 'Copied!');
  };

  const handleSave = async (tabId: string) => {
    if (!user || !outputs[tabId]) return;
    setSaving(true);
    try {
      const tabMeta = formatTabs.find((f) => f.id === tabId);
      const title = `${tabMeta?.label[lang] || tabId} — ${passage}`;

      const { error } = await supabase.from('materials').insert({
        user_id: user.id,
        title,
        type: tabId,
        passage,
        content: outputs[tabId],
        language: lang,
        bible_version: version,
      });
      if (error) throw error;
      toast.success(lang === 'PT' ? 'Salvo na Biblioteca!' : 'Saved to Library!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (tabId: string) => {
    if (!user || !outputs[tabId]) return;
    setSaving(true);
    try {
      const tabMeta = formatTabs.find((f) => f.id === tabId);
      const title = `${tabMeta?.label[lang] || tabId} — ${passage}`;

      // Insert material
      const { data: material, error: matErr } = await supabase
        .from('materials')
        .insert({
          user_id: user.id,
          title,
          type: tabId === 'devotional' ? 'blog_article' : tabId,
          passage,
          content: outputs[tabId],
          language: lang,
          bible_version: version,
        })
        .select('id')
        .single();
      if (matErr) throw matErr;

      // Insert into editorial queue as published
      const { error: qErr } = await supabase.from('editorial_queue').insert({
        user_id: user.id,
        material_id: material.id,
        status: 'published',
        published_at: new Date().toISOString(),
      });
      if (qErr) throw qErr;

      toast.success(lang === 'PT' ? 'Publicado no blog!' : 'Published to blog!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao publicar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">{t('studio.title')}</h1>

      {upgradeHint && isFree && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-center justify-between">
          <p className="text-sm text-primary">{upgradeHint}</p>
          <Button size="sm" variant="outline" className="border-primary text-primary" asChild>
            <a href="/upgrade">{t('upgrade.cta')}</a>
          </Button>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Column */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('studio.passage')}</Label>
              <Input value={passage} onChange={(e) => setPassage(e.target.value)} placeholder="Ex: João 15:1-8" />
            </div>
            <div className="space-y-2">
              <Label>{t('studio.audience')}</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {audiences.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label[lang]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('studio.context')}</Label>
              <Textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="Solidão, saudade de casa..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('studio.version')}</Label>
                <Select value={version} onValueChange={setVersion}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {bibleVersions.map((v) => (
                      <SelectItem key={v.value} value={v.value} disabled={!v.free && isFree}>
                        <span className="flex items-center gap-2">
                          {v.label}
                          {!v.free && <Lock className="h-3 w-3" />}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('studio.voice')}</Label>
                <Select value={voice} onValueChange={setVoice}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {voices.map((v) => (
                      <SelectItem key={v.value} value={v.value} disabled={!v.free && isFree}>
                        <span className="flex items-center gap-2">
                          {v.label[lang]}
                          {!v.free && <Lock className="h-3 w-3" />}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleGenerate} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-base h-12" disabled={generating}>
              {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
              {t('studio.generate')}
            </Button>
          </CardContent>
        </Card>

        {/* Output Column */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Output</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex flex-wrap h-auto gap-1 bg-secondary/50 p-1">
                {formatTabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} disabled={!tab.free && isFree} className="gap-1 text-xs data-[state=active]:bg-card">
                    {!tab.free && <Lock className="h-3 w-3" />}
                    {tab.label[lang]}
                  </TabsTrigger>
                ))}
              </TabsList>
              {formatTabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="mt-4">
                  {!tab.free && isFree ? (
                    <LockedTab formatName={tab.label[lang]} />
                  ) : (
                    <div>
                      {outputs[tab.id] ? (
                        <div className="relative">
                          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                            {outputs[tab.id]}
                          </div>
                          {isFree && (
                            <div className="mt-4 p-3 bg-muted/80 rounded text-center text-xs text-muted-foreground">
                              ⚠️ Rascunho gerado com IA. Revise, ore e pregue com sua voz.
                            </div>
                          )}
                          <div className="flex gap-2 mt-4">
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => handleCopy(outputs[tab.id])}>
                              <Copy className="h-3 w-3" /> {t('studio.copy')}
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => handleSave(tab.id)} disabled={saving}>
                              <Save className="h-3 w-3" /> {t('studio.save')}
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => handlePublish(tab.id)} disabled={saving}>
                              <BookOpen className="h-3 w-3" /> {t('studio.publish')}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-16 text-muted-foreground">
                          <Wand2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">
                            {lang === 'PT' ? 'Gere um material para ver o resultado aqui' : 'Generate material to see results here'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
