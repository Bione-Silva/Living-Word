import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Crown, Camera, Loader2, Church } from 'lucide-react';
import { TrialCountdown } from '@/components/TrialCountdown';
import { BlogThemeCustomizer } from '@/components/blog/BlogThemeCustomizer';
import { CreditUsageReport } from '@/components/dashboard/CreditUsageReport';
import { PlanOverviewCard } from '@/components/dashboard/PlanOverviewCard';
import { CreditTopUpButton } from '@/components/dashboard/CreditTopUpButton';
import { PushNotificationsCard } from '@/components/PushNotificationsCard';
import { ChurchProfileSection } from '@/components/settings/ChurchProfileSection';
import { AutoFeedSettingsCard } from '@/components/settings/AutoFeedSettingsCard';
import { PLAN_CREDITS, LOW_CREDITS_THRESHOLD, PLAN_DISPLAY_NAMES, type PlanSlug } from '@/lib/plans';
import { normalizePlan, isFreePlan } from '@/lib/plan-normalization';
import { BIBLE_VERSIONS, DEFAULT_COMPARE_VERSIONS } from '@/lib/bible-versions';
import type { Language } from '@/lib/i18n';

type L = 'PT' | 'EN' | 'ES';

const LABELS: Record<string, Record<L, string>> = {
  full_name: { PT: 'Nome completo', EN: 'Full name', ES: 'Nombre completo' },
  email: { PT: 'E-mail', EN: 'Email', ES: 'Correo electrónico' },
  phone: { PT: 'Celular', EN: 'Mobile phone', ES: 'Celular' },
  street: { PT: 'Rua / Avenida', EN: 'Street / Avenue', ES: 'Calle / Avenida' },
  neighborhood: { PT: 'Bairro', EN: 'Neighborhood / District', ES: 'Barrio / Colonia' },
  city: { PT: 'Cidade', EN: 'City', ES: 'Ciudad' },
  state: { PT: 'Estado / Província', EN: 'State / Province', ES: 'Estado / Provincia' },
  zip_code: { PT: 'CEP', EN: 'ZIP / Postal Code', ES: 'Código Postal' },
  country: { PT: 'País', EN: 'Country', ES: 'País' },
  avatar: { PT: 'Foto de perfil', EN: 'Profile photo', ES: 'Foto de perfil' },
  saving: { PT: 'Salvando...', EN: 'Saving...', ES: 'Guardando...' },
  saved: { PT: 'Perfil salvo com sucesso!', EN: 'Profile saved successfully!', ES: '¡Perfil guardado con éxito!' },
  save_error: { PT: 'Erro ao salvar perfil.', EN: 'Error saving profile.', ES: 'Error al guardar perfil.' },
  upload_error: { PT: 'Erro ao enviar foto.', EN: 'Error uploading photo.', ES: 'Error al subir foto.' },
};

const COUNTRIES = [
  { code: 'BR', label: { PT: 'Brasil', EN: 'Brazil', ES: 'Brasil' } },
  { code: 'US', label: { PT: 'Estados Unidos', EN: 'United States', ES: 'Estados Unidos' } },
  { code: 'MX', label: { PT: 'México', EN: 'Mexico', ES: 'México' } },
  { code: 'PT', label: { PT: 'Portugal', EN: 'Portugal', ES: 'Portugal' } },
  { code: 'AO', label: { PT: 'Angola', EN: 'Angola', ES: 'Angola' } },
  { code: 'MZ', label: { PT: 'Moçambique', EN: 'Mozambique', ES: 'Mozambique' } },
  { code: 'CO', label: { PT: 'Colômbia', EN: 'Colombia', ES: 'Colombia' } },
  { code: 'AR', label: { PT: 'Argentina', EN: 'Argentina', ES: 'Argentina' } },
  { code: 'CL', label: { PT: 'Chile', EN: 'Chile', ES: 'Chile' } },
  { code: 'PE', label: { PT: 'Peru', EN: 'Peru', ES: 'Perú' } },
  { code: 'OTHER', label: { PT: 'Outro', EN: 'Other', ES: 'Otro' } },
];

