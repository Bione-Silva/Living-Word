import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import {
  Church, Mic, Users, Plus, Loader2, Camera, Image as ImageIcon, User as UserIcon,
} from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

const COPY = {
  identity: { PT: 'Identidade Pastoral', EN: 'Pastoral Identity', ES: 'Identidad Pastoral' },
  context: { PT: 'Igreja & Congregação', EN: 'Church & Congregation', ES: 'Iglesia y Congregación' },
  blogAuthor: { PT: 'Autor do Blog', EN: 'Blog Author', ES: 'Autor del Blog' },
  doctrine: { PT: 'Doutrina / Tradição', EN: 'Doctrine / Tradition', ES: 'Doctrina / Tradición' },
  doctrineHint: {
    PT: 'Não está na lista? Clique em "Adicionar minha doutrina" e escreva como ela é chamada.',
    EN: 'Not in the list? Click "Add my doctrine" to write your own.',
    ES: '¿No está en la lista? Haz clic en "Agregar mi doctrina" para escribirla.',
  },
  addCustom: { PT: '+ Adicionar minha doutrina', EN: '+ Add my doctrine', ES: '+ Agregar mi doctrina' },
  customPh: { PT: 'Ex.: Igreja Local Independente, Comunidade Reformada...', EN: 'E.g.: Independent Local Church, Reformed Community...', ES: 'Ej.: Iglesia Local Independiente, Comunidad Reformada...' },
  pastoralVoice: { PT: 'Tom pastoral', EN: 'Pastoral tone', ES: 'Tono pastoral' },
  preachingStyle: { PT: 'Estilo de pregação', EN: 'Preaching style', ES: 'Estilo de predicación' },
  audience: { PT: 'Audiência principal', EN: 'Main audience', ES: 'Audiencia principal' },
  churchName: { PT: 'Nome da igreja', EN: 'Church name', ES: 'Nombre de la iglesia' },
  churchRole: { PT: 'Sua função', EN: 'Your role', ES: 'Tu función' },
  denomination: { PT: 'Denominação', EN: 'Denomination', ES: 'Denominación' },
  churchLogo: { PT: 'Logomarca da igreja', EN: 'Church logo', ES: 'Logotipo de la iglesia' },
  churchLogoHint: {
    PT: 'Aparece no seu blog quando você escolher "Mostrar a igreja" abaixo.',
    EN: 'Shown on your blog when you choose "Show the church" below.',
    ES: 'Aparece en tu blog cuando eliges "Mostrar la iglesia" abajo.',
  },
  uploadLogo: { PT: 'Enviar logo', EN: 'Upload logo', ES: 'Subir logo' },
  removeLogo: { PT: 'Remover', EN: 'Remove', ES: 'Quitar' },
  authorPastor: { PT: 'Mostrar o pastor (foto pessoal)', EN: 'Show the pastor (personal photo)', ES: 'Mostrar al pastor (foto personal)' },
  authorChurch: { PT: 'Mostrar a igreja (logomarca)', EN: 'Show the church (logo)', ES: 'Mostrar la iglesia (logotipo)' },
  blogAuthorHint: {
    PT: 'Define como você aparece como autor nos artigos do blog.',
    EN: 'Defines how you appear as author in blog articles.',
    ES: 'Define cómo apareces como autor en los artículos del blog.',
  },
  save: { PT: 'Salvar alterações', EN: 'Save changes', ES: 'Guardar cambios' },
  saving: { PT: 'Salvando...', EN: 'Saving...', ES: 'Guardando...' },
  saved: { PT: 'Perfil pastoral atualizado.', EN: 'Pastoral profile updated.', ES: 'Perfil pastoral actualizado.' },
  saveError: { PT: 'Erro ao salvar.', EN: 'Save failed.', ES: 'Error al guardar.' },
  uploadError: { PT: 'Erro ao enviar imagem.', EN: 'Upload failed.', ES: 'Error al subir imagen.' },
};

