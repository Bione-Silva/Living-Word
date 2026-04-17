import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Check, ChevronRight, Sparkles, Wand2 } from 'lucide-react';
import { useForceLightTheme } from '@/hooks/useForceLightTheme';

type L = 'PT' | 'EN' | 'ES';

const DENOMINATIONS = [
  'Batista', 'Presbiteriana', 'Assembleia de Deus', 'Pentecostal',
  'Metodista', 'Anglicana', 'Luterana', 'Congregacional',
  'Interdenominacional', 'Outra',
];

const ROLES: { id: string; label: Record<L, string> }[] = [
  { id: 'pastor_senior', label: { PT: 'Pastor Sênior', EN: 'Senior Pastor', ES: 'Pastor Principal' } },
  { id: 'pastor_auxiliar', label: { PT: 'Pastor Auxiliar', EN: 'Associate Pastor', ES: 'Pastor Auxiliar' } },
  { id: 'lider_celula', label: { PT: 'Líder de Célula', EN: 'Cell Leader', ES: 'Líder de Célula' } },
  { id: 'professor', label: { PT: 'Professor / EBD', EN: 'Teacher / Sunday School', ES: 'Profesor / Escuela Dominical' } },
  { id: 'missionario', label: { PT: 'Missionário', EN: 'Missionary', ES: 'Misionero' } },
  { id: 'outro', label: { PT: 'Outro', EN: 'Other', ES: 'Otro' } },
];

const THEOLOGIES: { id: string; label: Record<L, string> }[] = [
  { id: 'reformado', label: { PT: 'Reformado / Calvinista', EN: 'Reformed / Calvinist', ES: 'Reformado / Calvinista' } },
  { id: 'arminiano', label: { PT: 'Armínio-Wesleyano', EN: 'Arminian-Wesleyan', ES: 'Arminiano-Wesleyano' } },
  { id: 'pentecostal', label: { PT: 'Pentecostal Tradicional', EN: 'Traditional Pentecostal', ES: 'Pentecostal Tradicional' } },
  { id: 'neopentecostal', label: { PT: 'Neopentecostal', EN: 'Neo-Pentecostal', ES: 'Neopentecostal' } },
  { id: 'batista', label: { PT: 'Batista Histórico', EN: 'Historical Baptist', ES: 'Bautista Histórico' } },
  { id: 'outro', label: { PT: 'Outro / Não definido', EN: 'Other / Undefined', ES: 'Otro / No definido' } },
];

const AUDIENCES: { id: string; label: Record<L, string> }[] = [
  { id: 'novos_convertidos', label: { PT: 'Novos convertidos', EN: 'New converts', ES: 'Nuevos convertidos' } },
  { id: 'igreja_madura', label: { PT: 'Igreja madura', EN: 'Mature church', ES: 'Iglesia madura' } },
  { id: 'jovens', label: { PT: 'Jovens / Universitários', EN: 'Youth / College', ES: 'Jóvenes / Universitarios' } },
  { id: 'misto', label: { PT: 'Misto / Variado', EN: 'Mixed / Varied', ES: 'Mixto / Variado' } },
  { id: 'familias', label: { PT: 'Famílias', EN: 'Families', ES: 'Familias' } },
];

const VOICES: { id: string; label: Record<L, string> }[] = [
  { id: 'academico', label: { PT: 'Acadêmico', EN: 'Academic', ES: 'Académico' } },
  { id: 'acolhedor', label: { PT: 'Acolhedor', EN: 'Welcoming', ES: 'Acogedor' } },
  { id: 'desafiador', label: { PT: 'Desafiador', EN: 'Challenging', ES: 'Desafiante' } },
  { id: 'narrativo', label: { PT: 'Narrativo / Histórias', EN: 'Narrative / Stories', ES: 'Narrativo / Historias' } },
];

const PREACHING_STYLES: { id: string; label: Record<L, string> }[] = [
  { id: 'expositivo', label: { PT: 'Expositivo (Haddon Robinson)', EN: 'Expository (Haddon Robinson)', ES: 'Expositivo (Haddon Robinson)' } },
  { id: 'tematico', label: { PT: 'Temático', EN: 'Topical', ES: 'Temático' } },
  { id: 'narrativo', label: { PT: 'Narrativo / Tópico', EN: 'Narrative / Topical', ES: 'Narrativo / Tópico' } },
  { id: 'textual', label: { PT: 'Textual', EN: 'Textual', ES: 'Textual' } },
];

const stepLabels: Record<L, string[]> = {
  PT: ['Sua Igreja', 'Teologia', 'Seu Rebanho', 'Portal & Voz', 'Pregação', 'Finalizar'],
  EN: ['Your Church', 'Theology', 'Your Flock', 'Portal & Voice', 'Preaching', 'Finish'],
  ES: ['Tu Iglesia', 'Teología', 'Tu Rebaño', 'Portal & Voz', 'Predicación', 'Finalizar'],
};

