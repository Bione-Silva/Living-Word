import { useParams, useNavigate } from 'react-router-dom';
import { hasAccess, type PlanSlug } from '@/lib/plans';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { minds } from '@/data/minds';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Zap, Brain, BookOpen, PenTool, Users, GraduationCap,
  Lock, Crown, Fingerprint, ScrollText, Sparkles,
  Shield, ChevronRight, Database, Cpu, BookMarked
} from 'lucide-react';
import { TheologyDNAChart } from '@/components/minds/TheologyDNAChart';

type L = 'PT' | 'EN' | 'ES';

const sectionLabels = {
  bio: { PT: 'Biografia & Perfil Psicológico da IA', EN: 'AI Biography & Psychological Profile', ES: 'Biografía & Perfil Psicológico de la IA' },
  bioSub: { PT: 'Como esta IA pensa, fala e raciocina', EN: 'How this AI thinks, speaks and reasons', ES: 'Cómo esta IA piensa, habla y razona' },
  specialties: { PT: 'Especialidades do Agente', EN: 'Agent Specialties', ES: 'Especialidades del Agente' },
  signatures: { PT: 'Assinaturas Homiléticas', EN: 'Homiletic Signatures', ES: 'Firmas Homiléticas' },
  theology: { PT: 'Matriz Teológica Programada', EN: 'Programmed Theological Matrix', ES: 'Matriz Teológica Programada' },
  theologySub: { PT: 'O framework doutrinário que governa cada resposta da IA', EN: 'The doctrinal framework governing every AI response', ES: 'El marco doctrinal que gobierna cada respuesta de la IA' },
  works: { PT: 'Acervo de Referência Carregado na IA', EN: 'Reference Library Loaded into the AI', ES: 'Acervo de Referencia Cargado en la IA' },
  worksSub: { PT: 'Livros, sermões e transcrições usados para treinar esta mente', EN: 'Books, sermons and transcripts used to train this mind', ES: 'Libros, sermones y transcripciones usados para entrenar esta mente' },
  engage: { PT: 'Iniciar Sessão com esta Mente', EN: 'Start a Session with this Mind', ES: 'Iniciar Sesión con esta Mente' },
  unlock: { PT: 'Desbloqueie a Sabedoria Histórica', EN: 'Unlock Historical Wisdom', ES: 'Desbloquea la Sabiduría Histórica' },
  upgradePrice: { PT: 'Faça o upgrade por $100/mês para acessar todas as Mentes Brilhantes com Matriz de IA Profunda.', EN: 'Upgrade for $100/month to access all Brilliant Minds with Deep AI Matrix.', ES: 'Mejora por $100/mes para acceder a todas las Mentes Brillantes con Matriz de IA Profunda.' },
  upgradeBtn: { PT: 'Fazer Upgrade Agora', EN: 'Upgrade Now', ES: 'Mejorar Ahora' },
  backLabel: { PT: 'Voltar às Mentes', EN: 'Back to Minds', ES: 'Volver a Mentes' },
  mentorOnline: { PT: 'Mentor Online', EN: 'Mentor Online', ES: 'Mentor en Línea' },
  chooseMode: { PT: 'Escolha uma modalidade abaixo para iniciar a conversa:', EN: 'Choose a modality below to start the conversation:', ES: 'Elige una modalidad abajo para iniciar la conversación:' },
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
    description: { PT: 'Encorajamento matinal com a voz e o tom pastoral desta mente histórica', EN: 'Morning encouragement with this historical mind\'s pastoral voice and tone', ES: 'Aliento matutino con la voz y el tono pastoral de esta mente histórica' },
  },
  {
    id: 'sermao', icon: PenTool, emoji: '📝',
    color: 'bg-blue-50 border-blue-200 hover:border-blue-400 hover:bg-blue-100',
    label: { PT: 'Preparação de Sermão', EN: 'Sermon Preparation', ES: 'Preparación de Sermón' },
    description: { PT: 'Ajuda para montar um esboço expositivo com a estrutura homilética deste pregador', EN: 'Help building an expository outline using this preacher\'s homiletic structure', ES: 'Ayuda para armar un esquema expositivo con la estructura homilética de este predicador' },
  },
  {
    id: 'aconselhamento', icon: Users, emoji: '🗣️',
    color: 'bg-amber-50 border-amber-200 hover:border-amber-400 hover:bg-amber-100',
    label: { PT: 'Aconselhamento Pastoral', EN: 'Pastoral Counseling', ES: 'Consejería Pastoral' },
    description: { PT: 'Buscando sabedoria e cura para crises com a perspectiva teológica deste mentor', EN: 'Seeking wisdom and healing for crises from this mentor\'s theological perspective', ES: 'Buscando sabiduría y sanación para crisis con la perspectiva teológica de este mentor' },
  },
  {
    id: 'estudo', icon: GraduationCap, emoji: '📚',
    color: 'bg-purple-50 border-purple-200 hover:border-purple-400 hover:bg-purple-100',
    label: { PT: 'Estudo Teológico', EN: 'Theological Study', ES: 'Estudio Teológico' },
    description: { PT: 'Deep dive em doutrinas e conceitos profundos guiado por esta mente brilhante', EN: 'Deep dive into doctrines and deep concepts guided by this brilliant mind', ES: 'Inmersión profunda en doctrinas y conceptos guiados por esta mente brillante' },
  },
];

