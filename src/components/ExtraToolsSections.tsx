import { ToolCard, type ToolCardData } from '@/components/ToolCard';
import { Video, MessageSquare, Mail, Megaphone, Gamepad2, Feather, Baby, Globe, Users } from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

export const extraOutreachTools: ToolCardData[] = [
  {
    id: 'reels-script',
    icon: Video,
    title: { PT: 'Roteiro para Reels', EN: 'Reels Script', ES: 'Guion para Reels' },
    description: {
      PT: 'Roteiros profissionais para vídeos curtos nas redes.',
      EN: 'Professional scripts for short social media videos.',
      ES: 'Guiones profesionales para videos cortos en redes.',
    },
    hasModal: true,
  },
  {
    id: 'cell-group',
    icon: Users,
    title: { PT: 'Estudo de Célula', EN: 'Cell Group Study', ES: 'Estudio de Célula' },
    description: {
      PT: 'Material completo para reuniões de célula ou pequenos grupos.',
      EN: 'Complete material for cell meetings or small groups.',
      ES: 'Material completo para reuniones de célula o grupos pequeños.',
    },
    hasModal: true,
  },
  {
    id: 'social-caption',
    icon: MessageSquare,
    title: { PT: 'Legendas para Redes', EN: 'Social Captions', ES: 'Subtítulos para Redes' },
    description: {
      PT: 'Textos com hashtags e CTAs para Instagram e Facebook.',
      EN: 'Texts with hashtags and CTAs for Instagram and Facebook.',
      ES: 'Textos con hashtags y CTAs para Instagram y Facebook.',
    },
    hasModal: true,
  },
  {
    id: 'newsletter',
    icon: Mail,
    title: { PT: 'Newsletter Semanal', EN: 'Weekly Newsletter', ES: 'Newsletter Semanal' },
    description: {
      PT: 'Newsletter pronta com devocional, avisos e palavra pastoral.',
      EN: 'Ready newsletter with devotional, announcements and pastoral word.',
      ES: 'Newsletter lista con devocional, avisos y palabra pastoral.',
    },
    hasModal: true,
  },
  {
    id: 'announcements',
    icon: Megaphone,
    title: { PT: 'Avisos do Culto', EN: 'Service Announcements', ES: 'Avisos del Culto' },
    description: {
      PT: 'Comunicação clara e acolhedora para boletim e projeção.',
      EN: 'Clear and welcoming communication for bulletin and projection.',
      ES: 'Comunicación clara y acogedora para boletín y proyección.',
    },
    hasModal: true,
  },
];

export const extraFunTools: ToolCardData[] = [
  {
    id: 'trivia',
    icon: Gamepad2,
    title: { PT: 'Quiz Bíblico', EN: 'Bible Trivia', ES: 'Trivia Bíblica' },
    description: {
      PT: 'Quizzes divertidos para célula, EBD e eventos.',
      EN: 'Fun quizzes for cell groups, Sunday school and events.',
      ES: 'Quizzes divertidos para célula, escuela dominical y eventos.',
    },
    hasModal: true,
  },
  {
    id: 'poetry',
    icon: Feather,
    title: { PT: 'Poesia Cristã', EN: 'Christian Poetry', ES: 'Poesía Cristiana' },
    description: {
      PT: 'Poemas inspirados em passagens e temas de fé.',
      EN: 'Poems inspired by passages and themes of faith.',
      ES: 'Poemas inspirados en pasajes y temas de fe.',
    },
    hasModal: true,
  },
  {
    id: 'kids-story',
    icon: Baby,
    title: { PT: 'Histórias Infantis', EN: 'Kids Stories', ES: 'Historias Infantiles' },
    description: {
      PT: 'Histórias bíblicas adaptadas para crianças de 5-10 anos.',
      EN: 'Biblical stories adapted for children ages 5-10.',
      ES: 'Historias bíblicas adaptadas para niños de 5-10 años.',
    },
    hasModal: true,
  },
  {
    id: 'deep-translation',
    icon: Globe,
    title: { PT: 'Tradução Teológica', EN: 'Theological Translation', ES: 'Traducción Teológica' },
    description: {
      PT: 'Traduções que preservam nuances teológicas entre PT, EN e ES.',
      EN: 'Translations that preserve theological nuances between PT, EN and ES.',
      ES: 'Traducciones que preservan matices teológicos entre PT, EN y ES.',
    },
    locked: true,
    hasModal: true,
  },
];

interface ExtraToolsSectionsProps {
  lang: L;
  isFree: boolean;
  onToolClick: (tool: ToolCardData) => void;
}

function ExtraToolsSection({
  emoji,
  title,
  tools,
  lang,
  isFree,
  onToolClick,
  startIndex = 0,
}: {
  emoji: string;
  title: Record<L, string>;
  tools: ToolCardData[];
  lang: L;
  isFree: boolean;
  onToolClick: (tool: ToolCardData) => void;
  startIndex?: number;
}) {
  return (
    <section>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground whitespace-nowrap font-body">
            {emoji} {title[lang]}
          </h2>
          <div className="flex-1 h-px bg-border/50" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tools.map((tool, index) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            lang={lang}
            isFree={isFree}
            onClick={onToolClick}
            index={startIndex + index}
          />
        ))}
      </div>
    </section>
  );
}

export function ExtraToolsSections({ lang, isFree, onToolClick }: ExtraToolsSectionsProps) {
  return (
    <div className="space-y-8">
      <ExtraToolsSection
        emoji="📢"
        title={{ PT: 'Ferramentas de Alcance', EN: 'Outreach Tools', ES: 'Herramientas de Alcance' }}
        tools={extraOutreachTools}
        lang={lang}
        isFree={isFree}
        onToolClick={onToolClick}
      />

      <ExtraToolsSection
        emoji="🎮"
        title={{ PT: 'Divertidas e Dinâmicas', EN: 'Fun & Interactive', ES: 'Divertidas y Dinámicas' }}
        tools={extraFunTools}
        lang={lang}
        isFree={isFree}
        onToolClick={onToolClick}
        startIndex={extraOutreachTools.length}
      />
    </div>
  );
}