const microcopy: Record<L, (string | null)[]> = {
  PT: [
    'Conhecer sua estrutura nos ajuda a ajustar a linguagem da plataforma.',
    'Isso é crucial para que nossos Agentes não gerem interpretações fora da doutrina da sua congregação.',
    'Diga-nos quem você pastoreia para dosarmos aplicações práticas e profundidade acadêmica.',
    'Configure sua "Máquina de Artigos" — o tom exato para que os textos soem como você.',
    'Essa configuração calibra o motor de sermões para respeitar sua assinatura no púlpito.',
    null,
  ],
  EN: [
    'Knowing your church structure helps us fine-tune the platform language.',
    'This is crucial so our Agents don\'t generate interpretations outside your doctrine.',
    'Tell us who you pastor so our AI balances practical applications with academic depth.',
    'Configure your "Article Engine" — the exact tone so texts sound like you wrote them.',
    'This setting calibrates our sermon generator to respect your signature in the pulpit.',
    null,
  ],
  ES: [
    'Conocer tu estructura nos ayuda a ajustar el lenguaje de la plataforma.',
    'Esto es crucial para que nuestros Agentes no generen interpretaciones fuera de tu doctrina.',
    'Dinos a quién pastoreas para dosificar aplicaciones prácticas y profundidad académica.',
    'Configura tu "Máquina de Artículos" — el tono exacto para que los textos suenen como tú.',
    'Esta configuración calibra nuestro motor de sermones para respetar tu firma en el púlpito.',
    null,
  ],
};

