import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Sparkles, User, Mic, Church, Info } from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

/* ─────────── DNA Shape ─────────── */
export interface DnaData {
  profileType: 'personal' | 'pastor' | 'church';
  description: string;
  audience: string;
  communicationStyle: string;
}

const DEFAULT_DNA: DnaData = {
  profileType: 'personal',
  description: '',
  audience: '',
  communicationStyle: '',
};

/* ─────────── Static Labels ─────────── */
const L_TITLE: Record<L, string> = {
  PT: 'DNA da Minha Marca',
  EN: 'My Brand DNA',
  ES: 'ADN de Mi Marca',
};
const L_SUBTITLE: Record<L, string> = {
  PT: 'Descreva quem você é com suas próprias palavras. A IA vai usar essas informações para gerar Sermões, Devocionais, Legendas e todo conteúdo com a sua cara.',
  EN: 'Describe who you are in your own words. The AI will use this to generate Sermons, Devotionals, Captions and all content with your fingerprint.',
  ES: 'Describa quién es con sus propias palabras. La IA usará esto para generar Sermones, Devocionales, Leyendas y todo contenido con su huella.',
};
const L_WHY: Record<L, string> = {
  PT: '💡 Por que pedimos isso? Para que a IA aprenda a sua digital e gere conteúdo exatamente como se fosse você falando. Quanto mais detalhes, melhor o resultado.',
  EN: '💡 Why do we ask this? So the AI learns your fingerprint and generates content exactly as if you were speaking. The more detail, the better.',
  ES: '💡 ¿Por qué? Para que la IA aprenda su huella y genere contenido exactamente como si usted hablara. Cuantos más detalles, mejor.',
};
const L_PROFILE_TYPE: Record<L, string> = {
  PT: 'Quem é você na hora de criar conteúdo?',
  EN: 'Who are you when creating content?',
  ES: '¿Quién eres al crear contenido?',
};

/* ─────────── Profile Type Cards ─────────── */
const PROFILE_TYPES: {
  value: DnaData['profileType'];
  icon: typeof User;
  label: Record<L, string>;
  desc: Record<L, string>;
}[] = [
  {
    value: 'personal',
    icon: User,
    label: { PT: 'Criador / Pessoa', EN: 'Creator / Personal', ES: 'Creador / Personal' },
    desc: {
      PT: 'Influenciador cristão, coach, evangelista, mãe que inspira...',
      EN: 'Christian influencer, coach, evangelist, inspiring mom...',
      ES: 'Influencer cristiano, coach, evangelista, mamá que inspira...',
    },
  },
  {
    value: 'pastor',
    icon: Mic,
    label: { PT: 'Pastor / Líder / Pregador', EN: 'Pastor / Leader / Preacher', ES: 'Pastor / Líder / Predicador' },
    desc: {
      PT: 'Quem prega, ensina e lidera espiritualmente.',
      EN: 'Someone who preaches, teaches and leads spiritually.',
      ES: 'Quien predica, enseña y lidera espiritualmente.',
    },
  },
  {
    value: 'church',
    icon: Church,
    label: { PT: 'Igreja / Ministério', EN: 'Church / Ministry', ES: 'Iglesia / Ministerio' },
    desc: {
      PT: 'Conta oficial da instituição (linguagem em 3ª pessoa).',
      EN: 'Official institution account (3rd person language).',
      ES: 'Cuenta oficial de la institución (lenguaje en 3ª persona).',
    },
  },
];

/* ─────────── Dynamic Placeholders per profileType ─────────── */
const PLACEHOLDERS: Record<
  DnaData['profileType'],
  Record<L, { description: string; audience: string; communication: string }>
