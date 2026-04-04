import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { minds } from '@/data/minds';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Zap, Brain, BookOpen, PenTool, Users, GraduationCap,
  Lock, Crown, MessageSquare, Library, Fingerprint, ScrollText, Sparkles
} from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

const sectionLabels = {
  bio: { PT: 'Biografia & Perfil Psicológico da IA', EN: 'AI Biography & Psychological Profile', ES: 'Biografía & Perfil Psicológico de la IA' },
  specialties: { PT: 'Especialidades', EN: 'Specialties', ES: 'Especialidades' },
  signatures: { PT: 'Assinaturas Homiléticas', EN: 'Homiletic Signatures', ES: 'Firmas Homiléticas' },
  theology: { PT: 'Matriz Teológica', EN: 'Theological Matrix', ES: 'Matriz Teológica' },
  works: { PT: 'Obras de Referência na "Cabeça" da IA', EN: 'Reference Works in the AI\'s "Mind"', ES: 'Obras de Referencia en la "Cabeza" de la IA' },
  engage: { PT: 'O que você quer fazer?', EN: 'What do you want to do?', ES: '¿Qué quieres hacer?' },
  unlock: { PT: 'Desbloqueie a Sabedoria Histórica', EN: 'Unlock Historical Wisdom', ES: 'Desbloquea la Sabiduría Histórica' },
  upgradePrice: { PT: 'Faça o upgrade por $100/mês', EN: 'Upgrade for $100/month', ES: 'Mejora por $100/mes' },
};

interface Modality {
  id: string;
  icon: React.ElementType;
  emoji: string;
  label: Record<L, string>;
  description: Record<L, string>;
}