export default function Onboarding() {
  useForceLightTheme();
  const { profile, refreshProfile } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [churchName, setChurchName] = useState('');
  const [denomination, setDenomination] = useState('');
  const [churchRole, setChurchRole] = useState('');
  const [doctrine, setDoctrine] = useState('');
  const [audience, setAudience] = useState('');
  const [blogName, setBlogName] = useState('');
  const [voice, setVoice] = useState('');
  const [preachingStyle, setPreachingStyle] = useState('');
  const [loading, setLoading] = useState(false);

  const totalSteps = 6;
  const progress = ((step) / totalSteps) * 100;
  const labels = stepLabels[lang] ?? stepLabels['PT'];
  const currentMicrocopy = microcopy[lang]?.[step - 1] ?? microcopy['PT']?.[step - 1];

  const handleFinish = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({
        church_name: churchName || null,
        denomination: denomination || null,
        church_role: churchRole || null,
        doctrine: doctrine || null,
        audience: audience || null,
        blog_name: blogName || null,
        pastoral_voice: voice || null,
        preaching_style: preachingStyle || null,
        profile_completed: true,
      }).eq('id', profile!.id);

      if (error) throw error;
      await refreshProfile();

      toast.success(
        lang === 'PT' ? 'Perfil atualizado! Bem-vindo ao Living Word.' :
        lang === 'EN' ? 'Profile updated! Welcome to Living Word.' :
        '¡Perfil actualizado! Bienvenido a Living Word.'
      );
      navigate('/blog-onboarding');
    } catch (err: any) {
      console.error('Onboarding error:', err);
      toast.error(err.message || 'Erro ao salvar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await supabase.from('profiles').update({ profile_completed: true }).eq('id', profile!.id);
      await refreshProfile();
      navigate('/dashboard');
    } catch {
      navigate('/dashboard');
    }
  };

  const OptionButton = ({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-3.5 rounded-xl border text-sm text-left transition-all ${
        selected
          ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/30'
          : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          selected ? 'border-primary bg-primary' : 'border-border'
        }`}>
          {selected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
        </div>
        <span className="font-medium">{children}</span>
      </div>
    </button>
  );

  return (
    <div className="theme-app min-h-screen relative flex items-center justify-center p-4 bg-background">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background:
            'radial-gradient(circle at 20% 10%, hsl(263 70% 50% / 0.08), transparent 50%), radial-gradient(circle at 80% 90%, hsl(43 80% 46% / 0.08), transparent 50%)',
        }}
      />

      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Wand2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold text-foreground">Living Word</span>
          </div>
        </div>

        {/* Skip */}
        <div className="text-right mb-2">
          <button onClick={handleSkip} className="text-xs text-muted-foreground hover:text-primary transition-colors">
            {lang === 'PT' ? 'Pular e ir ao painel →' : lang === 'EN' ? 'Skip to dashboard →' : 'Saltar al panel →'}
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {labels.map((label, i) => (
              <span key={i} className={`text-[10px] font-medium hidden sm:inline ${
                step > i + 1 ? 'text-primary' : step === i + 1 ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {label}
              </span>
            ))}
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 text-center sm:hidden">
            {step}/{totalSteps} — {labels[step - 1]}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-xl shadow-primary/5 p-7 sm:p-9">
          <h2 className="font-display text-xl font-bold text-foreground">{labels[step - 1]}</h2>

          {currentMicrocopy && (
            <p className="text-sm text-muted-foreground mt-2 mb-5 leading-relaxed italic">
              "{currentMicrocopy}"
            </p>
          )}
          {!currentMicrocopy && <div className="h-4" />}

          {/* STEP 1: Church */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="font-medium">
                  {lang === 'PT' ? 'Nome da Igreja' : lang === 'EN' ? 'Church Name' : 'Nombre de la Iglesia'}
                </Label>
                <Input value={churchName} onChange={(e) => setChurchName(e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-medium">
                  {lang === 'PT' ? 'Denominação' : lang === 'EN' ? 'Denomination' : 'Denominación'}
                </Label>
                <Select value={denomination} onValueChange={setDenomination}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DENOMINATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">
                  {lang === 'PT' ? 'Seu Cargo' : lang === 'EN' ? 'Your Role' : 'Tu Cargo'}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <OptionButton key={r.id} selected={churchRole === r.id} onClick={() => setChurchRole(r.id)}>
                      {r.label[lang]}
                    </OptionButton>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Theology */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="space-y-2">
                {THEOLOGIES.map((t) => (
                  <OptionButton key={t.id} selected={doctrine === t.id} onClick={() => setDoctrine(t.id)}>
                    {t.label[lang]}
                  </OptionButton>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Audience */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="space-y-2">
                {AUDIENCES.map((a) => (
                  <OptionButton key={a.id} selected={audience === a.id} onClick={() => setAudience(a.id)}>
                    {a.label[lang]}
                  </OptionButton>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Portal & Voice */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="font-medium">
                  {lang === 'PT' ? 'Nome do seu Portal / Blog' : lang === 'EN' ? 'Your Blog / Portal Name' : 'Nombre de tu Portal / Blog'}
                </Label>
                <Input value={blogName} onChange={(e) => setBlogName(e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">
                  {lang === 'PT' ? 'Tom de Voz Padrão' : lang === 'EN' ? 'Default Voice Tone' : 'Tono de Voz Predeterminado'}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {VOICES.map((v) => (
                    <OptionButton key={v.id} selected={voice === v.id} onClick={() => setVoice(v.id)}>
                      {v.label[lang]}
                    </OptionButton>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Preaching */}
          {step === 5 && (
            <div className="space-y-3">
              <div className="space-y-2">
                {PREACHING_STYLES.map((s) => (
                  <OptionButton key={s.id} selected={preachingStyle === s.id} onClick={() => setPreachingStyle(s.id)}>
                    {s.label[lang]}
                  </OptionButton>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: Summary */}
          {step === 6 && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {lang === 'PT'
                  ? `Tudo pronto, ${profile?.full_name?.split(' ')[0] || 'Pastor'}! Pressione o botão abaixo para salvar seu perfil pastoral.`
                  : lang === 'EN'
                  ? `All set, ${profile?.full_name?.split(' ')[0] || 'Pastor'}! Press the button below to save your pastoral profile.`
                  : `¡Todo listo, ${profile?.full_name?.split(' ')[0] || 'Pastor'}! Presiona el botón para guardar tu perfil pastoral.`}
              </p>
              <div className="rounded-xl bg-muted border border-border p-4 space-y-1.5 text-sm text-foreground">
                {churchName && <p><strong>{lang === 'PT' ? 'Igreja' : lang === 'EN' ? 'Church' : 'Iglesia'}:</strong> {churchName}</p>}
                {denomination && <p><strong>{lang === 'PT' ? 'Denominação' : 'Denomination'}:</strong> {denomination}</p>}
                {doctrine && <p><strong>{lang === 'PT' ? 'Teologia' : 'Theology'}:</strong> {THEOLOGIES.find(t => t.id === doctrine)?.label[lang]}</p>}
                {audience && <p><strong>{lang === 'PT' ? 'Audiência' : 'Audience'}:</strong> {AUDIENCES.find(a => a.id === audience)?.label[lang]}</p>}
                {voice && <p><strong>{lang === 'PT' ? 'Voz' : 'Voice'}:</strong> {VOICES.find(v => v.id === voice)?.label[lang]}</p>}
                {preachingStyle && <p><strong>{lang === 'PT' ? 'Pregação' : 'Preaching'}:</strong> {PREACHING_STYLES.find(s => s.id === preachingStyle)?.label[lang]}</p>}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1 rounded-xl border-border text-foreground hover:bg-muted"
              >
                {lang === 'PT' ? 'Voltar' : lang === 'EN' ? 'Back' : 'Volver'}
              </Button>
            )}
            {step < 6 ? (
              <Button
                onClick={() => setStep(step + 1)}
                className="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-md shadow-primary/20"
              >
                {lang === 'PT' ? 'Próximo' : lang === 'EN' ? 'Next' : 'Siguiente'} <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                className="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-md shadow-primary/20"
                disabled={loading}
              >
                {loading ? '...' : (
                  <>
                    <Sparkles className="mr-1.5 h-4 w-4" />
                    {lang === 'PT' ? 'Salvar e continuar' : lang === 'EN' ? 'Save and continue' : 'Guardar y continuar'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs mt-6 text-muted-foreground">
          Feito com ❤️ por Living Word
        </p>
      </div>
    </div>
  );
}
