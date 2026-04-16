import { BookOpen, HeartHandshake, Users, Sun, GraduationCap, Sparkles, Baby, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StudyType } from '@/types/biblical-study';
import { useLanguage } from '@/contexts/LanguageContext';

type L = 'PT' | 'EN' | 'ES';

interface StudyTypeOption {
  id: StudyType;
  icon: React.ElementType;
  label: Record<L, string>;
  desc: Record<L, string>;
  comingSoon?: boolean;
}

const OPTIONS: StudyTypeOption[] = [
  {
    id: 'complete',
    icon: BookOpen,
    label: { PT: 'Completo', EN: 'Complete', ES: 'Completo' },
    desc: {
      PT: 'Contexto, exegese, teologia, aplicações e perguntas — análise profunda.',
      EN: 'Context, exegesis, theology, applications and questions — deep analysis.',
      ES: 'Contexto, exégesis, teología, aplicaciones y preguntas — análisis profundo.',
    },
  },
  {
    id: 'pastoral',
    icon: HeartHandshake,
    label: { PT: 'Pastoral', EN: 'Pastoral', ES: 'Pastoral' },
    desc: {
      PT: 'Cuidado pastoral, aplicação ministerial, aconselhamento e comunicação para a igreja.',
      EN: 'Pastoral care, ministerial application, counseling and church communication.',
      ES: 'Cuidado pastoral, aplicación ministerial, consejería y comunicación para la iglesia.',
    },
  },
  {
    id: 'cell',
    icon: Users,
    label: { PT: 'Célula / Pequeno Grupo', EN: 'Cell / Small Group', ES: 'Célula / Grupo Pequeño' },
    desc: {
      PT: 'Quebra-gelo, perguntas em grupo, dinâmica e aplicação coletiva.',
      EN: 'Icebreaker, group questions, dynamics and collective application.',
      ES: 'Rompehielo, preguntas grupales, dinámica y aplicación colectiva.',
    },
  },
  {
    id: 'devotional',
    icon: Sun,
    label: { PT: 'Devocional', EN: 'Devotional', ES: 'Devocional' },
    desc: {
      PT: 'Reflexão curta, aplicação diária, oração e leitura complementar.',
      EN: 'Short reflection, daily application, prayer and complementary reading.',
      ES: 'Reflexión breve, aplicación diaria, oración y lectura complementaria.',
    },
  },
  {
    id: 'academic',
    icon: GraduationCap,
    label: { PT: 'Acadêmico', EN: 'Academic', ES: 'Académico' },
    desc: {
      PT: 'Análise técnica com fontes, línguas originais e debate teológico.',
      EN: 'Technical analysis with sources, original languages and theological debate.',
      ES: 'Análisis técnico con fuentes, lenguas originales y debate teológico.',
    },
    comingSoon: true,
  },
  {
    id: 'youth',
    icon: Sparkles,
    label: { PT: 'Jovens', EN: 'Youth', ES: 'Jóvenes' },
    desc: {
      PT: 'Linguagem jovem, dilemas atuais e aplicações para adolescentes.',
      EN: 'Youth language, current dilemmas and applications for teenagers.',
      ES: 'Lenguaje juvenil, dilemas actuales y aplicaciones para adolescentes.',
    },
    comingSoon: true,
  },
  {
    id: 'kids',
    icon: Baby,
    label: { PT: 'Kids', EN: 'Kids', ES: 'Kids' },
    desc: {
      PT: 'História bíblica simples, atividade e oração para crianças.',
      EN: 'Simple Bible story, activity and prayer for children.',
      ES: 'Historia bíblica simple, actividad y oración para niños.',
    },
    comingSoon: true,
  },
];

const HEADINGS: Record<string, Record<L, string>> = {
  title: {
    PT: 'Que tipo de estudo você quer gerar?',
    EN: 'What kind of study do you want to generate?',
    ES: '¿Qué tipo de estudio quieres generar?',
  },
  subtitle: {
    PT: 'Escolha um modo abaixo. O formulário e a saída se adaptam à sua escolha.',
    EN: 'Pick a mode below. The form and output adapt to your choice.',
    ES: 'Elige un modo abajo. El formulario y la salida se adaptan a tu elección.',
  },
  soon: { PT: 'Em breve', EN: 'Coming soon', ES: 'Próximamente' },
};

interface StudyTypePickerProps {
  value: StudyType;
  onChange: (type: StudyType) => void;
}

export function StudyTypePicker({ value, onChange }: StudyTypePickerProps) {
  const { lang } = useLanguage();
  const l = (lang || 'PT') as L;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div>
        <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
          {HEADINGS.title[l]}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">{HEADINGS.subtitle[l]}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = value === opt.id;
          const disabled = !!opt.comingSoon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => !disabled && onChange(opt.id)}
              disabled={disabled}
              aria-pressed={active}
              className={cn(
                'group relative text-left rounded-lg border p-3 transition-all min-h-[96px] flex flex-col gap-1.5',
                active
                  ? 'border-primary bg-primary/8 ring-1 ring-primary/40 shadow-sm'
                  : 'border-border bg-background hover:border-primary/40 hover:bg-muted/40',
                disabled && 'opacity-55 cursor-not-allowed hover:border-border hover:bg-background',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div
                  className={cn(
                    'h-7 w-7 rounded-md flex items-center justify-center shrink-0 transition-colors',
                    active ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {disabled && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/70 px-1.5 py-0.5 rounded">
                    <Lock className="h-2.5 w-2.5" />
                    {HEADINGS.soon[l]}
                  </span>
                )}
              </div>
              <div className="text-xs font-semibold text-foreground leading-tight">
                {opt.label[l]}
              </div>
              <div className="text-[10.5px] text-muted-foreground leading-snug line-clamp-3">
                {opt.desc[l]}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const STUDY_TYPE_OPTIONS = OPTIONS;
