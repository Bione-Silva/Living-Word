import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Sparkles, User, Mic, Church, Info } from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

/* ─────────── DNA Shape ─────────── */
export interface DnaData {
  profileType: 'personal' | 'pastor' | 'church';
  // Personal
  personalFocus?: string;
  personalVibe?: string;
  // Pastor
  preachingStyle?: string;
  preachingReference?: string;
  audienceProfile?: string;
  // Church
  churchTone?: string;
  churchPriority?: string;
  // Shared
  freeNotes?: string;
}

const DEFAULT_DNA: DnaData = { profileType: 'personal' };

/* ─────────── Labels ─────────── */
const L_TITLE: Record<L, string> = {
  PT: 'DNA da Minha Marca',
  EN: 'My Brand DNA',
  ES: 'ADN de Mi Marca',
};
const L_SUBTITLE: Record<L, string> = {
  PT: 'Configure como a IA aprende o seu estilo. Isso influencia Sermões, Devocionais, Legendas e todo conteúdo gerado.',
  EN: 'Configure how the AI learns your style. This influences Sermons, Devotionals, Captions and all generated content.',
  ES: 'Configure cómo la IA aprende su estilo. Esto influye en Sermones, Devocionales, Leyendas y todo el contenido generado.',
};

const L_WHY: Record<L, string> = {
  PT: '💡 Por que pedimos isso? Para que a IA aprenda a sua digital e gere conteúdo exatamente como se fosse você falando.',
  EN: '💡 Why do we ask this? So the AI learns your fingerprint and generates content exactly as if you were speaking.',
  ES: '💡 ¿Por qué lo pedimos? Para que la IA aprenda su huella y genere contenido exactamente como si usted hablara.',
};

const L_PROFILE_TYPE: Record<L, string> = {
  PT: 'Quem é você na hora de criar conteúdo?',
  EN: 'Who are you when creating content?',
  ES: '¿Quién eres al crear contenido?',
};

const PROFILE_TYPES: { value: DnaData['profileType']; icon: typeof User; label: Record<L, string>; desc: Record<L, string> }[] = [
  {
    value: 'personal',
    icon: User,
    label: { PT: 'Criador / Pessoa', EN: 'Creator / Personal', ES: 'Creador / Personal' },
    desc: { PT: 'Influenciador cristão, coach, evangelista, mãe que inspira...', EN: 'Christian influencer, coach, evangelist, inspiring mom...', ES: 'Influencer cristiano, coach, evangelista, mamá que inspira...' },
  },
  {
    value: 'pastor',
    icon: Mic,
    label: { PT: 'Pastor / Líder / Pregador', EN: 'Pastor / Leader / Preacher', ES: 'Pastor / Líder / Predicador' },
    desc: { PT: 'Quem prega, ensina e lidera espiritualmente.', EN: 'Someone who preaches, teaches and leads spiritually.', ES: 'Quien predica, enseña y lidera espiritualmente.' },
  },
  {
    value: 'church',
    icon: Church,
    label: { PT: 'Igreja / Ministério', EN: 'Church / Ministry', ES: 'Iglesia / Ministerio' },
    desc: { PT: 'Conta oficial da instituição (linguagem em 3ª pessoa).', EN: 'Official institution account (3rd person language).', ES: 'Cuenta oficial de la institución (lenguaje en 3ª persona).' },
  },
];

/* ─── Options per branch ─── */
const PERSONAL_FOCUS: Record<L, { value: string; label: string }[]> = {
  PT: [
    { value: 'lifestyle', label: 'Lifestyle cristão moderno' },
    { value: 'reflexoes', label: 'Reflexões de rotina e dia a dia' },
    { value: 'familia', label: 'Família, casamento e relacionamentos' },
    { value: 'encorajamento', label: 'Encorajamento e superação diária' },
    { value: 'evangelismo', label: 'Evangelismo e mensagens de salvação' },
  ],
  EN: [
    { value: 'lifestyle', label: 'Modern Christian lifestyle' },
    { value: 'reflexoes', label: 'Daily reflections and routines' },
    { value: 'familia', label: 'Family, marriage, and relationships' },
    { value: 'encorajamento', label: 'Encouragement and daily overcoming' },
    { value: 'evangelismo', label: 'Evangelism and salvation messages' },
  ],
  ES: [
    { value: 'lifestyle', label: 'Estilo de vida cristiano moderno' },
    { value: 'reflexoes', label: 'Reflexiones de rutina y día a día' },
    { value: 'familia', label: 'Familia, matrimonio y relaciones' },
    { value: 'encorajamento', label: 'Ánimo y superación diaria' },
    { value: 'evangelismo', label: 'Evangelismo y mensajes de salvación' },
  ],
};