const modalities: Modality[] = [
  {
    id: 'devocional', icon: BookOpen, emoji: '📖',
    label: { PT: 'Devocional Diário', EN: 'Daily Devotional', ES: 'Devocional Diario' },
    description: { PT: 'Encorajamento matinal com a voz desta mente', EN: 'Morning encouragement with this mind\'s voice', ES: 'Aliento matutino con la voz de esta mente' },
  },
  {
    id: 'sermao', icon: PenTool, emoji: '📝',
    label: { PT: 'Preparação de Sermão', EN: 'Sermon Preparation', ES: 'Preparación de Sermón' },
    description: { PT: 'Ajuda para montar um esboço expositivo', EN: 'Help building an expository outline', ES: 'Ayuda para armar un esquema expositivo' },
  },
  {
    id: 'aconselhamento', icon: Users, emoji: '🗣️',
    label: { PT: 'Aconselhamento Pastoral', EN: 'Pastoral Counseling', ES: 'Consejería Pastoral' },
    description: { PT: 'Buscando sabedoria e cura para crises', EN: 'Seeking wisdom and healing for crises', ES: 'Buscando sabiduría y sanación para crisis' },
  },
  {
    id: 'estudo', icon: GraduationCap, emoji: '📚',
    label: { PT: 'Estudo Teológico', EN: 'Theological Study', ES: 'Estudio Teológico' },
    description: { PT: 'Deep dive em doutrinas e conceitos profundos', EN: 'Deep dive into doctrines and deep concepts', ES: 'Inmersión profunda en doctrinas y conceptos' },
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
    <div className="max-w-4xl mx-auto space-y-0">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/mentes')} className="mb-4 text-muted-foreground hover:text-foreground gap-2">
        <ArrowLeft className="h-4 w-4" />
        {lang === 'EN' ? 'Back to Minds' : lang === 'ES' ? 'Volver a Mentes' : 'Voltar às Mentes'}
      </Button>

      {/* === HERO SECTION === */}
      <section className="relative rounded-2xl border border-[hsl(43,55%,58%)]/20 bg-[hsl(210,40%,6%)] p-8 sm:p-12 text-center overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-[hsl(43,55%,58%)]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          {/* Photo */}
          <div className="mx-auto w-32 h-32 sm:w-40 sm:h-40 rounded-full border-3 border-[hsl(43,55%,58%)]/50 overflow-hidden shadow-[0_0_60px_hsl(43,55%,58%,0.15)] mb-5">
            <img src={mind.image} alt={mind.name} className="w-full h-full object-cover" width={160} height={160} />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">{mind.name}</h1>
          <p className="text-base italic text-[hsl(43,55%,58%)]/80 mt-1">{mind.subtitle[lang]}</p>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400/90 font-medium">Mentor Online</span>
          </div>
          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {mind.badges.map((badge, i) => (
              <Badge key={i} variant="outline" className="text-xs border-[hsl(43,55%,58%)]/25 bg-[hsl(43,55%,58%)]/5 text-[hsl(43,55%,58%)]/90 px-3 py-1.5 gap-1.5">
                <Brain className="h-3 w-3" />
                {badge[lang]}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* === BIOGRAPHY === */}
      <section className="rounded-2xl border border-border/50 bg-card p-6 sm:p-8 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Fingerprint className="h-5 w-5 text-[hsl(43,55%,58%)]" />
          <h2 className="text-lg font-bold text-foreground">{sectionLabels.bio[lang]}</h2>
        </div>
        <p className="text-[15px] leading-relaxed text-muted-foreground whitespace-pre-line">
          {mind.bio[lang]}
        </p>
      </section>

      {/* === SPECIALTIES & SIGNATURES (2-col) === */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Specialties */}
        <section className="rounded-2xl border border-border/50 bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-[hsl(43,55%,58%)]" />
            <h2 className="text-lg font-bold text-foreground">{sectionLabels.specialties[lang]}</h2>
          </div>
          <div className="space-y-2">
            {mind.specialties.map((s, i) => (
              <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-muted/30 border border-border/30">
                <Zap className="h-4 w-4 text-[hsl(43,55%,58%)] mt-0.5 shrink-0" />
                <span className="text-sm text-foreground/90">{s[lang]}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Signatures */}
        <section className="rounded-2xl border border-border/50 bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <ScrollText className="h-5 w-5 text-[hsl(43,55%,58%)]" />
            <h2 className="text-lg font-bold text-foreground">{sectionLabels.signatures[lang]}</h2>
          </div>
          <div className="space-y-2">
            {mind.signatures.map((s, i) => (
              <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-muted/30 border border-border/30">
                <Sparkles className="h-4 w-4 text-[hsl(43,55%,58%)] mt-0.5 shrink-0" />
                <span className="text-sm text-foreground/90 italic">{s[lang]}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* === THEOLOGICAL MATRIX === */}
      <section className="rounded-2xl border border-[hsl(43,55%,58%)]/15 bg-[hsl(210,40%,6%)] p-6 sm:p-8 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-[hsl(43,55%,58%)]" />
          <h2 className="text-lg font-bold text-white">{sectionLabels.theology[lang]}</h2>
        </div>
        <p className="text-[15px] leading-relaxed text-white/70">
          {mind.theologyMatrix[lang]}
        </p>
      </section>

      {/* === REFERENCE WORKS === */}
      <section className="rounded-2xl border border-border/50 bg-card p-6 sm:p-8 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Library className="h-5 w-5 text-[hsl(43,55%,58%)]" />
          <h2 className="text-lg font-bold text-foreground">{sectionLabels.works[lang]}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {mind.works.map((work, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/30 border border-border/30">
              <BookOpen className="h-4 w-4 text-[hsl(43,55%,58%)] shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground/90">{work.title[lang]}</p>
                {work.year && <p className="text-[11px] text-muted-foreground">{work.year}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === MODALITY ENGAGEMENT === */}
      <section className="rounded-2xl border border-[hsl(43,55%,58%)]/20 bg-[hsl(210,40%,6%)] p-6 sm:p-8 mt-4 mb-8">
        {isLocked ? (
          <div className="text-center space-y-4 py-6">
            <Lock className="h-10 w-10 mx-auto text-[hsl(43,55%,58%)]/60" />
            <h2 className="font-display text-2xl font-bold text-[hsl(43,55%,58%)]">{sectionLabels.unlock[lang]}</h2>
            <p className="text-sm text-white/50">{sectionLabels.upgradePrice[lang]}</p>
            <Button
              onClick={() => navigate('/upgrade')}
              className="px-8 py-5 text-base font-semibold bg-gradient-to-r from-[hsl(43,55%,58%)] to-[hsl(35,55%,50%)] hover:from-[hsl(43,55%,65%)] hover:to-[hsl(35,55%,57%)] text-[hsl(210,40%,6%)] gap-2"
            >
              <Crown className="h-4 w-4" />
              {sectionLabels.upgradePrice[lang]}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="h-5 w-5 text-[hsl(43,55%,58%)]" />
              <h2 className="text-lg font-bold text-white">{sectionLabels.engage[lang]}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {modalities.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => handleModality(mod.id)}
                  className="group flex items-center gap-4 p-5 rounded-xl border border-[hsl(43,55%,58%)]/15 bg-[hsl(210,40%,9%)] hover:bg-[hsl(210,40%,13%)] hover:border-[hsl(43,55%,58%)]/35 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-[hsl(43,55%,58%)]/10 flex items-center justify-center shrink-0 group-hover:bg-[hsl(43,55%,58%)]/20 transition-colors text-lg">
                    {mod.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{mod.label[lang]}</p>
                    <p className="text-xs text-white/50 mt-0.5">{mod.description[lang]}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
