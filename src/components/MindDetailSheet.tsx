import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import type { MindFullData } from '@/data/minds';
import {
  Database, Fingerprint, Zap, Sparkles, Shield, BookOpen,
  PenTool, Users, GraduationCap, BookMarked, ChevronRight, Cpu, ScrollText
} from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  bio: { PT: 'Biografia & Perfil Psicológico da IA', EN: 'AI Biography & Psychological Profile', ES: 'Biografía & Perfil Psicológico de la IA' },
  bioSub: { PT: 'Como esta IA pensa, fala e raciocina', EN: 'How this AI thinks, speaks and reasons', ES: 'Cómo esta IA piensa, habla y razona' },
  specialties: { PT: 'Especialidades do Agente', EN: 'Agent Specialties', ES: 'Especialidades del Agente' },
  signatures: { PT: 'Assinaturas Homiléticas', EN: 'Homiletic Signatures', ES: 'Firmas Homiléticas' },
  theology: { PT: 'Matriz Teológica Programada', EN: 'Programmed Theological Matrix', ES: 'Matriz Teológica Programada' },
  theologySub: { PT: 'O framework doutrinário que governa cada resposta da IA', EN: 'The doctrinal framework governing every AI response', ES: 'El marco doctrinal que gobierna cada respuesta de la IA' },
  works: { PT: 'Acervo de Referência Carregado na IA', EN: 'Reference Library Loaded into the AI', ES: 'Acervo de Referencia Cargado en la IA' },
  worksSub: { PT: 'Livros, sermões e transcrições usados para treinar esta mente', EN: 'Books, sermons and transcripts used to train this mind', ES: 'Libros, sermones y transcripciones usados para entrenar esta mente' },
  engage: { PT: 'O que você quer fazer com esta Mente?', EN: 'What do you want to do with this Mind?', ES: '¿Qué quieres hacer con esta Mente?' },
  mentorOnline: { PT: 'Mentor Online', EN: 'Mentor Online', ES: 'Mentor en Línea' },
};

interface Modality {
  id: string;
  icon: React.ElementType;
  emoji: string;
  label: Record<L, string>;
  description: Record<L, string>;
  color: string;
}

const modalities: Modality[] = [
  {
    id: 'devocional', icon: BookOpen, emoji: '📖',
    color: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100',
    label: { PT: 'Devocional Diário', EN: 'Daily Devotional', ES: 'Devocional Diario' },
    description: { PT: 'Encorajamento matinal com a voz e o tom pastoral desta mente histórica', EN: 'Morning encouragement with this historical mind\'s pastoral voice', ES: 'Aliento matutino con la voz y el tono pastoral de esta mente histórica' },
  },
  {
    id: 'sermao', icon: PenTool, emoji: '📝',
    color: 'bg-blue-50 border-blue-200 hover:border-blue-400 hover:bg-blue-100',
    label: { PT: 'Preparação de Sermão', EN: 'Sermon Preparation', ES: 'Preparación de Sermón' },
    description: { PT: 'Ajuda para montar um esboço expositivo com a estrutura homilética deste pregador', EN: 'Help building an expository outline using this preacher\'s homiletic structure', ES: 'Ayuda para armar un esquema expositivo con la estructura homilética' },
  },
  {
    id: 'aconselhamento', icon: Users, emoji: '🗣️',
    color: 'bg-amber-50 border-amber-200 hover:border-amber-400 hover:bg-amber-100',
    label: { PT: 'Aconselhamento Pastoral', EN: 'Pastoral Counseling', ES: 'Consejería Pastoral' },
    description: { PT: 'Buscando sabedoria e cura para crises com a perspectiva teológica deste mentor', EN: 'Seeking wisdom and healing for crises from this mentor\'s theological perspective', ES: 'Buscando sabiduría y sanación para crisis con la perspectiva teológica' },
  },
  {
    id: 'estudo', icon: GraduationCap, emoji: '📚',
    color: 'bg-purple-50 border-purple-200 hover:border-purple-400 hover:bg-purple-100',
    label: { PT: 'Estudo Teológico', EN: 'Theological Study', ES: 'Estudio Teológico' },
    description: { PT: 'Deep dive em doutrinas e conceitos profundos guiado por esta mente brilhante', EN: 'Deep dive into doctrines guided by this brilliant mind', ES: 'Inmersión profunda en doctrinas guiados por esta mente brillante' },
  },
];