const PERSONAL_VIBE: Record<L, { value: string; label: string }[]> = {
  PT: [
    { value: 'amigavel', label: 'Super amigável e próxima' },
    { value: 'poetica', label: 'Poética e mais profunda' },
    { value: 'descontraida', label: 'Descontraída e engraçada' },
    { value: 'motivacional', label: 'Motivacional e energética' },
    { value: 'didatica', label: 'Didática e explicativa' },
  ],
  EN: [
    { value: 'amigavel', label: 'Super friendly and close' },
    { value: 'poetica', label: 'Poetic and deep' },
    { value: 'descontraida', label: 'Casual and fun' },
    { value: 'motivacional', label: 'Motivational and energetic' },
    { value: 'didatica', label: 'Didactic and explanatory' },
  ],
  ES: [
    { value: 'amigavel', label: 'Super amigable y cercana' },
    { value: 'poetica', label: 'Poética y profunda' },
    { value: 'descontraida', label: 'Relajada y divertida' },
    { value: 'motivacional', label: 'Motivacional y energética' },
    { value: 'didatica', label: 'Didáctica y explicativa' },
  ],
};

const PREACHING_STYLE: Record<L, { value: string; label: string }[]> = {
  PT: [
    { value: 'expositiva', label: 'Expositiva verso-a-verso' },
    { value: 'tematica', label: 'Temática / Avivamento' },
    { value: 'conselheira', label: 'Conselheiro e Vivência' },
    { value: 'teologica', label: 'Teologia Profunda / Acadêmica' },
  ],
  EN: [
    { value: 'expositiva', label: 'Expository verse-by-verse' },
    { value: 'tematica', label: 'Topical / Revival' },
    { value: 'conselheira', label: 'Counselor and Practical' },
    { value: 'teologica', label: 'Deep Theology / Academic' },
  ],
  ES: [
    { value: 'expositiva', label: 'Expositiva versículo a versículo' },
    { value: 'tematica', label: 'Temática / Avivamiento' },
    { value: 'conselheira', label: 'Consejero y Vivencia' },
    { value: 'teologica', label: 'Teología Profunda / Académica' },
  ],
};

const PREACHING_REF: Record<L, { value: string; label: string }[]> = {
  PT: [
    { value: 'spurgeon', label: 'Clássico e Fervoroso (ex: Charles Spurgeon)' },
    { value: 'hernandes', label: 'Didático/Seminário (ex: Hernandes Dias Lopes)' },
    { value: 'profetico', label: 'Profético e Encorajador' },
    { value: 'cslewis', label: 'Intelectual e Apologético (ex: C.S. Lewis)' },
    { value: 'proprio', label: 'Prefiro meu próprio estilo (sem referência)' },
  ],
  EN: [
    { value: 'spurgeon', label: 'Classic and Fervent (e.g., Charles Spurgeon)' },
    { value: 'hernandes', label: 'Didactic/Seminary (e.g., John MacArthur)' },
    { value: 'profetico', label: 'Prophetic and Encouraging' },
    { value: 'cslewis', label: 'Intellectual and Apologetic (e.g., C.S. Lewis)' },
    { value: 'proprio', label: 'I prefer my own style (no reference)' },
  ],
  ES: [
    { value: 'spurgeon', label: 'Clásico y Ferviente (ej: Charles Spurgeon)' },
    { value: 'hernandes', label: 'Didáctico/Seminario (ej: John MacArthur)' },
    { value: 'profetico', label: 'Profético y Alentador' },
    { value: 'cslewis', label: 'Intelectual y Apologético (ej: C.S. Lewis)' },
    { value: 'proprio', label: 'Prefiero mi propio estilo (sin referencia)' },
  ],
};

const AUDIENCE_PROFILE: Record<L, { value: string; label: string }[]> = {
  PT: [
    { value: 'jovens', label: 'Jovens e estudantes dinâmicos' },
    { value: 'casais', label: 'Casais e famílias' },
    { value: 'congregacional', label: 'Igreja congregacional (várias faixas etárias)' },
    { value: 'lideres', label: 'Líderes e pastores em formação' },
  ],
  EN: [
    { value: 'jovens', label: 'Dynamic youth and students' },
    { value: 'casais', label: 'Couples and families' },
    { value: 'congregacional', label: 'Church-wide (multiple age groups)' },
    { value: 'lideres', label: 'Leaders and pastors in training' },
  ],
  ES: [
    { value: 'jovens', label: 'Jóvenes y estudiantes dinámicos' },
    { value: 'casais', label: 'Parejas y familias' },
    { value: 'congregacional', label: 'Congregacional (varias edades)' },
    { value: 'lideres', label: 'Líderes y pastores en formación' },
  ],
};