const DOCTRINES = [
  'Pentecostal', 'Batista', 'Presbiteriano', 'Assembleia de Deus',
  'Metodista', 'Anglicano', 'Luterano', 'Reformado', 'Carismático',
  'Adventista', 'Congregacional', 'Interdenominacional',
];

const TONES_PT = ['Acolhedor', 'Profundo', 'Profético', 'Didático', 'Inspirador', 'Pastoral'];
const STYLES_PT = ['Expositivo', 'Temático', 'Narrativo', 'Aplicativo', 'Devocional'];
const AUDIENCES_PT = ['Leigos', 'Maduros na fé', 'Jovens', 'Famílias', 'Mistos'];

export function ChurchProfileSection() {
  const { profile, user, refreshProfile } = useAuth();
  const { lang } = useLanguage();
  const l = lang as L;
  const tr = (k: keyof typeof COPY) => COPY[k][l] || COPY[k].PT;

  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showCustomDoctrine, setShowCustomDoctrine] = useState(false);

  // form
  const [churchName, setChurchName] = useState('');
  const [churchRole, setChurchRole] = useState('');
  const [denomination, setDenomination] = useState('');
  const [doctrine, setDoctrine] = useState<string>('');
  const [customDoctrine, setCustomDoctrine] = useState('');
  const [pastoralVoice, setPastoralVoice] = useState('');
  const [preachingStyle, setPreachingStyle] = useState('');
  const [audience, setAudience] = useState('');
  const [churchLogoUrl, setChurchLogoUrl] = useState('');
  const [blogAuthorDisplay, setBlogAuthorDisplay] = useState<'pastor' | 'church'>('pastor');

  useEffect(() => {
    if (!profile) return;
    const p = profile as any;
    setChurchName(p.church_name || '');
    setChurchRole(p.church_role || '');
    setDenomination(p.denomination || '');
    setDoctrine(p.doctrine || '');
    setCustomDoctrine(p.custom_doctrine || '');
    setShowCustomDoctrine(!!p.custom_doctrine);
    setPastoralVoice(p.pastoral_voice || '');
    setPreachingStyle(p.preaching_style || '');
    setAudience(p.audience || '');
    setChurchLogoUrl(p.church_logo_url || '');
    setBlogAuthorDisplay((p.blog_author_display as 'pastor' | 'church') || 'pastor');
  }, [profile]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${user.id}/church-logo.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('blog-images')
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('blog-images').getPublicUrl(path);
      const url = data.publicUrl + '?t=' + Date.now();
      setChurchLogoUrl(url);
      await supabase.from('profiles').update({ church_logo_url: url } as any).eq('id', user.id);
      await refreshProfile();
      toast.success(tr('saved'));
    } catch (err) {
      console.error('logo upload', err);
      toast.error(tr('uploadError'));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!user) return;
    setChurchLogoUrl('');
    await supabase.from('profiles').update({ church_logo_url: null } as any).eq('id', user.id);
    await refreshProfile();
    if (blogAuthorDisplay === 'church') setBlogAuthorDisplay('pastor');
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          church_name: churchName || null,
          church_role: churchRole || null,
          denomination: denomination || null,
          doctrine: doctrine || null,
          custom_doctrine: showCustomDoctrine && customDoctrine ? customDoctrine : null,
          pastoral_voice: pastoralVoice || null,
          preaching_style: preachingStyle || null,
          audience: audience || null,
          blog_author_display: blogAuthorDisplay,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success(tr('saved'));
    } catch (err) {
      console.error(err);
      toast.error(tr('saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* CHURCH IDENTITY + LOGO */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Church className="h-5 w-5 text-primary" />
            {tr('context')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Logo uploader */}
          <div className="space-y-2">
            <Label>{tr('churchLogo')}</Label>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                {churchLogoUrl ? (
                  <img src={churchLogoUrl} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <ImageIcon className="h-7 w-7 text-muted-foreground/50" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                  <Button asChild variant="outline" size="sm" disabled={uploadingLogo}>
                    <span>
                      {uploadingLogo ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
                      {tr('uploadLogo')}
                    </span>
                  </Button>
                </label>
                {churchLogoUrl && (
                  <Button variant="ghost" size="sm" onClick={handleRemoveLogo}>
                    {tr('removeLogo')}
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">{tr('churchLogoHint')}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{tr('churchName')}</Label>
              <Input value={churchName} onChange={(e) => setChurchName(e.target.value)} placeholder="Igreja Batista..." />
            </div>
            <div className="space-y-2">
              <Label>{tr('churchRole')}</Label>
              <Input value={churchRole} onChange={(e) => setChurchRole(e.target.value)} placeholder="Pastor titular, Líder..." />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{tr('denomination')}</Label>
            <Input value={denomination} onChange={(e) => setDenomination(e.target.value)} placeholder="Convenção / rede" />
          </div>
        </CardContent>
      </Card>

      {/* BLOG AUTHOR DISPLAY */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {tr('blogAuthor')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{tr('blogAuthorHint')}</p>
          <RadioGroup
            value={blogAuthorDisplay}
            onValueChange={(v) => setBlogAuthorDisplay(v as 'pastor' | 'church')}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${blogAuthorDisplay === 'pastor' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'}`}>
              <RadioGroupItem value="pastor" className="mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <UserIcon className="h-4 w-4" />
                  {tr('authorPastor')}
                </div>
              </div>
            </label>
            <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${blogAuthorDisplay === 'church' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'} ${!churchLogoUrl ? 'opacity-60' : ''}`}>
              <RadioGroupItem value="church" className="mt-0.5" disabled={!churchLogoUrl} />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Church className="h-4 w-4" />
                  {tr('authorChurch')}
                </div>
                {!churchLogoUrl && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {lang === 'PT' ? 'Envie a logomarca acima para liberar.' : lang === 'EN' ? 'Upload the logo above to enable.' : 'Sube el logotipo arriba para habilitar.'}
                  </p>
                )}
              </div>
            </label>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* PASTORAL IDENTITY */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            {tr('identity')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Doctrine */}
          <div className="space-y-2">
            <Label>{tr('doctrine')}</Label>
            {!showCustomDoctrine ? (
              <>
                <Select value={doctrine} onValueChange={setDoctrine}>
                  <SelectTrigger><SelectValue placeholder={tr('doctrine')} /></SelectTrigger>
                  <SelectContent>
                    {DOCTRINES.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={() => { setShowCustomDoctrine(true); setDoctrine(''); }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline mt-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {tr('addCustom')}
                </button>
              </>
            ) : (
              <>
                <Textarea
                  value={customDoctrine}
                  onChange={(e) => setCustomDoctrine(e.target.value)}
                  placeholder={tr('customPh')}
                  rows={2}
                  className="resize-none"
                />
                <button
                  type="button"
                  onClick={() => { setShowCustomDoctrine(false); setCustomDoctrine(''); }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {lang === 'PT' ? '← Voltar à lista' : lang === 'EN' ? '← Back to list' : '← Volver a la lista'}
                </button>
              </>
            )}
            <p className="text-xs text-muted-foreground">{tr('doctrineHint')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{tr('pastoralVoice')}</Label>
              <Select value={pastoralVoice} onValueChange={setPastoralVoice}>
                <SelectTrigger><SelectValue placeholder={tr('pastoralVoice')} /></SelectTrigger>
                <SelectContent>
                  {TONES_PT.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{tr('preachingStyle')}</Label>
              <Select value={preachingStyle} onValueChange={setPreachingStyle}>
                <SelectTrigger><SelectValue placeholder={tr('preachingStyle')} /></SelectTrigger>
                <SelectContent>
                  {STYLES_PT.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{tr('audience')}</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger><SelectValue placeholder={tr('audience')} /></SelectTrigger>
              <SelectContent>
                {AUDIENCES_PT.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{tr('saving')}</> : tr('save')}
        </Button>
      </div>
    </div>
  );
}