export default function Configuracoes() {
  const { profile, user, refreshProfile } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const isFree = isFreePlan(profile?.plan);
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Profile form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const l = lang as L;
  const lb = (key: string) => LABELS[key]?.[l] || LABELS[key]?.['PT'] || key;

  // Populate form from profile
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone((profile as any).phone || '');
      setStreet((profile as any).street || '');
      setNeighborhood((profile as any).neighborhood || '');
      setCity((profile as any).city || '');
      setState((profile as any).state || '');
      setZipCode((profile as any).zip_code || '');
      setCountry((profile as any).country || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('blog-images').getPublicUrl(filePath);
      const newUrl = urlData.publicUrl + '?t=' + Date.now();

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (updateError) throw updateError;

      setAvatarUrl(newUrl);
      await refreshProfile();
      toast.success(lb('saved'));
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error(lb('upload_error'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile?.id) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          street,
          neighborhood,
          city,
          state,
          zip_code: zipCode,
          country,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', profile.id);
      if (error) throw error;
      await refreshProfile();
      toast.success(lb('saved'));
    } catch {
      toast.error(lb('save_error'));
    } finally {
      setSavingProfile(false);
    }
  };

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

  const userEmail = user?.email || 'email@example.com';
  const initials = fullName ? fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val }, { replace: true });
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{t('settings.title')}</h1>

      <Tabs value={initialTab} onValueChange={handleTabChange}>
        <TabsList className="bg-secondary/50 flex-wrap h-auto gap-1">
          <TabsTrigger value="profile" className="text-xs sm:text-sm">{t('settings.profile')}</TabsTrigger>
          <TabsTrigger value="church" className="text-xs sm:text-sm gap-1">
            <Church className="h-3.5 w-3.5" />
            {lang === 'PT' ? 'Igreja' : lang === 'EN' ? 'Church' : 'Iglesia'}
          </TabsTrigger>
          <TabsTrigger value="blog" className="text-xs sm:text-sm">{t('settings.blog')}</TabsTrigger>
          <TabsTrigger value="plan" className="text-xs sm:text-sm">{t('settings.plan')}</TabsTrigger>
          <TabsTrigger value="doctrine" className="text-xs sm:text-sm">{t('settings.doctrine')}</TabsTrigger>
          <TabsTrigger value="language" className="text-xs sm:text-sm">{t('settings.language')}</TabsTrigger>
          <TabsTrigger value="account" className="text-xs sm:text-sm">{t('settings.account')}</TabsTrigger>
        </TabsList>

        {/* PROFILE TAB — Complete */}
        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle className="font-display">{t('settings.profile')}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Avatar className="h-20 w-20 border-2 border-primary/20">
                    <AvatarImage src={avatarUrl} alt={fullName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    {uploadingAvatar ? (
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5 text-white" />
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                  </label>
                </div>
                <div>
                  <p className="text-sm font-medium">{lb('avatar')}</p>
                  <p className="text-xs text-muted-foreground">
                    {lang === 'PT' ? 'Clique para alterar' : lang === 'EN' ? 'Click to change' : 'Haz clic para cambiar'}
                  </p>
                </div>
              </div>

              {/* Name + Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{lb('full_name')}</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{lb('email')}</Label>
                  <Input disabled value={userEmail} className="bg-muted/50" />
                </div>
              </div>

              {/* Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{lb('phone')}</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={country === 'BR' ? '(11) 99999-9999' : country === 'US' ? '(555) 123-4567' : '+52 55 1234 5678'} />
                </div>
              </div>

              {/* Address */}
              <div className="border-t pt-4 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {lang === 'PT' ? 'Endereço' : lang === 'EN' ? 'Address' : 'Dirección'}
                </h3>

                <div className="space-y-2">
                  <Label>{lb('street')}</Label>
                  <Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder={country === 'BR' ? 'Rua das Flores, 123' : country === 'US' ? '123 Main Street' : 'Av. Reforma 456'} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{lb('neighborhood')}</Label>
                    <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder={country === 'BR' ? 'Centro' : country === 'MX' ? 'Colonia Roma' : 'Downtown'} />
                  </div>
                  <div className="space-y-2">
                    <Label>{lb('city')}</Label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{lb('state')}</Label>
                    <Input value={state} onChange={(e) => setState(e.target.value)} placeholder={country === 'BR' ? 'SP' : country === 'US' ? 'CA' : 'CDMX'} />
                  </div>
                  <div className="space-y-2">
                    <Label>{lb('zip_code')}</Label>
                    <Input value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder={country === 'BR' ? '01000-000' : country === 'US' ? '90210' : '06600'} />
                  </div>
                  <div className="space-y-2">
                    <Label>{lb('country')}</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger><SelectValue placeholder={lb('country')} /></SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.label[l]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={savingProfile} className="bg-primary text-primary-foreground">
                {savingProfile ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{lb('saving')}</> : t('settings.save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CHURCH TAB — Pastoral identity, logo, doctrine */}
        <TabsContent value="church">
          <ChurchProfileSection />
        </TabsContent>

        <TabsContent value="blog">
          <Card>
            <CardHeader><CardTitle className="font-display">{t('settings.blog')}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
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
              <div className="border-t border-border pt-6">
                <BlogThemeCustomizer />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan">
          <div className="space-y-6">
            <PlanOverviewCard />
            <AutoFeedSettingsCard />
            <Card>
              <CardHeader><CardTitle className="font-display">{t('settings.plan')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="capitalize text-sm px-3 py-1">
                    {PLAN_DISPLAY_NAMES[normalizePlan(profile?.plan)]?.[lang as 'PT'|'EN'|'ES'] || normalizePlan(profile?.plan)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {(() => {
                      const userPlan: PlanSlug = normalizePlan(profile?.plan);
                      const used = profile?.generations_used || 0;
                      const limit = PLAN_CREDITS[userPlan] || 500;
                      const remaining = Math.max(limit - used, 0);
                      return `🟢 ${remaining.toLocaleString()} / ${limit.toLocaleString()} ${lang === 'PT' ? 'créditos disponíveis' : lang === 'EN' ? 'credits available' : 'créditos disponibles'}`;
                    })()}
                  </span>
                </div>
                {isFree && (
                  <>
                    <TrialCountdown />
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <p className="text-sm font-medium mb-2">{t('upgrade.title')}</p>
                      <p className="text-xs text-muted-foreground mb-3">{t('upgrade.trial')}</p>
                      <Button className="bg-primary text-primary-foreground gap-1" asChild>
                        <a href="/upgrade"><Crown className="h-4 w-4" /> {t('upgrade.cta')}</a>
                      </Button>
                    </div>
                  </>
                )}
                {(() => {
                  const userPlan: PlanSlug = normalizePlan(profile?.plan);
                  const used = profile?.generations_used || 0;
                  const limit = PLAN_CREDITS[userPlan] || 500;
                  const remaining = Math.max(limit - used, 0);
                  return remaining < LOW_CREDITS_THRESHOLD ? <CreditTopUpButton /> : null;
                })()}
              </CardContent>
            </Card>
            <CreditUsageReport />
          </div>
        </TabsContent>

        <TabsContent value="doctrine">
          <Card>
            <CardHeader><CardTitle className="font-display">{t('settings.doctrine')}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {/* Bible Version */}
              <div className="space-y-2">
                <Label>{lang === 'PT' ? 'Versão Bíblica Padrão' : lang === 'EN' ? 'Default Bible Version' : 'Versión Bíblica Predeterminada'}</Label>
                <Select
                  value={profile?.bible_version || 'ARA'}
                  onValueChange={async (value) => {
                    if (!profile?.id) return;
                    try {
                      const { error } = await supabase
                        .from('profiles')
                        .update({ bible_version: value, updated_at: new Date().toISOString() })
                        .eq('id', profile.id);
                      if (error) throw error;
                      await refreshProfile();
                      toast.success(lang === 'PT' ? 'Versão bíblica atualizada!' : lang === 'EN' ? 'Bible version updated!' : '¡Versión bíblica actualizada!');
                    } catch {
                      toast.error(lb('save_error'));
                    }
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[
                      { value: 'ARA', label: 'ARA — Almeida Revista e Atualizada' },
                      { value: 'ACF', label: 'ACF — Almeida Corrigida Fiel' },
                      { value: 'NVI', label: 'NVI — Nova Versão Internacional' },
                      { value: 'NVT', label: 'NVT — Nova Versão Transformadora' },
                      { value: 'KJV', label: 'KJV — King James Version' },
                      { value: 'ESV', label: 'ESV — English Standard Version' },
                      { value: 'NIV', label: 'NIV — New International Version' },
                      { value: 'NASB', label: 'NASB — New American Standard Bible' },
                      { value: 'RVR60', label: 'RVR60 — Reina-Valera 1960' },
                      { value: 'NTV', label: 'NTV — Nueva Traducción Viviente' },
                    ].map((v) => (
                      <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {lang === 'PT' ? 'A versão escolhida será usada nas buscas e gerações de conteúdo.' : lang === 'EN' ? 'This version will be used in searches and content generation.' : 'Esta versión se utilizará en búsquedas y generación de contenido.'}
                </p>
              </div>

              {/* Pulpit Mode — Compare versions */}
              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex items-center justify-between gap-2">
                  <Label className="font-semibold">
                    {lang === 'PT' ? 'Comparar no Modo Púlpito' : lang === 'EN' ? 'Compare in Pulpit Mode' : 'Comparar en Modo Púlpito'}
                  </Label>
                  <Badge variant="secondary" className="text-[10px]">
                    {lang === 'PT' ? 'Pregação' : lang === 'EN' ? 'Preaching' : 'Predicación'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {lang === 'PT'
                    ? 'Quando o pregador tocar em um versículo no Modo Púlpito, abrimos um painel com a versão do sermão + estas duas versões para comparar.'
                    : lang === 'EN'
                    ? "When you tap a verse in Pulpit Mode, we'll open a panel with the sermon version + these two extra versions to compare."
                    : 'Cuando el predicador toque un versículo en el Modo Púlpito, abriremos un panel con la versión del sermón + estas dos versiones para comparar.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {([
                    {
                      key: 'pulpit_compare_version_2' as const,
                      labelPT: 'Versão de comparação 2',
                      labelEN: 'Compare version 2',
                      labelES: 'Versión de comparación 2',
                      defaultIdx: 0,
                    },
                    {
                      key: 'pulpit_compare_version_3' as const,
                      labelPT: 'Versão de comparação 3',
                      labelEN: 'Compare version 3',
                      labelES: 'Versión de comparación 3',
                      defaultIdx: 1,
                    },
                  ]).map(({ key, labelPT, labelEN, labelES, defaultIdx }) => {
                    const userLangKey = (lang as 'PT' | 'EN' | 'ES') || 'PT';
                    const fb = DEFAULT_COMPARE_VERSIONS[userLangKey][defaultIdx];
                    const current =
                      (profile as unknown as Record<string, unknown> | null)?.[key] as string | null | undefined;
                    return (
                      <div key={key} className="space-y-1.5">
                        <Label className="text-xs">
                          {lang === 'PT' ? labelPT : lang === 'EN' ? labelEN : labelES}
                        </Label>
                        <Select
                          value={current || fb}
                          onValueChange={async (value) => {
                            if (!profile?.id) return;
                            try {
                              const { error } = await supabase
                                .from('profiles')
                                .update({ [key]: value, updated_at: new Date().toISOString() })
                                .eq('id', profile.id);
                              if (error) throw error;
                              await refreshProfile();
                              toast.success(lang === 'PT' ? 'Versão de comparação salva!' : lang === 'EN' ? 'Compare version saved!' : '¡Versión de comparación guardada!');
                            } catch {
                              toast.error(lb('save_error'));
                            }
                          }}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {BIBLE_VERSIONS.map((bv) => (
                              <SelectItem key={bv.code} value={bv.code}>{bv.full}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Doctrine */}
              <div className="space-y-2">
                <Label>{t('settings.doctrine_label')}</Label>
                <Select defaultValue="Interdenominacional">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Pentecostal', 'Batista', 'Presbiteriano', 'Assembleia de Deus', 'Metodista', 'Anglicano', 'Interdenominacional'].map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="bg-primary text-primary-foreground">{t('settings.save')}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="language">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <span>🌐</span> {t('settings.language')}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {lang === 'PT'
                  ? 'Escolha o idioma da sua conta. A interface inteira muda imediatamente e a preferência é salva no seu perfil.'
                  : lang === 'EN'
                    ? 'Choose your account language. The entire interface updates instantly and the preference is saved to your profile.'
                    : 'Elige el idioma de tu cuenta. Toda la interfaz cambia al instante y la preferencia se guarda en tu perfil.'}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([
                  { code: 'PT' as Language, flag: '🇧🇷', name: 'Português', sub: 'Brasil' },
                  { code: 'EN' as Language, flag: '🇺🇸', name: 'English', sub: 'United States' },
                  { code: 'ES' as Language, flag: '🇪🇸', name: 'Español', sub: 'Internacional' },
                ]).map((opt) => {
                  const active = lang === opt.code;
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => void handleLanguageChange(opt.code)}
                      disabled={savingLanguage}
                      aria-pressed={active}
                      className={
                        'group relative flex flex-col items-center justify-center gap-1 rounded-xl border p-4 transition-all text-left ' +
                        (active
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/30 shadow-sm'
                          : 'border-border bg-card hover:border-primary/40 hover:bg-accent/40') +
                        (savingLanguage ? ' opacity-60 cursor-wait' : ' cursor-pointer')
                      }
                    >
                      <span className="text-3xl leading-none" aria-hidden="true">{opt.flag}</span>
                      <span className={'text-sm font-semibold ' + (active ? 'text-primary' : 'text-foreground')}>
                        {opt.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{opt.sub}</span>
                      {active && (
                        <span className="absolute top-2 right-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {savingLanguage && (
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {lang === 'PT' ? 'Salvando preferência...' : lang === 'EN' ? 'Saving preference...' : 'Guardando preferencia...'}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <PushNotificationsCard />
          <Card>
            <CardHeader><CardTitle className="font-display">{t('settings.account')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Button variant="destructive">{t('settings.delete_account')}</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
