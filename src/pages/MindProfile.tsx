import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { minds } from '@/data/minds';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Zap, Brain, BookOpen, PenTool, Users, GraduationCap,
  Lock, Crown, MessageSquare, Library, Fingerprint, ScrollText, Sparkles,
  Shield, ChevronRight, Database, Cpu, BookMarked
} from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

const sectionLabels = {
  bio: { PT: 'Biografia & Perfil Psicológico da IA', EN: 'AI Biography & Psychological Profile', ES: 'Biografía & Perfil Psicológico de la IA' },
  specialties: { PT: 'Especialidades do Agente', EN: 'Agent Specialties', ES: 'Especialidades del Agente' },
  signatures: { PT: 'Assinaturas Homiléticas', EN: 'Homiletic Signatures', ES: 'Firmas Homiléticas' },
  theology: { PT: 'Matriz Teológica Programada', EN: 'Programmed Theological Matrix', ES: 'Matriz Teológica Programada' },
  works: { PT: 'Acervo de Referência Carregado na IA', EN: 'Reference Library Loaded into the AI', ES: 'Acervo de Referencia Cargado en la IA' },
  engage: { PT: 'Iniciar Sessão com esta Mente', EN: 'Start a Session with this Mind', ES: 'Iniciar Sesión con esta Mente' },
  unlock: { PT: 'Desbloqueie a Sabedoria Histórica', EN: 'Unlock Historical Wisdom', ES: 'Desbloquea la Sabiduría Histórica' },
  upgradePrice: { PT: 'Faça o upgrade por $100/mês para acessar todas as Mentes Brilhantes', EN: 'Upgrade for $100/month to access all Brilliant Minds', ES: 'Mejora por $100/mes para acceder a todas las Mentes Brillantes' },
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
    id: 'devocional', icon: BookOpen, emoji: '📖', color: 'from-emerald-500/20 to-emerald-600/5',
    label: { PT: 'Devocional Diário', EN: 'Daily Devotional', ES: 'Devocional Diario' },
    description: { PT: 'Encorajamento matinal com a voz e o tom pastoral desta mente histórica', EN: 'Morning encouragement with this historical mind\'s pastoral voice and tone', ES: 'Aliento matutino con la voz y el tono pastoral de esta mente histórica' },
  },
  {
    id: 'sermao', icon: PenTool, emoji: '📝', color: 'from-blue-500/20 to-blue-600/5',
    label: { PT: 'Preparação de Sermão', EN: 'Sermon Preparation', ES: 'Preparación de Sermón' },
    description: { PT: 'Ajuda para montar um esboço expositivo com a estrutura homilética deste pregador', EN: 'Help building an expository outline using this preacher\'s homiletic structure', ES: 'Ayuda para armar un esquema expositivo con la estructura homilética de este predicador' },
  },
  {
    id: 'aconselhamento', icon: Users, emoji: '🗣️', color: 'from-amber-500/20 to-amber-600/5',
    label: { PT: 'Aconselhamento Pastoral', EN: 'Pastoral Counseling', ES: 'Consejería Pastoral' },
    description: { PT: 'Buscando sabedoria e cura para crises com a perspectiva teológica deste mentor', EN: 'Seeking wisdom and healing for crises from this mentor\'s theological perspective', ES: 'Buscando sabiduría y sanación para crisis con la perspectiva teológica de este mentor' },
  },
  {
    id: 'estudo', icon: GraduationCap, emoji: '📚', color: 'from-purple-500/20 to-purple-600/5',
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

  const isFree = profile?.plan === 'free';
  const isLocked = mind.locked && isFree;

  const handleModality = (modalityId: string) => {
    if (isLocked) {
      navigate('/upgrade');
    } else {
      navigate(`/dashboard/mentes/chat?mente=${mind.id}&modalidade=${modalityId}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/mentes')} className="mb-6 text-muted-foreground hover:text-foreground gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" />
        {sectionLabels.backLabel[lang]}
      </Button>

      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION — Cinematic header
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative rounded-3xl border border-[hsl(43,55%,58%)]/20 bg-gradient-to-b from-[hsl(215,50%,8%)] via-[hsl(210,40%,6%)] to-[hsl(215,45%,5%)] p-8 sm:p-14 text-center overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-[-80px] left-1/4 w-[500px] h-[500px] bg-[hsl(43,55%,58%)]/[0.04] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-60px] right-1/3 w-[400px] h-[400px] bg-[hsl(43,55%,58%)]/[0.03] rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(43,55%,58%)]/20 to-transparent" />

        <div className="relative z-10">
          {/* Photo */}
          <div className="mx-auto w-36 h-36 sm:w-44 sm:h-44 rounded-full border-[3px] border-[hsl(43,55%,58%)]/40 overflow-hidden shadow-[0_0_80px_hsl(43,55%,58%,0.12),0_0_30px_hsl(43,55%,58%,0.08)] mb-6 ring-4 ring-[hsl(43,55%,58%)]/[0.06] ring-offset-4 ring-offset-[hsl(215,50%,8%)]">
            <img src={mind.image} alt={mind.name} className="w-full h-full object-cover" width={176} height={176} />
          </div>

          {/* Name & subtitle */}
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">{mind.name}</h1>
          <p className="text-lg sm:text-xl italic text-[hsl(43,55%,58%)]/80 mt-2 font-display">{mind.subtitle[lang]}</p>

          {/* Online indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <span className="text-xs text-emerald-400 font-semibold tracking-wide uppercase">{sectionLabels.mentorOnline[lang]}</span>
          </div>

          {/* Data weight badges */}
          <div className="flex flex-wrap justify-center gap-2.5 mt-7">
            {mind.badges.map((badge, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full border border-[hsl(43,55%,58%)]/15 bg-[hsl(43,55%,58%)]/[0.06] backdrop-blur-sm">
                <Database className="h-3.5 w-3.5 text-[hsl(43,55%,58%)]/70" />
                <span className="text-xs font-medium text-[hsl(43,55%,58%)]/90">{badge[lang]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          BIOGRAPHY — Long-form AI personality description
          ═══════════════════════════════════════════════════════════════ */}
      <section className="mt-6 rounded-2xl border border-border/40 bg-card p-7 sm:p-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-[hsl(43,55%,58%)]/10 flex items-center justify-center">
            <Fingerprint className="h-5 w-5 text-[hsl(43,55%,58%)]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{sectionLabels.bio[lang]}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lang === 'EN' ? 'How this AI thinks, speaks and reasons' : lang === 'ES' ? 'Cómo esta IA piensa, habla y razona' : 'Como esta IA pensa, fala e raciocina'}
            </p>
          </div>
        </div>
        <div className="pl-0 sm:pl-12">
          <p className="text-[15px] sm:text-base leading-[1.85] text-muted-foreground">
            {mind.bio[lang]}
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SPECIALTIES & SIGNATURES — Two-column grid
          ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        {/* Specialties */}
        <section className="rounded-2xl border border-border/40 bg-card p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-[hsl(43,55%,58%)]/10 flex items-center justify-center">
              <Cpu className="h-5 w-5 text-[hsl(43,55%,58%)]" />
            </div>
            <h2 className="text-lg font-bold text-foreground">{sectionLabels.specialties[lang]}</h2>
          </div>
          <div className="space-y-2.5">
            {mind.specialties.map((s, i) => (
              <div key={i} className="flex items-start gap-3.5 px-4 py-3.5 rounded-xl bg-muted/20 border border-border/20 hover:bg-muted/40 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-[hsl(43,55%,58%)]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="h-3.5 w-3.5 text-[hsl(43,55%,58%)]" />
                </div>
                <span className="text-sm text-foreground/85 font-medium">{s[lang]}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Signatures */}
        <section className="rounded-2xl border border-border/40 bg-card p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-[hsl(43,55%,58%)]/10 flex items-center justify-center">
              <ScrollText className="h-5 w-5 text-[hsl(43,55%,58%)]" />
            </div>
            <h2 className="text-lg font-bold text-foreground">{sectionLabels.signatures[lang]}</h2>
          </div>
          <div className="space-y-2.5">
            {mind.signatures.map((s, i) => (
              <div key={i} className="flex items-start gap-3.5 px-4 py-3.5 rounded-xl bg-muted/20 border border-border/20 hover:bg-muted/40 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-[hsl(43,55%,58%)]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="h-3.5 w-3.5 text-[hsl(43,55%,58%)]" />
                </div>
                <span className="text-sm text-foreground/85 italic">{s[lang]}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          THEOLOGICAL MATRIX — Dark cinematic section
          ═══════════════════════════════════════════════════════════════ */}
      <section className="mt-5 rounded-2xl border border-[hsl(43,55%,58%)]/15 bg-gradient-to-br from-[hsl(215,50%,8%)] to-[hsl(210,40%,5%)] p-7 sm:p-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[hsl(43,55%,58%)]/[0.03] rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-[hsl(43,55%,58%)]/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-[hsl(43,55%,58%)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{sectionLabels.theology[lang]}</h2>
              <p className="text-xs text-white/40 mt-0.5">
                {lang === 'EN' ? 'The doctrinal framework governing every AI response' : lang === 'ES' ? 'El marco doctrinal que gobierna cada respuesta de la IA' : 'O framework doutrinário que governa cada resposta da IA'}
              </p>
            </div>
          </div>
          <div className="pl-0 sm:pl-12">
            <p className="text-[15px] leading-[1.85] text-white/65">
              {mind.theologyMatrix[lang]}
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          REFERENCE WORKS — Books loaded into the AI
          ═══════════════════════════════════════════════════════════════ */}
      <section className="mt-5 rounded-2xl border border-border/40 bg-card p-7 sm:p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-[hsl(43,55%,58%)]/10 flex items-center justify-center">
            <BookMarked className="h-5 w-5 text-[hsl(43,55%,58%)]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{sectionLabels.works[lang]}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lang === 'EN' ? 'Books, sermons and transcripts used to train this mind' : lang === 'ES' ? 'Libros, sermones y transcripciones usados para entrenar esta mente' : 'Livros, sermões e transcrições usados para treinar esta mente'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {mind.works.map((work, i) => (
            <div key={i} className="group flex items-center gap-4 px-5 py-4 rounded-xl bg-muted/20 border border-border/20 hover:bg-muted/40 hover:border-[hsl(43,55%,58%)]/20 transition-all">
              <div className="w-10 h-10 rounded-lg bg-[hsl(43,55%,58%)]/10 flex items-center justify-center shrink-0 group-hover:bg-[hsl(43,55%,58%)]/15 transition-colors">
                <BookOpen className="h-4.5 w-4.5 text-[hsl(43,55%,58%)]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground/90 truncate">{work.title[lang]}</p>
                {work.year && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{work.year}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ENGAGEMENT MODULE — Start a session
          ═══════════════════════════════════════════════════════════════ */}
      <section className="mt-5 rounded-3xl border border-[hsl(43,55%,58%)]/25 bg-gradient-to-b from-[hsl(215,50%,8%)] via-[hsl(210,40%,6%)] to-[hsl(215,45%,4%)] p-8 sm:p-10 overflow-hidden relative">
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[hsl(43,55%,58%)]/[0.03] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(43,55%,58%)]/25 to-transparent" />

        {isLocked ? (
          <div className="relative z-10 text-center space-y-5 py-8">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-[hsl(43,55%,58%)]/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-[hsl(43,55%,58%)]/60" />
            </div>
            <h2 className="font-display text-3xl font-bold text-[hsl(43,55%,58%)]">{sectionLabels.unlock[lang]}</h2>
            <p className="text-sm text-white/50 max-w-md mx-auto">{sectionLabels.upgradePrice[lang]}</p>
            <Button
              onClick={() => navigate('/upgrade')}
              className="px-10 py-6 text-base font-bold bg-gradient-to-r from-[hsl(43,55%,58%)] to-[hsl(35,55%,50%)] hover:from-[hsl(43,55%,65%)] hover:to-[hsl(35,55%,57%)] text-[hsl(210,40%,6%)] gap-2 rounded-xl shadow-[0_0_40px_hsl(43,55%,58%,0.2)]"
            >
              <Crown className="h-5 w-5" />
              {sectionLabels.upgradeBtn[lang]}
            </Button>
          </div>
        ) : (
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-[hsl(43,55%,58%)]/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-[hsl(43,55%,58%)]" />
              </div>
              <h2 className="text-xl font-bold text-white">{sectionLabels.engage[lang]}</h2>
            </div>
            <p className="text-sm text-white/40 mb-7 pl-12">{sectionLabels.chooseMode[lang]}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {modalities.map((mod) => {
                const Icon = mod.icon;
                return (
                  <button
                    key={mod.id}
                    onClick={() => handleModality(mod.id)}
                    className="group flex items-start gap-4 p-6 rounded-2xl border border-[hsl(43,55%,58%)]/10 bg-gradient-to-br from-white/[0.03] to-transparent hover:border-[hsl(43,55%,58%)]/30 hover:bg-white/[0.06] transition-all duration-300 text-left"
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mod.color} flex items-center justify-center shrink-0 text-2xl group-hover:scale-105 transition-transform`}>
                      {mod.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-bold text-white">{mod.label[lang]}</p>
                        <ChevronRight className="h-4 w-4 text-[hsl(43,55%,58%)]/40 group-hover:text-[hsl(43,55%,58%)]/80 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-[13px] text-white/45 mt-1.5 leading-relaxed">{mod.description[lang]}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