> = {
  personal: {
    PT: {
      description:
        'Meu nome é Ana, sou líder de células e produzo conteúdo cristão voltado ao estilo de vida das mulheres modernas. Falo sobre conciliar maternidade, trabalho e devoção diária sem religiosidade tóxica. Quero ter autoridade no nicho de fé e lifestyle feminino.',
      audience:
        'Mulheres na faixa de 25 a 45 anos, mães e profissionais que lutam com a ansiedade da vida moderna e querem viver uma fé autêntica sem se sentirem presas a regras ultrapassadas.',
      communication:
        'Tom direto, promocional e acessível, com linguagem simples e foco em benefícios claros. Usar frases curtas, chamadas para ação objetivas. Falar com o público em segunda pessoa ("seu perfil", "cresça"), mantendo uma comunicação clara, amigável e orientada à conexão.',
    },
    EN: {
      description:
        'My name is Ana, I lead small groups and produce Christian content for modern women. I talk about balancing motherhood, career, and daily devotion without toxic religiosity. I want to be an authority in the faith and feminine lifestyle niche.',
      audience:
        'Women aged 25-45, mothers and professionals struggling with modern-life anxiety who want to live authentic faith without feeling trapped by outdated rules.',
      communication:
        'Direct, warm, and accessible tone with simple language. Use short sentences, clear calls to action. Speak in second person ("your profile", "grow"), keeping communication friendly and connection-oriented.',
    },
    ES: {
      description:
        'Mi nombre es Ana, lidero células y produzco contenido cristiano para mujeres modernas. Hablo sobre conciliar maternidad, trabajo y devoción diaria sin religiosidad tóxica.',
      audience:
        'Mujeres de 25 a 45 años, madres y profesionales que luchan con la ansiedad moderna y quieren vivir una fe auténtica sin sentirse atrapadas por reglas anticuadas.',
      communication:
        'Tono directo, cálido y accesible con lenguaje simple. Frases cortas, llamados a la acción claros. Hablar en segunda persona, manteniendo comunicación amigable.',
    },
  },
  pastor: {
    PT: {
      description:
        'Sou pastor focado na exposição bíblica profunda, lidero uma congregação em expansão com ênfase forte em cura emocional e restauração de casamentos. Minha pregação é verso-a-verso, com aplicações práticas que tocam a realidade de quem está no banco da igreja.',
      audience:
        'Famílias cristãs com filhos adolescentes, casais em crise que buscam restauração, e jovens adultos reformados que amam teologia acadêmica com pés no chão.',
      communication:
        'Tom didático e acolhedor, semelhante ao estilo de Hernandes Dias Lopes. Sempre com introduções narrativas, contexto histórico do trecho bíblico, e fechamento com aplicação pessoal direta. Evitar linguagem genérica e superficial.',
    },
    EN: {
      description:
        'I am a pastor focused on deep biblical exposition, leading a growing congregation with strong emphasis on emotional healing and marriage restoration. My preaching is verse-by-verse, with practical applications.',
      audience:
        'Christian families with teenage children, couples in crisis seeking restoration, and young reformed adults who love academic theology with practical grounding.',
      communication:
        'Didactic and welcoming tone, similar to John MacArthur\'s style. Always with narrative introductions, historical context, and closing with direct personal application. Avoid generic and superficial language.',
    },
    ES: {
      description:
        'Soy pastor enfocado en la exposición bíblica profunda, lidero una congregación en expansión con énfasis en la sanación emocional y la restauración de matrimonios.',
      audience:
        'Familias cristianas con hijos adolescentes, parejas en crisis que buscan restauración, y jóvenes adultos reformados que aman la teología académica con los pies en la tierra.',
      communication:
        'Tono didáctico y acogedor. Siempre con introducciones narrativas, contexto histórico del pasaje bíblico, y cierre con aplicación personal directa.',
    },
  },
  church: {
    PT: {
      description:
        'O Ministério Vida Plena é uma igreja pentecostal moderna que visa ser um farol na cidade. Nosso foco central é o ensino profundo da Palavra misturado ao acolhimento de pessoas marginalizadas. Oferecemos células semanais, escola bíblica dominical e projetos sociais.',
      audience:
        'Moradores do nosso bairro e região, incluindo pessoas sem igreja que buscam recomeços, famílias que querem crescer juntas na fé, e jovens que procuram comunidade genuína.',
      communication:
        'Tom oficial, sempre em terceira pessoa ("O Ministério convida...", "Nossa comunidade celebra..."). Linguagem acolhedora mas institucional. Evitar gírias e informalidade excessiva. Priorizar clareza nos avisos e calor humano nos convites.',
    },
    EN: {
      description:
        'Full Life Ministry is a modern Pentecostal church that aims to be a beacon in the city. Our central focus is deep Word teaching mixed with welcoming marginalized people.',
      audience:
        'Neighbors and community members, including unchurched people seeking fresh starts, families wanting to grow together in faith, and young people looking for genuine community.',
      communication:
        'Official tone, always in third person ("The Ministry invites...", "Our community celebrates..."). Welcoming but institutional language. Avoid slang and excessive informality.',
    },
    ES: {
      description:
        'El Ministerio Vida Plena es una iglesia pentecostal moderna que busca ser un faro en la ciudad. Nuestro enfoque central es la enseñanza profunda de la Palabra mezclada con la acogida de personas marginadas.',
      audience:
        'Vecinos y miembros de la comunidad, personas sin iglesia que buscan nuevos comienzos, familias que quieren crecer juntas en la fe.',
      communication:
        'Tono oficial, siempre en tercera persona ("El Ministerio invita...", "Nuestra comunidad celebra..."). Lenguaje acogedor pero institucional.',
    },
  },
};