export default function MindProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { lang } = useLanguage();

  const mind = minds.find(m => m.id === id);
  if (!mind) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Mind not found.</p>
      </div>
    );
  }

  const isFree = !hasAccess((profile?.plan as PlanSlug) || 'free', 'mentes_brilhantes');
  const isLocked = mind.locked && isFree;

  const handleModality = (modalityId: string) => {
    if (isLocked) {
      navigate('/upgrade');
    } else {
      navigate(`/dashboard/mentes/chat?mente=${mind.id}&modalidade=${modalityId}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-16">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/mentes')} className="mb-6 text-muted-foreground hover:text-foreground gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" />
        {sectionLabels.backLabel[lang]}
      </Button>

      {/* ── A. HERO ── */}
      <section className="relative rounded-2xl border border-[hsl(270,43%,92%)] bg-white p-8 sm:p-14 text-center overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(270,35%,78%)] to-transparent" />

        <div className="relative z-10">
          <div className="mx-auto w-36 h-36 sm:w-44 sm:h-44 rounded-full border-[3px] border-[hsl(270,43%,92%)] overflow-hidden shadow-lg mb-6">
            <img src={mind.image} alt={mind.name} className="w-full h-full object-cover" width={176} height={176} />
          </div>
          <span className="text-3xl">{mind.flag}</span>

          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[hsl(220,15%,15%)] tracking-tight mt-3">{mind.name}</h1>
          <p className="text-lg sm:text-xl italic text-[hsl(257,61%,32%)] mt-2 font-display">{mind.subtitle[lang]}</p>

          {/* Online indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs text-emerald-600 font-semibold tracking-wide uppercase">{sectionLabels.mentorOnline[lang]}</span>
          </div>

          {/* Data badges */}
          <div className="flex flex-wrap justify-center gap-2.5 mt-7">
            {mind.badges.map((badge, i) => (
              <Badge key={i} variant="outline" className="text-[11px] border-[hsl(270,43%,92%)] text-[hsl(220,10%,45%)] bg-white px-3 py-1 gap-1.5 font-mono">
                <Database className="h-3 w-3 text-[hsl(263,70%,50%)]" />
                {badge[lang]}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* ── B. BIOGRAPHY ── */}
      <section className="mt-5 rounded-2xl border border-[hsl(270,43%,92%)] bg-white p-7 sm:p-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[hsl(252,100%,99%)] flex items-center justify-center border border-[hsl(270,43%,92%)]">
            <Fingerprint className="h-5 w-5 text-[hsl(257,61%,32%)]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[hsl(220,15%,20%)]">{sectionLabels.bio[lang]}</h2>
            <p className="text-xs text-[hsl(220,10%,55%)]">{sectionLabels.bioSub[lang]}</p>
          </div>
        </div>
        <p className="text-[15px] leading-[1.85] text-[hsl(220,10%,35%)] pl-0 sm:pl-[52px]">{mind.bio[lang]}</p>
      </section>

      {/* ── C. SPECIALTIES & SIGNATURES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        <section className="rounded-2xl border border-[hsl(270,43%,92%)] bg-white p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[hsl(252,100%,99%)] flex items-center justify-center border border-[hsl(270,43%,92%)]">
              <Cpu className="h-5 w-5 text-[hsl(257,61%,32%)]" />
            </div>
            <h2 className="text-lg font-bold text-[hsl(220,15%,20%)]">{sectionLabels.specialties[lang]}</h2>
          </div>
          <div className="space-y-2.5">
            {mind.specialties.map((s, i) => (
              <div key={i} className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-[hsl(252,100%,99%)] border border-[hsl(252,100%,99%)]">
                <Zap className="h-3.5 w-3.5 text-[hsl(263,70%,50%)] shrink-0" />
                <span className="text-sm text-[hsl(220,10%,30%)] font-medium">{s[lang]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[hsl(270,43%,92%)] bg-white p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[hsl(252,100%,99%)] flex items-center justify-center border border-[hsl(270,43%,92%)]">
              <ScrollText className="h-5 w-5 text-[hsl(257,61%,32%)]" />
            </div>
            <h2 className="text-lg font-bold text-[hsl(220,15%,20%)]">{sectionLabels.signatures[lang]}</h2>
          </div>
          <div className="space-y-2.5">
            {mind.signatures.map((s, i) => (
              <div key={i} className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-[hsl(252,100%,99%)] border border-[hsl(252,100%,99%)]">
                <Sparkles className="h-3.5 w-3.5 text-[hsl(263,70%,50%)] shrink-0" />
                <span className="text-sm text-[hsl(220,10%,35%)] italic">{s[lang]}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── DNA TEOLÓGICO ── */}
      <TheologyDNAChart data={mind.theologyDNA} lang={lang} />


      <section className="mt-5 rounded-2xl border border-[hsl(270,43%,92%)] bg-[hsl(252,100%,99%)] p-7 sm:p-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[hsl(270,43%,92%)] flex items-center justify-center border border-[hsl(270,43%,92%)]">
            <Shield className="h-5 w-5 text-[hsl(257,61%,32%)]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[hsl(220,15%,20%)]">{sectionLabels.theology[lang]}</h2>
            <p className="text-xs text-[hsl(220,10%,55%)]">{sectionLabels.theologySub[lang]}</p>
          </div>
        </div>
        <p className="text-[15px] leading-[1.85] text-[hsl(220,10%,35%)] pl-0 sm:pl-[52px]">{mind.theologyMatrix[lang]}</p>
      </section>

      {/* ── D. REFERENCE WORKS ── */}
      <section className="mt-5 rounded-2xl border border-[hsl(270,43%,92%)] bg-white p-7 sm:p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[hsl(252,100%,99%)] flex items-center justify-center border border-[hsl(270,43%,92%)]">
            <BookMarked className="h-5 w-5 text-[hsl(257,61%,32%)]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[hsl(220,15%,20%)]">{sectionLabels.works[lang]}</h2>
            <p className="text-xs text-[hsl(220,10%,55%)]">{sectionLabels.worksSub[lang]}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {mind.works.map((work, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 rounded-xl bg-[hsl(252,100%,99%)] border border-[hsl(252,100%,99%)] hover:border-[hsl(270,43%,92%)] transition-colors">
              <BookOpen className="h-4 w-4 text-[hsl(263,70%,50%)] shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[hsl(220,10%,25%)] truncate">{work.title[lang]}</p>
                {work.year && <p className="text-[11px] text-[hsl(220,10%,55%)] mt-0.5 font-mono">{work.year}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── E. ENGAGEMENT MODULE ── */}
      <section className="mt-5 rounded-2xl border border-[hsl(270,43%,92%)] bg-white p-8 sm:p-10">
        {isLocked ? (
          <div className="text-center space-y-5 py-8">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-[hsl(252,100%,99%)] flex items-center justify-center border border-[hsl(270,43%,92%)]">
              <Lock className="h-8 w-8 text-[hsl(257,61%,32%)]" />
            </div>
            <h2 className="font-display text-3xl font-bold text-[hsl(257,61%,32%)]">{sectionLabels.unlock[lang]}</h2>
            <p className="text-sm text-[hsl(220,10%,50%)] max-w-md mx-auto">{sectionLabels.upgradePrice[lang]}</p>
            <Button
              onClick={() => navigate('/upgrade')}
              className="px-10 py-6 text-base font-bold bg-gradient-to-r from-[hsl(257,61%,32%)] to-[hsl(257,61%,32%)] hover:from-[hsl(263,70%,50%)] hover:to-[hsl(257,61%,32%)] text-white gap-2 rounded-xl"
            >
              <Crown className="h-5 w-5" />
              {sectionLabels.upgradeBtn[lang]}
            </Button>
          </div>
        ) : (
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-[hsl(220,15%,15%)] mb-2 text-center">{sectionLabels.engage[lang]}</h3>
            <p className="text-sm text-[hsl(220,10%,50%)] text-center mb-6">{sectionLabels.chooseMode[lang]}</p>
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
          </div>
        )}
      </section>
    </div>
  );
}