interface MindDetailSheetProps {
  mind: MindFullData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MindDetailSheet({ mind, open, onOpenChange }: MindDetailSheetProps) {
  const navigate = useNavigate();
  const { lang } = useLanguage();

  if (!mind) return null;

  const handleModality = (modalityId: string) => {
    onOpenChange(false);
    navigate(`/dashboard/mentes/chat?mente=${mind.id}&modalidade=${modalityId}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 bg-[hsl(40,30%,98%)] border-l border-[hsl(30,15%,88%)] overflow-y-auto">
        <div className="px-6 sm:px-10 py-8 space-y-8">

          {/* ── A. HERO ── */}
          <section className="text-center pt-4">
            <div className="relative mx-auto w-32 h-32 sm:w-40 sm:h-40 mb-5">
              <div className="w-full h-full rounded-full border-[3px] border-[hsl(35,30%,80%)] overflow-hidden shadow-lg">
                <img src={mind.image} alt={mind.name} className="w-full h-full object-cover" width={160} height={160} />
              </div>
              <span className="absolute -bottom-1 -right-1 text-2xl drop-shadow">{mind.flag}</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[hsl(220,15%,15%)] tracking-tight">{mind.name}</h2>
            <p className="text-base italic text-[hsl(35,40%,45%)] mt-1 font-display">{mind.subtitle[lang]}</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs text-emerald-600 font-semibold tracking-wide uppercase">{labels.mentorOnline[lang]}</span>
            </div>
            {/* Data badges */}
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {mind.badges.map((badge, i) => (
                <Badge key={i} variant="outline" className="text-[11px] border-[hsl(35,25%,82%)] text-[hsl(220,10%,45%)] bg-white px-3 py-1 gap-1.5 font-mono">
                  <Database className="h-3 w-3 text-[hsl(35,40%,55%)]" />
                  {badge[lang]}
                </Badge>
              ))}
            </div>
          </section>

          {/* Divider */}
          <hr className="border-[hsl(30,15%,88%)]" />

          {/* ── B. BIOGRAPHY ── */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[hsl(35,35%,92%)] flex items-center justify-center border border-[hsl(35,25%,85%)]">
                <Fingerprint className="h-4.5 w-4.5 text-[hsl(35,45%,45%)]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[hsl(220,15%,20%)]">{labels.bio[lang]}</h3>
                <p className="text-[11px] text-[hsl(220,10%,55%)]">{labels.bioSub[lang]}</p>
              </div>
            </div>
            <p className="text-[14px] leading-[1.85] text-[hsl(220,10%,35%)] pl-0 sm:pl-12">{mind.bio[lang]}</p>
          </section>

          {/* ── C. SPECIALTIES & SIGNATURES ── */}
          <div className="grid grid-cols-1 gap-5">
            {/* Specialties */}
            <section className="rounded-xl border border-[hsl(30,15%,88%)] bg-white p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[hsl(35,35%,92%)] flex items-center justify-center border border-[hsl(35,25%,85%)]">
                  <Cpu className="h-4 w-4 text-[hsl(35,45%,45%)]" />
                </div>
                <h3 className="text-base font-bold text-[hsl(220,15%,20%)]">{labels.specialties[lang]}</h3>
              </div>
              <div className="space-y-2">
                {mind.specialties.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[hsl(40,30%,97%)] border border-[hsl(30,15%,92%)]">
                    <Zap className="h-3.5 w-3.5 text-[hsl(35,50%,50%)] shrink-0" />
                    <span className="text-sm text-[hsl(220,10%,30%)]">{s[lang]}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Signatures */}
            <section className="rounded-xl border border-[hsl(30,15%,88%)] bg-white p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[hsl(35,35%,92%)] flex items-center justify-center border border-[hsl(35,25%,85%)]">
                  <ScrollText className="h-4 w-4 text-[hsl(35,45%,45%)]" />
                </div>
                <h3 className="text-base font-bold text-[hsl(220,15%,20%)]">{labels.signatures[lang]}</h3>
              </div>
              <div className="space-y-2">
                {mind.signatures.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[hsl(40,30%,97%)] border border-[hsl(30,15%,92%)]">
                    <Sparkles className="h-3.5 w-3.5 text-[hsl(35,50%,50%)] shrink-0" />
                    <span className="text-sm text-[hsl(220,10%,35%)] italic">{s[lang]}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ── THEOLOGY MATRIX ── */}
          <section className="rounded-xl border border-[hsl(30,15%,88%)] bg-[hsl(35,30%,96%)] p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[hsl(35,35%,90%)] flex items-center justify-center border border-[hsl(35,25%,82%)]">
                <Shield className="h-4 w-4 text-[hsl(35,45%,45%)]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[hsl(220,15%,20%)]">{labels.theology[lang]}</h3>
                <p className="text-[11px] text-[hsl(220,10%,55%)]">{labels.theologySub[lang]}</p>
              </div>
            </div>
            <p className="text-[14px] leading-[1.85] text-[hsl(220,10%,35%)] pl-0 sm:pl-11">{mind.theologyMatrix[lang]}</p>
          </section>

          {/* ── D. REFERENCE WORKS ── */}
          <section className="rounded-xl border border-[hsl(30,15%,88%)] bg-white p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[hsl(35,35%,92%)] flex items-center justify-center border border-[hsl(35,25%,85%)]">
                <BookMarked className="h-4 w-4 text-[hsl(35,45%,45%)]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[hsl(220,15%,20%)]">{labels.works[lang]}</h3>
                <p className="text-[11px] text-[hsl(220,10%,55%)]">{labels.worksSub[lang]}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {mind.works.map((work, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-lg bg-[hsl(40,30%,97%)] border border-[hsl(30,15%,92%)] hover:border-[hsl(35,30%,80%)] transition-colors">
                  <BookOpen className="h-4 w-4 text-[hsl(35,50%,50%)] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[hsl(220,10%,25%)] truncate">{work.title[lang]}</p>
                    {work.year && <p className="text-[11px] text-[hsl(220,10%,55%)] font-mono">{work.year}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Divider */}
          <hr className="border-[hsl(30,15%,88%)]" />

          {/* ── E. ENGAGEMENT MODULE ── */}
          <section className="pb-4">
            <h3 className="text-xl font-bold text-[hsl(220,15%,15%)] mb-2 text-center">{labels.engage[lang]}</h3>
            <p className="text-sm text-[hsl(220,10%,50%)] text-center mb-6">
              {lang === 'EN' ? 'Choose a modality below to start the conversation:' : lang === 'ES' ? 'Elige una modalidad abajo para iniciar la conversación:' : 'Escolha uma modalidade abaixo para iniciar a conversa:'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {modalities.map(mod => (
                <button
                  key={mod.id}
                  onClick={() => handleModality(mod.id)}
                  className={`group/mod text-left rounded-xl border p-5 transition-all duration-300 ${mod.color}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{mod.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[hsl(220,15%,20%)] flex items-center gap-2">
                        {mod.label[lang]}
                        <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover/mod:opacity-100 transition-opacity" />
                      </p>
                      <p className="text-[12px] text-[hsl(220,10%,45%)] mt-1 leading-relaxed">{mod.description[lang]}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

        </div>
      </SheetContent>
    </Sheet>
  );
}
