import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Crown } from 'lucide-react';
import type { Language } from '@/lib/i18n';

export default function Configuracoes() {
  const { profile, refreshProfile } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const isFree = profile?.plan === 'free';
  const [savingLanguage, setSavingLanguage] = useState(false);

  const handleLanguageChange = async (value: Language) => {
    const previousLang = lang;
    setLang(value);

    if (!profile?.id) return;

    setSavingLanguage(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ language: value, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (error) throw error;
      await refreshProfile();
      toast.success(value === 'PT' ? 'Idioma da conta atualizado.' : value === 'EN' ? 'Account language updated.' : 'Idioma de la cuenta actualizado.');
    } catch {
      setLang(previousLang);
      toast.error(previousLang === 'PT' ? 'Não foi possível salvar o idioma da conta.' : previousLang === 'EN' ? 'Could not save account language.' : 'No fue posible guardar el idioma de la cuenta.');
    } finally {
      setSavingLanguage(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">{t('settings.title')}</h1>

      <Tabs defaultValue="profile">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="profile">{t('settings.profile')}</TabsTrigger>
          <TabsTrigger value="blog">{t('settings.blog')}</TabsTrigger>
          <TabsTrigger value="plan">{t('settings.plan')}</TabsTrigger>
          <TabsTrigger value="doctrine">{t('settings.doctrine')}</TabsTrigger>
          <TabsTrigger value="language">{t('settings.language')}</TabsTrigger>
          <TabsTrigger value="account">{t('settings.account')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle className="font-display">{t('settings.profile')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('auth.name')}</Label>
                <Input defaultValue={profile?.full_name || ''} />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.email')}</Label>
                <Input disabled value="email@example.com" />
              </div>
              <Button className="bg-primary text-primary-foreground">{t('settings.save')}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blog">
          <Card>
            <CardHeader><CardTitle className="font-display">{t('settings.blog')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Handle</Label>
                <div className="flex items-center gap-0 border border-input rounded-md overflow-hidden">
                  <Input defaultValue={profile?.blog_handle || ''} className="border-0" />
                  <span className="text-sm text-muted-foreground px-3 bg-secondary">.livingword.app</span>
                </div>
              </div>
              {!isFree && (
                <div className="space-y-2">
                  <Label>WordPress URL (Pastoral+)</Label>
                  <Input placeholder="https://seu-site.com" />
                </div>
              )}
              <Button className="bg-primary text-primary-foreground">{t('settings.save')}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan">
          <Card>
            <CardHeader><CardTitle className="font-display">{t('settings.plan')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="capitalize text-sm px-3 py-1">{profile?.plan || 'free'}</Badge>
                <span className="text-sm text-muted-foreground">
                  {profile?.generations_used || 0}/{profile?.generations_limit || 5} gerações usadas
                </span>
              </div>
              {isFree && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">{t('upgrade.title')}</p>
                  <p className="text-xs text-muted-foreground mb-3">{t('upgrade.trial')}</p>
                  <Button className="bg-primary text-primary-foreground gap-1" asChild>
                    <a href="/upgrade"><Crown className="h-4 w-4" /> {t('upgrade.cta')}</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="doctrine">
          <Card>
            <CardHeader><CardTitle className="font-display">{t('settings.doctrine')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Doutrina / Tradição</Label>
                <Select defaultValue="Interdenominacional">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Pentecostal', 'Batista', 'Presbiteriano', 'Assembleia de Deus', 'Metodista', 'Anglicano', 'Interdenominacional'].map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="bg-primary text-primary-foreground">Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="language">
          <Card>
            <CardHeader><CardTitle className="font-display">{t('settings.language')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('auth.language')}</Label>
                <Select value={lang} onValueChange={(v) => void handleLanguageChange(v as Language)} disabled={savingLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PT">Português</SelectItem>
                    <SelectItem value="EN">English</SelectItem>
                    <SelectItem value="ES">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader><CardTitle className="font-display">{t('settings.account')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Button variant="destructive">Excluir conta</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
