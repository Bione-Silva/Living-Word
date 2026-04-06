import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Check, ChevronRight, Sparkles } from 'lucide-react';
import type { Language } from '@/lib/i18n';
import watermarkBg from '@/assets/onboarding-watermark.jpg';

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
  PT: ['Dados básicos', 'Sua Igreja', 'Teologia', 'Seu Rebanho', 'Portal & Voz', 'Pregação', 'Iniciar'],
  EN: ['Basic info', 'Your Church', 'Theology', 'Your Flock', 'Portal & Voice', 'Preaching', 'Launch'],
  ES: ['Datos básicos', 'Tu Iglesia', 'Teología', 'Tu Rebaño', 'Portal & Voz', 'Predicación', 'Iniciar'],
};

const microcopy: Record<L, (string | null)[]> = {
  PT: [
    null,
    'Conhecer sua estrutura nos ajuda a ajustar a linguagem da plataforma, seja para os sermões da igreja ou para roteiros de célula.',
    'Qual a sua visão principal? Isso é crucial para que nossos Agentes e Estudos Bíblicos não gerem interpretações que fujam da doutrina da sua congregação.',
    'Diga-nos quem você pastoreia. Assim nossa Inteligência Artificial saberá dosar as aplicações práticas e a profundidade acadêmica do estudo.',
    'Aqui configuramos a sua "Máquina de Artigos". Defina o tom exato para que os textos soem como se você mesmo estivesse escrevendo.',
    'Como você gosta de pregar? Essa configuração calibra o nosso motor de geração de sermões para respeitar a sua assinatura no púlpito.',
    null,
  ],
  EN: [
    null,
    'Knowing your church structure helps us fine-tune the platform language, whether for church sermons or cell group scripts.',
    'What is your main theological vision? This is crucial so our Agents and Bible Studies don\'t generate interpretations outside your congregation\'s doctrine.',
    'Tell us who you pastor. This way our AI will know how to balance practical applications with academic depth.',
    'Here we configure your "Article Engine". Set the exact tone so texts sound as if you wrote them yourself.',
    'How do you like to preach? This setting calibrates our sermon generator to respect your signature in the pulpit.',
    null,
  ],
  ES: [
    null,
    'Conocer tu estructura nos ayuda a ajustar el lenguaje de la plataforma, ya sea para sermones o guías de célula.',
    '¿Cuál es tu visión principal? Esto es crucial para que nuestros Agentes y Estudios Bíblicos no generen interpretaciones fuera de la doctrina de tu congregación.',
    'Dinos a quién pastoreas. Así nuestra IA sabrá dosificar las aplicaciones prácticas y la profundidad académica.',
    'Aquí configuramos tu "Máquina de Artículos". Define el tono exacto para que los textos suenen como si tú los escribieras.',
    '¿Cómo te gusta predicar? Esta configuración calibra nuestro motor de sermones para respetar tu firma en el púlpito.',
    null,
  ],
};

