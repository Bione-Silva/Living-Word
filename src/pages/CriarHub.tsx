import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ToolSheet } from '@/components/ToolSheet';
import { UpgradeModal } from '@/components/UpgradeModal';
import {
  Sparkles, GraduationCap, PenTool, Type, Lightbulb, Film,
  Video, MessageSquare, Mail, Megaphone, HelpCircle, Feather, Globe, Lock, Crown, Building2
} from 'lucide-react';
import { isToolLockedForPlan, getMinPlanForTool, getUpgradeBadge, type PlanSlug } from '@/lib/plans';
import { normalizePlan } from '@/lib/plan-normalization';

type L = 'PT' | 'EN' | 'ES';

interface ToolOption {
  id: string;
  icon: React.ElementType;
  label: Record<L, string>;
  desc: Record<L, string>;
  to?: string;
  categoryId: string;
}

const CATEGORIES = [
  { id: 'pastoral', label: { PT: 'Conteúdo Pastoral e Estudos', EN: 'Pastoral Content and Studies', ES: 'Contenido Pastoral y Estudios' } },
  { id: 'media', label: { PT: 'Mídias e Redes Sociais', EN: 'Media and Social Networks', ES: 'Medios y Redes Sociales' } },
  { id: 'creative', label: { PT: 'Ferramentas Criativas', EN: 'Creative Tools', ES: 'Herramientas Creativas' } },
];

const createTools: ToolOption[] = [
  // Pastoral
  { id: 'biblical-study', categoryId: 'pastoral', icon: GraduationCap, label: { PT: 'Estudo Bíblico', EN: 'Bible Study', ES: 'Estudio Bíblico' }, desc: { PT: 'Contexto, exegese e teologia', EN: 'Context, exegesis and theology', ES: 'Contexto, exégesis y teología' }, to: '/estudos/novo' },
  { id: 'free-article', categoryId: 'pastoral', icon: PenTool, label: { PT: 'Blog & Artigos', EN: 'Blog & Articles', ES: 'Blog y Artículos' }, desc: { PT: 'Gere artigos ricos e estruturados', EN: 'Generate rich and structured articles', ES: 'Generar artículos ricos y estructurados' }, to: '/blog' },
  { id: 'free-article-universal', categoryId: 'pastoral', icon: Type, label: { PT: 'Redator Universal', EN: 'Universal Writer', ES: 'Redactor Universal' }, desc: { PT: 'Escreva sobre qualquer assunto', EN: 'Write about any subject', ES: 'Escribe sobre cualquier tema' } },
  { id: 'newsletter', categoryId: 'pastoral', icon: Mail, label: { PT: 'Newsletter Semanal', EN: 'Weekly Newsletter', ES: 'Newsletter Semanal' }, desc: { PT: 'Comunique-se com sua igreja', EN: 'Communicate with your church', ES: 'Comunícate con tu iglesia' } },
  { id: 'announcements', categoryId: 'pastoral', icon: Megaphone, label: { PT: 'Avisos do Culto', EN: 'Service Announcements', ES: 'Avisos del Culto' }, desc: { PT: 'Avisos claros e cativantes', EN: 'Clear and catchy announcements', ES: 'Anuncios claros y pegadizos' } },
  { id: 'deep-translation', categoryId: 'pastoral', icon: Globe, label: { PT: 'Tradução Teológica', EN: 'Theological Translation', ES: 'Traducción Teológica' }, desc: { PT: 'Traduza preservando o sentido original', EN: 'Translate preserving original meaning', ES: 'Traduce preservando el sentido original' } },

  // Media
  { id: 'reels-script', categoryId: 'media', icon: Video, label: { PT: 'Roteiro para Reels', EN: 'Reels Script', ES: 'Guion para Reels' }, desc: { PT: 'Roteiros dinâmicos para vídeos curtos', EN: 'Dynamic scripts for short videos', ES: 'Guiones dinámicos para videos cortos' } },
  { id: 'social-caption', categoryId: 'media', icon: MessageSquare, label: { PT: 'Legendas para Redes', EN: 'Social Captions', ES: 'Subtítulos para Redes' }, desc: { PT: 'Posts engajadores para Instagram', EN: 'Engaging posts for Instagram', ES: 'Publicaciones atractivas para Instagram' } },
  { id: 'youtube-blog', categoryId: 'media', icon: Video, label: { PT: 'Link do YouTube', EN: 'YouTube Link', ES: 'Enlace de YouTube' }, desc: { PT: 'Resumo e transcrição de vídeos', EN: 'Video summary and transcription', ES: 'Resumen y transcripción de videos' } },
  { id: 'illustrations', categoryId: 'media', icon: Film, label: { PT: 'Ilustrações', EN: 'Illustrations', ES: 'Ilustraciones' }, desc: { PT: 'Ideias visuais para suas mensagens', EN: 'Visual ideas for your messages', ES: 'Ideas visuales para tus mensajes' } },

  // Creative
  { id: 'title-gen', categoryId: 'creative', icon: Type, label: { PT: 'Títulos Criativos', EN: 'Creative Titles', ES: 'Títulos Creativos' }, desc: { PT: 'Chame a atenção desde a primeira linha', EN: 'Catch attention from the first line', ES: 'Llama la atención desde la primera línea' } },
  { id: 'metaphor-creator', categoryId: 'creative', icon: Lightbulb, label: { PT: 'Criador de Metáforas', EN: 'Metaphor Creator', ES: 'Creador de Metáforas' }, desc: { PT: 'Explique conceitos complexos de forma simples', EN: 'Explain complex concepts simply', ES: 'Explica conceptos complejos de forma sencilla' } },
  { id: 'poetry', categoryId: 'creative', icon: Feather, label: { PT: 'Poesia Cristã', EN: 'Christian Poetry', ES: 'Poesía Cristiana' }, desc: { PT: 'Crie poemas com bases bíblicas', EN: 'Create poems with biblical foundations', ES: 'Crea poemas con bases bíblicas' } },
  { id: 'trivia', categoryId: 'creative', icon: HelpCircle, label: { PT: 'Quiz Bíblico', EN: 'Bible Trivia', ES: 'Trivia Bíblica' }, desc: { PT: 'Gere perguntas para engajar seu grupo', EN: 'Generate questions to engage your group', ES: 'Genera preguntas para involucrar a tu grupo' }, to: '/quiz' },
  { id: 'bible-modernizer', categoryId: 'creative', icon: Sparkles, label: { PT: 'Modernizador Bíblico', EN: 'Bible Modernizer', ES: 'Modernizador Bíblico' }, desc: { PT: 'Linguagem atual para textos clássicos', EN: 'Modern language for classic texts', ES: 'Lenguaje actual para textos clásicos' } },
];