/* ─────────── Pillar labels ─────────── */
const PILLAR_LABELS: Record<
  'description' | 'audience' | 'communication',
  Record<L, { title: string; hint: string }>
> = {
  description: {
    PT: {
      title: 'Descrição do seu Perfil / Ministério',
      hint: 'O que você (ou sua igreja) faz? Quais problemas resolve? Quais são seus diferenciais?',
    },
    EN: {
      title: 'Profile / Ministry Description',
      hint: 'What do you (or your church) do? What problems do you solve? What makes you unique?',
    },
    ES: {
      title: 'Descripción de su Perfil / Ministerio',
      hint: '¿Qué hace usted (o su iglesia)? ¿Qué problemas resuelve? ¿Cuáles son sus diferenciales?',
    },
  },
  audience: {
    PT: {
      title: 'Público-Alvo',
      hint: 'Descreva quem é o seu público ideal. Idade, perfil, dores, aspirações.',
    },
    EN: {
      title: 'Target Audience',
      hint: 'Describe your ideal audience. Age, profile, pain points, aspirations.',
    },
    ES: {
      title: 'Público Objetivo',
      hint: 'Describa su público ideal. Edad, perfil, dolores, aspiraciones.',
    },
  },
  communication: {
    PT: {
      title: 'Estilo de Comunicação & Referências',
      hint: 'Como você fala? Quais são suas referências de pregação ou comunicação? (ex: profissional, casual, pastoral, confrontador...)',
    },
    EN: {
      title: 'Communication Style & References',
      hint: 'How do you speak? What are your preaching or communication references? (e.g., professional, casual, pastoral...)',
    },
    ES: {
      title: 'Estilo de Comunicación & Referencias',
      hint: '¿Cómo habla? ¿Cuáles son sus referencias de predicación o comunicación?',
    },
  },
};

/* ─────────── Helpers ─────────── */
function Hint({ text }: { text: string }) {
  return (
    <p className="flex items-start gap-1.5 text-xs text-muted-foreground bg-accent/40 rounded-lg px-3 py-2">
      <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
      {text}
    </p>
  );
}