const CHURCH_TONE: Record<L, { value: string; label: string }[]> = {
  PT: [
    { value: 'tradicional', label: 'Sério e Tradicional' },
    { value: 'jovem', label: 'Jovem e extremamente vibrante' },
    { value: 'acolhedor', label: 'Focado no acolhimento solidário' },
  ],
  EN: [
    { value: 'tradicional', label: 'Serious and Traditional' },
    { value: 'jovem', label: 'Young and extremely vibrant' },
    { value: 'acolhedor', label: 'Focused on welcoming and solidarity' },
  ],
  ES: [
    { value: 'tradicional', label: 'Serio y Tradicional' },
    { value: 'jovem', label: 'Joven y extremadamente vibrante' },
    { value: 'acolhedor', label: 'Enfocado en la acogida solidaria' },
  ],
};

const CHURCH_PRIORITY: Record<L, { value: string; label: string }[]> = {
  PT: [
    { value: 'engajar', label: 'Engajar membros de dentro da igreja' },
    { value: 'evangelizar', label: 'Evangelizar pessoas que nunca pisaram lá' },
    { value: 'avisos', label: 'Dar avisos operacionais e agenda' },
  ],
  EN: [
    { value: 'engajar', label: 'Engage existing church members' },
    { value: 'evangelizar', label: 'Evangelize people who have never visited' },
    { value: 'avisos', label: 'Operational notices and schedule' },
  ],
  ES: [
    { value: 'engajar', label: 'Involucrar miembros de la iglesia' },
    { value: 'evangelizar', label: 'Evangelizar personas que nunca asistieron' },
    { value: 'avisos', label: 'Avisos operativos y agenda' },
  ],
};

/* ─────────── Helpers ─────────── */
function Hint({ text }: { text: string }) {
  return (
    <p className="flex items-start gap-1.5 text-xs text-muted-foreground bg-accent/40 rounded-lg px-3 py-2 mt-1">
      <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
      {text}
    </p>
  );
}