function LockBadge({ userPlan, toolId, lang }: { userPlan: PlanSlug; toolId: string; lang: L }) {
  const requiredPlan = getMinPlanForTool(toolId);
  const badgeType = getUpgradeBadge(userPlan, requiredPlan);
  const lockText = lang === 'PT' ? 'Bloqueado' : lang === 'EN' ? 'Locked' : 'Bloqueado';
  
  return (
    <span className="inline-flex items-center gap-0.5 text-[8.5px] font-semibold uppercase tracking-wide text-primary bg-primary/10 border border-primary/20 px-1 py-0.5 rounded shrink-0">
      {badgeType === 'church' ? <Building2 className="h-2 w-2" /> : badgeType === 'crown' ? <Crown className="h-2 w-2" /> : <Lock className="h-2 w-2" />}
      {lockText}
    </span>
  );
}

export default function CriarHub() {
  const { profile } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const userPlan: PlanSlug = normalizePlan(profile?.plan);
  const [activeTool, setActiveTool] = useState<{ id: string; title: string } | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{ featureName: string; toolId: string; requiredPlan: PlanSlug } | null>(null);

  const handleClick = (tool: any) => {
    if (isToolLockedForPlan(tool.id, userPlan)) {
      setUpgradeModal({
        featureName: tool.label[lang],
        toolId: tool.id,
        requiredPlan: getMinPlanForTool(tool.id),
      });
      return;
    }
    if (tool.to) {
      navigate(tool.to);
      return;
    }
    setActiveTool({ id: tool.id, title: tool.label[lang] });
  };

  const pageTitle = lang === 'PT' ? 'Hub de Criação' : lang === 'EN' ? 'Creation Hub' : 'Hub de Creación';
  const pageSubtitle = lang === 'PT'
    ? 'Todas as ferramentas para produção de conteúdo pastoral, ministerial e mídias.'
    : lang === 'EN'
    ? 'All tools for pastoral, ministry, and media content production.'
    : 'Todas las herramientas para la producción de contenido pastoral, ministerial y de medios.';

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-10">
      {/* ── Help hero header ── */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-3 shadow-sm">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl sm:text-2xl font-bold leading-tight text-foreground">
              {pageTitle}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">{pageSubtitle}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 sm:space-y-8">
        {CATEGORIES.map(category => {
          const categoryTools = createTools.filter(t => t.categoryId === category.id);
          if (categoryTools.length === 0) return null;

          return (
            <div key={category.id} className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-sm">
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
                  {category.label[lang as L]}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {categoryTools.map((tool) => {
                  const Icon = tool.icon;
                  const locked = isToolLockedForPlan(tool.id, userPlan);
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleClick(tool)}
                      className={`group relative text-left rounded-lg border p-2.5 transition-all flex items-start gap-2.5 bg-background hover:border-primary/40 hover:bg-muted/40 border-border ${
                        locked ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="h-8 w-8 rounded-md flex items-center justify-center shrink-0 transition-colors mt-0.5 bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5 mb-0.5">
                          <div className="text-xs font-semibold text-foreground leading-tight truncate">
                            {tool.label[lang as L]}
                          </div>
                          {locked && <LockBadge userPlan={userPlan} toolId={tool.id} lang={lang as L} />}
                        </div>
                        <div className="text-[10.5px] text-muted-foreground leading-snug line-clamp-2">
                          {tool.desc[lang as L]}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {activeTool && (
        <ToolSheet
          open={!!activeTool}
          onOpenChange={(open) => !open && setActiveTool(null)}
          toolId={activeTool.id}
          toolTitle={activeTool.title}
        />
      )}
      {upgradeModal && (
        <UpgradeModal
          open={!!upgradeModal}
          onOpenChange={(open) => !open && setUpgradeModal(null)}
          featureName={upgradeModal.featureName}
          toolId={upgradeModal.toolId}
          currentPlan={userPlan}
          requiredPlan={upgradeModal.requiredPlan}
        />
      )}
    </div>
  );
}