function PillarField({
  title,
  hint,
  placeholder,
  value,
  onChange,
}: {
  title: string;
  hint: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-bold">{title}</Label>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={5}
        className="resize-y min-h-[120px] text-sm leading-relaxed"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export function DnaSetupCard({ lang }: { lang: L }) {
  const { profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [dna, setDna] = useState<DnaData>(DEFAULT_DNA);

  // Load from profile on mount
  useEffect(() => {
    if (profile) {
      const raw = (profile as any).dna_data;
      if (raw && typeof raw === 'object') {
        setDna({ ...DEFAULT_DNA, ...raw });
      }
    }
  }, [profile]);

  const patch = (partial: Partial<DnaData>) => setDna((prev) => ({ ...prev, ...partial }));

  const ph = PLACEHOLDERS[dna.profileType][lang];

  const handleSave = async () => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ dna_data: dna as any, updated_at: new Date().toISOString() } as any)
        .eq('id', profile.id);
      if (error) throw error;
      await refreshProfile();
      toast.success(
        lang === 'PT'
          ? 'DNA salvo! A IA já está aprendendo o seu estilo. ✨'
          : lang === 'EN'
          ? 'DNA saved! The AI is now learning your style. ✨'
          : '¡ADN guardado! La IA ya está aprendiendo tu estilo. ✨'
      );
    } catch (err) {
      console.error(err);
      toast.error(
        lang === 'PT'
          ? 'Erro ao salvar DNA.'
          : lang === 'EN'
          ? 'Error saving DNA.'
          : 'Error al guardar ADN.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {L_TITLE[lang]}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">{L_SUBTITLE[lang]}</p>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Microcopy Global */}
        <Hint text={L_WHY[lang]} />

        {/* ─── Step 1: Profile type ─── */}
        <div className="space-y-3">
          <Label className="text-sm font-bold uppercase tracking-wide text-foreground">
            {L_PROFILE_TYPE[lang]}
          </Label>
          <RadioGroup
            value={dna.profileType}
            onValueChange={(v) => patch({ profileType: v as DnaData['profileType'] })}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            {PROFILE_TYPES.map((pt) => {
              const active = dna.profileType === pt.value;
              const Icon = pt.icon;
              return (
                <label
                  key={pt.value}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    active
                      ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20'
                      : 'border-border bg-card hover:border-primary/30'
                  }`}
                >
                  <RadioGroupItem value={pt.value} className="sr-only" />
                  <Icon
                    className={`h-7 w-7 ${active ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <span
                    className={`text-sm font-bold text-center ${
                      active ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {pt.label[lang]}
                  </span>
                  <span className="text-[11px] text-muted-foreground text-center leading-tight">
                    {pt.desc[lang]}
                  </span>
                  {active && (
                    <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                </label>
              );
            })}
          </RadioGroup>
        </div>

        {/* ─── Step 2: Three Pillars ─── */}
        <div className="space-y-6 border-t border-border pt-6">
          <PillarField
            title={PILLAR_LABELS.description[lang].title}
            hint={PILLAR_LABELS.description[lang].hint}
            placeholder={ph.description}
            value={dna.description}
            onChange={(v) => patch({ description: v })}
          />
          <PillarField
            title={PILLAR_LABELS.audience[lang].title}
            hint={PILLAR_LABELS.audience[lang].hint}
            placeholder={ph.audience}
            value={dna.audience}
            onChange={(v) => patch({ audience: v })}
          />
          <PillarField
            title={PILLAR_LABELS.communication[lang].title}
            hint={PILLAR_LABELS.communication[lang].hint}
            placeholder={ph.communication}
            value={dna.communicationStyle}
            onChange={(v) => patch({ communicationStyle: v })}
          />
        </div>

        {/* Save */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto bg-primary text-primary-foreground gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />{' '}
              {lang === 'PT' ? 'Salvando...' : lang === 'EN' ? 'Saving...' : 'Guardando...'}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />{' '}
              {lang === 'PT'
                ? 'Salvar meu DNA'
                : lang === 'EN'
                ? 'Save my DNA'
                : 'Guardar mi ADN'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