function FieldSelect({ label, hint, options, value, onChange }: {
  label: string;
  hint?: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold">{label}</Label>
      {hint && <Hint text={hint} />}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
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
        lang === 'PT' ? 'DNA salvo! A IA já está aprendendo o seu estilo. ✨' :
        lang === 'EN' ? 'DNA saved! The AI is now learning your style. ✨' :
        '¡ADN guardado! La IA ya está aprendiendo tu estilo. ✨'
      );
    } catch (err) {
      console.error(err);
      toast.error(
        lang === 'PT' ? 'Erro ao salvar DNA.' :
        lang === 'EN' ? 'Error saving DNA.' :
        'Error al guardar ADN.'
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
                  <Icon className={`h-7 w-7 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-bold text-center ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {pt.label[lang]}
                  </span>
                  <span className="text-[11px] text-muted-foreground text-center leading-tight">
                    {pt.desc[lang]}
                  </span>
                  {active && (
                    <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">✓</span>
                  )}
                </label>
              );
            })}
          </RadioGroup>
        </div>

        {/* ─── Step 2: Branch-specific questions ─── */}
        <div className="space-y-5 border-t border-border pt-6">
          {dna.profileType === 'personal' && (
            <>
              <FieldSelect
                label={lang === 'PT' ? 'Qual o foco principal da sua mensagem?' : lang === 'EN' ? 'What is the main focus of your message?' : '¿Cuál es el enfoque principal de su mensaje?'}
                hint={lang === 'PT' ? 'Isso guia os temas que a IA sugere e o vocabulário das legendas.' : lang === 'EN' ? 'This guides the topics the AI suggests and the vocabulary of captions.' : 'Esto guía los temas que la IA sugiere y el vocabulario de las leyendas.'}
                options={PERSONAL_FOCUS[lang]}
                value={dna.personalFocus || PERSONAL_FOCUS[lang][0].value}
                onChange={(v) => patch({ personalFocus: v })}
              />
              <FieldSelect
                label={lang === 'PT' ? 'Qual é a sua "Vibe" e estilo de escrita?' : lang === 'EN' ? 'What is your writing vibe and style?' : '¿Cuál es tu "Vibe" y estilo de escritura?'}
                options={PERSONAL_VIBE[lang]}
                value={dna.personalVibe || PERSONAL_VIBE[lang][0].value}
                onChange={(v) => patch({ personalVibe: v })}
              />
            </>
          )}

          {dna.profileType === 'pastor' && (
            <>
              <FieldSelect
                label={lang === 'PT' ? 'Qual sua principal linha de pregação?' : lang === 'EN' ? 'What is your main preaching style?' : '¿Cuál es su principal línea de predicación?'}
                hint={lang === 'PT' ? 'A IA usa isso para montar a estrutura dos seus Sermões e Estudos Bíblicos.' : lang === 'EN' ? 'The AI uses this to structure your Sermons and Bible Studies.' : 'La IA usa esto para estructurar sus Sermones y Estudios Bíblicos.'}
                options={PREACHING_STYLE[lang]}
                value={dna.preachingStyle || PREACHING_STYLE[lang][0].value}
                onChange={(v) => patch({ preachingStyle: v })}
              />
              <FieldSelect
                label={lang === 'PT' ? 'Qual a sua referência de comunicação ou pregação?' : lang === 'EN' ? 'Who is your communication or preaching reference?' : '¿Cuál es su referencia de comunicación o predicación?'}
                hint={lang === 'PT' ? 'Usamos isso para calibrar o "tom de voz" da IA, sem copiar — apenas aprender a cadência.' : lang === 'EN' ? 'We use this to calibrate the AI\'s "tone of voice" without copying — just learning the cadence.' : 'Usamos esto para calibrar el "tono de voz" de la IA, sin copiar — solo aprender la cadencia.'}
                options={PREACHING_REF[lang]}
                value={dna.preachingReference || PREACHING_REF[lang][0].value}
                onChange={(v) => patch({ preachingReference: v })}
              />
              <FieldSelect
                label={lang === 'PT' ? 'Qual a característica mais forte da sua audiência?' : lang === 'EN' ? 'What\'s the strongest trait of your audience?' : '¿Cuál es la característica más fuerte de su audiencia?'}
                options={AUDIENCE_PROFILE[lang]}
                value={dna.audienceProfile || AUDIENCE_PROFILE[lang][0].value}
                onChange={(v) => patch({ audienceProfile: v })}
              />
            </>
          )}

          {dna.profileType === 'church' && (
            <>
              <FieldSelect
                label={lang === 'PT' ? 'Qual é o tom oficial do Ministério?' : lang === 'EN' ? 'What is the official tone of the Ministry?' : '¿Cuál es el tono oficial del Ministerio?'}
                hint={lang === 'PT' ? 'Vamos adaptar a linguagem para soar oficial e representar a instituição.' : lang === 'EN' ? 'We\'ll adapt the language to sound official and represent the institution.' : 'Adaptaremos el lenguaje para que suene oficial y represente la institución.'}
                options={CHURCH_TONE[lang]}
                value={dna.churchTone || CHURCH_TONE[lang][0].value}
                onChange={(v) => patch({ churchTone: v })}
              />
              <FieldSelect
                label={lang === 'PT' ? 'A prioridade dos posts que saem daqui focam mais em:' : lang === 'EN' ? 'The priority of posts from here focuses on:' : 'La prioridad de los posts de aquí se enfoca en:'}
                options={CHURCH_PRIORITY[lang]}
                value={dna.churchPriority || CHURCH_PRIORITY[lang][0].value}
                onChange={(v) => patch({ churchPriority: v })}
              />
            </>
          )}

          {/* Free-form notes */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">
              {lang === 'PT' ? 'Observações adicionais (opcional)' : lang === 'EN' ? 'Additional notes (optional)' : 'Observaciones adicionales (opcional)'}
            </Label>
            <Textarea
              value={dna.freeNotes || ''}
              onChange={(e) => patch({ freeNotes: e.target.value })}
              placeholder={
                lang === 'PT'
                  ? 'Ex: "Eu nunca uso gírias no púlpito", "Sempre citar versículos na NVT", "Minha igreja é pentecostal assembleiana"...'
                  : lang === 'EN'
                  ? 'E.g., "I never use slang in the pulpit", "Always quote ESV", "My church is Pentecostal"...'
                  : 'Ej: "Nunca uso jerga en el púlpito", "Siempre citar versículos en RVR60"...'
              }
              rows={3}
              className="resize-none"
            />
            <p className="text-[11px] text-muted-foreground">
              {lang === 'PT' ? 'Regras extras que a IA sempre obedecerá.' : lang === 'EN' ? 'Extra rules the AI will always follow.' : 'Reglas adicionales que la IA siempre obedecerá.'}
            </p>
          </div>
        </div>

        {/* Save */}
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto bg-primary text-primary-foreground gap-2">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> {lang === 'PT' ? 'Salvando...' : lang === 'EN' ? 'Saving...' : 'Guardando...'}</> : <><Sparkles className="h-4 w-4" /> {lang === 'PT' ? 'Salvar meu DNA' : lang === 'EN' ? 'Save my DNA' : 'Guardar mi ADN'}</>}
        </Button>
      </CardContent>
    </Card>
  );
}