export default function Cadastro() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState<Language>('PT');
  // Step 2
  const [churchName, setChurchName] = useState('');
  const [denomination, setDenomination] = useState('');
  const [churchRole, setChurchRole] = useState('');
  // Step 3
  const [doctrine, setDoctrine] = useState('');
  // Step 4
  const [audience, setAudience] = useState('');
  // Step 5
  const [blogName, setBlogName] = useState('');
  const [voice, setVoice] = useState('');
  // Step 6
  const [preachingStyle, setPreachingStyle] = useState('');

  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const planParam = new URLSearchParams(window.location.search).get('plan');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const plan = new URLSearchParams(window.location.search).get('plan');
        if (plan) {
          navigate(`/upgrade?autoCheckout=${plan}`);
        } else {
          navigate('/dashboard');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { needsConfirmation } = await signUp(email, password, {
        full_name: name,
        blog_name: blogName || `${name}'s Blog`,
        language,
        doctrine,
        pastoral_voice: voice,
        church_name: churchName,
        denomination,
        church_role: churchRole,
        audience,
        preaching_style: preachingStyle,
      });

      setLang(language);

      if (needsConfirmation) {
        toast.info(
          language === 'PT' ? 'Verifique seu e-mail para confirmar a conta!' :
          language === 'EN' ? 'Check your email to confirm your account!' :
          '¡Revisa tu correo para confirmar tu cuenta!'
        );
        return;
      }

      toast.success(
        language === 'PT' ? 'Conta criada com sucesso!' :
        language === 'EN' ? 'Account created successfully!' :
        '¡Cuenta creada con éxito!'
      );

      navigate(planParam ? `/upgrade?autoCheckout=${planParam}` : '/blog-onboarding');
    } catch (err: any) {
      console.error('Signup error:', err);
      toast.error(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 7;
  const progress = ((step - 1) / (totalSteps - 1)) * 100;
  const currentMicrocopy = microcopy[lang]?.[step - 1] ?? microcopy['PT']?.[step - 1];
  const labels = stepLabels[lang] ?? stepLabels['PT'];

  const canAdvance = () => {
    switch (step) {
      case 1: return name && email && password;
      case 2: return true; // optional
      case 3: return true;
      case 4: return true;
      case 5: return true;
      case 6: return true;
      case 7: return true;
      default: return true;
    }
  };

  const OptionButton = ({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-3.5 rounded-xl border text-sm text-left transition-all ${
        selected
          ? 'border-[hsl(28,42%,42%)] bg-[hsl(28,42%,42%)]/10 text-[hsl(24,30%,20%)] ring-1 ring-[hsl(28,42%,42%)]/30'
          : 'border-[hsl(30,15%,82%)] bg-white/60 text-[hsl(24,20%,35%)] hover:border-[hsl(28,30%,60%)] hover:bg-[hsl(37,30%,97%)]'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          selected ? 'border-[hsl(28,42%,42%)] bg-[hsl(28,42%,42%)]' : 'border-[hsl(30,15%,72%)]'
        }`}>
          {selected && <Check className="h-2.5 w-2.5 text-white" />}
        </div>
        <span className="font-medium">{children}</span>
      </div>
    </button>
  );

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="font-display text-xl font-bold text-[hsl(24,30%,18%)]">{children}</h2>
  );

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4" style={{ backgroundColor: 'hsl(37, 33%, 96%)' }}>
      {/* Watermark background */}
      <img
        src={watermarkBg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-[0.12] pointer-events-none"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-[hsl(37,33%,96%)]/40 pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="font-display text-3xl font-bold" style={{ color: 'hsl(28, 42%, 38%)' }}>
            Living Word
          </Link>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {labels.map((label, i) => (
              <span key={i} className={`text-[10px] font-medium hidden sm:inline ${
                step > i + 1 ? 'text-[hsl(28,42%,42%)]' : step === i + 1 ? 'text-[hsl(24,30%,20%)]' : 'text-[hsl(24,15%,60%)]'
              }`}>
                {label}
              </span>
            ))}
          </div>
          <div className="w-full h-1.5 bg-[hsl(30,15%,88%)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[hsl(28,42%,42%)] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-[hsl(24,15%,50%)] mt-1.5 text-center sm:hidden">
            {step}/{totalSteps} — {labels[step - 1]}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[hsl(30,15%,85%)]/60 bg-white/80 backdrop-blur-sm shadow-[0_8px_40px_hsl(28,20%,50%,0.06)] p-7 sm:p-9">
          <SectionTitle>{labels[step - 1]}</SectionTitle>

          {currentMicrocopy && (
            <p className="text-sm text-[hsl(24,15%,45%)] mt-2 mb-5 leading-relaxed italic">
              "{currentMicrocopy}"
            </p>
          )}

          {!currentMicrocopy && <div className="h-4" />}

          {/* ── STEP 1: Basic Info ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[hsl(24,20%,30%)] font-medium">{t('auth.name')}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="border-[hsl(30,15%,82%)] bg-[hsl(37,30%,98%)] text-[hsl(24,30%,15%)]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[hsl(24,20%,30%)] font-medium">{t('auth.email')}</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border-[hsl(30,15%,82%)] bg-[hsl(37,30%,98%)] text-[hsl(24,30%,15%)]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[hsl(24,20%,30%)] font-medium">{t('auth.password')}</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="border-[hsl(30,15%,82%)] bg-[hsl(37,30%,98%)] text-[hsl(24,30%,15%)]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[hsl(24,20%,30%)] font-medium">{t('auth.language')}</Label>
                <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                  <SelectTrigger className="border-[hsl(30,15%,82%)] bg-[hsl(37,30%,98%)] text-[hsl(24,30%,15%)]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PT">Português</SelectItem>
                    <SelectItem value="EN">English</SelectItem>
                    <SelectItem value="ES">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full py-5 rounded-xl bg-[hsl(28,42%,42%)] hover:bg-[hsl(28,42%,36%)] text-white font-bold"
                disabled={!canAdvance()}
              >
                {t('auth.next')} <ChevronRight className="ml-1 h-4 w-4" />
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[hsl(30,15%,85%)]" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white/80 px-3 text-[hsl(24,15%,55%)]">ou</span></div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full py-5 text-sm font-medium rounded-xl border-[hsl(30,15%,82%)] bg-[hsl(37,30%,97%)] hover:bg-[hsl(37,25%,94%)] text-[hsl(24,30%,18%)]"
                onClick={async () => {
                  const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
                  if (result.error) toast.error('Erro ao entrar com Google');
                }}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {lang === 'PT' ? 'Continuar com Google' : lang === 'EN' ? 'Continue with Google' : 'Continuar con Google'}
              </Button>

              <p className="text-center text-sm text-[hsl(24,15%,50%)] mt-3">
                {lang === 'PT' ? 'Já tem conta?' : lang === 'EN' ? 'Already have an account?' : '¿Ya tienes cuenta?'}{' '}
                <Link to={planParam ? `/login?plan=${planParam}` : '/login'} className="font-medium hover:underline" style={{ color: 'hsl(28, 42%, 42%)' }}>
                  {t('auth.login')}
                </Link>
              </p>
            </div>
          )}

          {/* ── STEP 2: Church ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[hsl(24,20%,30%)] font-medium">
                  {lang === 'PT' ? 'Nome da Igreja' : lang === 'EN' ? 'Church Name' : 'Nombre de la Iglesia'}
                </Label>
                <Input value={churchName} onChange={(e) => setChurchName(e.target.value)} placeholder={lang === 'PT' ? 'Ex: Igreja Batista Central' : lang === 'EN' ? 'E.g. Central Baptist Church' : 'Ej: Iglesia Bautista Central'} className="border-[hsl(30,15%,82%)] bg-[hsl(37,30%,98%)] text-[hsl(24,30%,15%)]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[hsl(24,20%,30%)] font-medium">
                  {lang === 'PT' ? 'Denominação' : lang === 'EN' ? 'Denomination' : 'Denominación'}
                </Label>
                <Select value={denomination} onValueChange={setDenomination}>
                  <SelectTrigger className="border-[hsl(30,15%,82%)] bg-[hsl(37,30%,98%)] text-[hsl(24,30%,15%)]"><SelectValue placeholder={lang === 'PT' ? 'Selecione...' : lang === 'EN' ? 'Select...' : 'Seleccione...'} /></SelectTrigger>
                  <SelectContent>
                    {DENOMINATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[hsl(24,20%,30%)] font-medium">
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

          {/* ── STEP 3: Theology ── */}
          {step === 3 && (
            <div className="space-y-3">
              <Label className="text-[hsl(24,20%,30%)] font-medium">
                {lang === 'PT' ? 'Linha Teológica Dominante' : lang === 'EN' ? 'Dominant Theological Line' : 'Línea Teológica Dominante'}
              </Label>
              <div className="space-y-2">
                {THEOLOGIES.map((t) => (
                  <OptionButton key={t.id} selected={doctrine === t.id} onClick={() => setDoctrine(t.id)}>
                    {t.label[lang]}
                  </OptionButton>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 4: Audience ── */}
          {step === 4 && (
            <div className="space-y-3">
              <Label className="text-[hsl(24,20%,30%)] font-medium">
                {lang === 'PT' ? 'Perfil do Seu Rebanho' : lang === 'EN' ? 'Your Flock Profile' : 'Perfil de Tu Rebaño'}
              </Label>
              <div className="space-y-2">
                {AUDIENCES.map((a) => (
                  <OptionButton key={a.id} selected={audience === a.id} onClick={() => setAudience(a.id)}>
                    {a.label[lang]}
                  </OptionButton>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 5: Portal & Voice ── */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[hsl(24,20%,30%)] font-medium">
                  {lang === 'PT' ? 'Nome do seu Portal / Blog' : lang === 'EN' ? 'Your Blog / Portal Name' : 'Nombre de tu Portal / Blog'}
                </Label>
                <Input value={blogName} onChange={(e) => setBlogName(e.target.value)} placeholder={lang === 'PT' ? 'Ex: Devocional do Pastor Marcos' : lang === 'EN' ? 'E.g. Pastor Mark\'s Devotional' : 'Ej: Devocional del Pastor Marcos'} className="border-[hsl(30,15%,82%)] bg-[hsl(37,30%,98%)] text-[hsl(24,30%,15%)]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[hsl(24,20%,30%)] font-medium">
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

          {/* ── STEP 6: Preaching Style ── */}
          {step === 6 && (
            <div className="space-y-3">
              <Label className="text-[hsl(24,20%,30%)] font-medium">
                {lang === 'PT' ? 'Estilo de Pregação Preferido' : lang === 'EN' ? 'Preferred Preaching Style' : 'Estilo de Predicación Preferido'}
              </Label>
              <div className="space-y-2">
                {PREACHING_STYLES.map((s) => (
                  <OptionButton key={s.id} selected={preachingStyle === s.id} onClick={() => setPreachingStyle(s.id)}>
                    {s.label[lang]}
                  </OptionButton>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 7: Launch ── */}
          {step === 7 && (
            <div className="space-y-5">
              <p className="text-sm text-[hsl(24,15%,40%)] leading-relaxed">
                {lang === 'PT'
                  ? `Tudo pronto, Pastor ${name.split(' ')[0] || ''}. Pressione o botão abaixo para enviar essas credenciais e criar seu banco de dados teológico exclusivo.`
                  : lang === 'EN'
                  ? `All set, Pastor ${name.split(' ')[0] || ''}. Press the button below to submit these credentials and create your exclusive theological database.`
                  : `Todo listo, Pastor ${name.split(' ')[0] || ''}. Presiona el botón a continuación para enviar estas credenciales y crear tu base de datos teológica exclusiva.`}
              </p>
              <div className="rounded-xl bg-[hsl(37,30%,97%)] border border-[hsl(30,15%,88%)] p-4 space-y-1.5 text-sm text-[hsl(24,20%,30%)]">
                <p><strong>{lang === 'PT' ? 'Nome' : lang === 'EN' ? 'Name' : 'Nombre'}:</strong> {name}</p>
                <p><strong>Email:</strong> {email}</p>
                {churchName && <p><strong>{lang === 'PT' ? 'Igreja' : lang === 'EN' ? 'Church' : 'Iglesia'}:</strong> {churchName}</p>}
                {denomination && <p><strong>{lang === 'PT' ? 'Denominação' : lang === 'EN' ? 'Denomination' : 'Denominación'}:</strong> {denomination}</p>}
                {doctrine && <p><strong>{lang === 'PT' ? 'Teologia' : lang === 'EN' ? 'Theology' : 'Teología'}:</strong> {THEOLOGIES.find(t => t.id === doctrine)?.label[lang]}</p>}
                {audience && <p><strong>{lang === 'PT' ? 'Audiência' : lang === 'EN' ? 'Audience' : 'Audiencia'}:</strong> {AUDIENCES.find(a => a.id === audience)?.label[lang]}</p>}
                {voice && <p><strong>{lang === 'PT' ? 'Voz' : lang === 'EN' ? 'Voice' : 'Voz'}:</strong> {VOICES.find(v => v.id === voice)?.label[lang]}</p>}
                {preachingStyle && <p><strong>{lang === 'PT' ? 'Pregação' : lang === 'EN' ? 'Preaching' : 'Predicación'}:</strong> {PREACHING_STYLES.find(s => s.id === preachingStyle)?.label[lang]}</p>}
              </div>
            </div>
          )}

          {/* ── Navigation Buttons (steps 2–7) ── */}
          {step > 1 && (
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1 rounded-xl border-[hsl(30,15%,82%)] text-[hsl(24,20%,35%)] hover:bg-[hsl(37,25%,94%)]"
              >
                {t('auth.back')}
              </Button>
              {step < 7 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  className="flex-1 rounded-xl bg-[hsl(28,42%,42%)] hover:bg-[hsl(28,42%,36%)] text-white font-bold"
                >
                  {t('auth.next')} <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="flex-1 rounded-xl bg-[hsl(28,42%,42%)] hover:bg-[hsl(28,42%,36%)] text-white font-bold"
                  disabled={loading}
                >
                  {loading ? '...' : (
                    <>
                      <Sparkles className="mr-1.5 h-4 w-4" />
                      {lang === 'PT' ? 'Ativar Mentes Brilhantes' : lang === 'EN' ? 'Activate Brilliant Minds' : 'Activar Mentes Brillantes'}
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: 'hsl(24, 15%, 55%)' }}>
          Feito com ❤️ por Living Word
        </p>
      </div>
    </div>
  );
}
