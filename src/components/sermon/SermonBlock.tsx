// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Trash2, GripVertical, ChevronDown, ChevronUp,
  BookOpen, Lightbulb, Target, MessageSquare, Quote, PenLine,
  AlignLeft, Star, Loader2, Plus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/* ─── Tipos de Bloco ─────────────────────────────────────────── */
export type BlockType =
  | 'passagem'
  | 'gancho'
  | 'ponto'
  | 'explicacao'
  | 'ilustracao'
  | 'aplicacao'
  | 'transicao'
  | 'citacao'
  | 'conclusao'
  | 'oracao'
  | 'livre';

export interface SermonBlockData {
  id: string;
  type: BlockType;
  content: string;
  label?: string;        // subtitle dentro do ponto (opcional)
  order: number;
}

/* ─── Metadados visuais por tipo ─────────────────────────────── */
const BLOCK_META: Record<BlockType, {
  label: string;
  color: string;       // borda/accent
  bg: string;          // fundo suave
  tagBg: string;       // tag pill color
  icon: React.ElementType;
  placeholder: string;
  aiHint: string;      // o que a IA vai gerar
}> = {
  passagem: {
    label: 'PASSAGEM BÍBLICA', color: '#6366f1', bg: 'rgba(99,102,241,0.06)',
    tagBg: 'rgba(99,102,241,0.15)', icon: BookOpen,
    placeholder: 'Ex: João 14:1-6 — escreva ou cole a passagem completa...',
    aiHint: 'uma análise contextual e exegética breve da passagem',
  },
  gancho: {
    label: 'GANCHO / INTRODUÇÃO', color: '#f59e0b', bg: 'rgba(245,158,11,0.06)',
    tagBg: 'rgba(245,158,11,0.15)', icon: Star,
    placeholder: 'Abra com uma história, pergunta ou dado surpreendente...',
    aiHint: 'um gancho criativo e envolvente para abrir o sermão',
  },
  ponto: {
    label: 'PONTO PRINCIPAL', color: '#3b82f6', bg: 'rgba(59,130,246,0.06)',
    tagBg: 'rgba(59,130,246,0.15)', icon: Target,
    placeholder: 'Declare o ponto central desta seção da mensagem...',
    aiHint: 'um ponto principal claro, com exposição e desenvolvimento bíblico',
  },
  explicacao: {
    label: 'EXPLICAÇÃO', color: '#8b5cf6', bg: 'rgba(139,92,246,0.06)',
    tagBg: 'rgba(139,92,246,0.15)', icon: AlignLeft,
    placeholder: 'Explique o texto bíblico em contexto histórico e teológico...',
    aiHint: 'uma explicação exegética clara e profunda do texto bíblico',
  },
  ilustracao: {
    label: 'ILUSTRAÇÃO', color: '#10b981', bg: 'rgba(16,185,129,0.06)',
    tagBg: 'rgba(16,185,129,0.15)', icon: Lightbulb,
    placeholder: 'Conte uma história, analogia ou exemplo prático da vida real...',
    aiHint: 'uma ilustração poderosa, cotidiana e memorável',
  },
  aplicacao: {
    label: 'APLICAÇÃO PRÁTICA', color: '#f97316', bg: 'rgba(249,115,22,0.06)',
    tagBg: 'rgba(249,115,22,0.15)', icon: MessageSquare,
    placeholder: 'Como esta verdade transforma o dia a dia do ouvinte?...',
    aiHint: 'uma aplicação prática direta e transformadora para a vida do ouvinte',
  },
  transicao: {
    label: 'TRANSIÇÃO', color: '#64748b', bg: 'rgba(100,116,139,0.06)',
    tagBg: 'rgba(100,116,139,0.15)', icon: ChevronDown,
    placeholder: 'Facilite a passagem natural entre seções da mensagem...',
    aiHint: 'uma frase de transição fluida e natural entre as seções',
  },
  citacao: {
    label: 'CITAÇÃO', color: '#d4a853', bg: 'rgba(212,168,83,0.06)',
    tagBg: 'rgba(212,168,83,0.15)', icon: Quote,
    placeholder: 'Cite um teólogo, pastor ou pensador relevante...',
    aiHint: 'uma citação poderosa de um grande pregador ou teólogo sobre este tema',
  },
  conclusao: {
    label: 'CONCLUSÃO', color: '#ec4899', bg: 'rgba(236,72,153,0.06)',
    tagBg: 'rgba(236,72,153,0.15)', icon: Star,
    placeholder: 'Amarre a Grande Ideia e faça o apelo final ao coração...',
    aiHint: 'uma conclusão poderosa que amarre a grande ideia e faça apelo sincero ao coração',
  },
  oracao: {
    label: 'ORAÇÃO / APELO', color: '#14b8a6', bg: 'rgba(20,184,166,0.06)',
    tagBg: 'rgba(20,184,166,0.15)', icon: Star,
    placeholder: 'Escreva a oração de encerramento ou o apelo de decisão...',
    aiHint: 'uma oração de encerramento ou apelo de decisão pastor e sincero',
  },
  livre: {
    label: 'NOTA LIVRE', color: '#6b7280', bg: 'rgba(107,114,128,0.06)',
    tagBg: 'rgba(107,114,128,0.15)', icon: PenLine,
    placeholder: 'Espaço livre para qualquer anotação ou rascunho...',
    aiHint: 'um complemento criativo para esta nota do sermão',
  },
};

/* ─── Props ─────────────────────────────────────────────────── */
interface SermonBlockProps {
  block: SermonBlockData;
  bigIdea: string;           // a "grande ideia" do sermão inteiro
  passageRef: string;        // passagem bíblica principal
  onChange: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
  lang?: 'PT' | 'EN' | 'ES';
}

export function SermonBlock({
  block, bigIdea, passageRef,
  onChange, onDelete, onMoveUp, onMoveDown,
  isFirst, isLast, lang = 'PT',
}: SermonBlockProps) {
  const meta = BLOCK_META[block.type];
  const Icon = meta.icon;
  const [aiLoading, setAiLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Auto-resize textarea */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [block.content, collapsed]);

  /* ── IA Intra-Bloco ────────────────────────────────────────── */
  const handleAiGenerate = async () => {
    setAiLoading(true);
    try {
      const systemPrompt = [
        `Você é um assistente homiletista especializado. Gere APENAS ${meta.aiHint}.`,
        `O sermão é sobre a passagem bíblica: "${passageRef || 'não definida'}".`,
        bigIdea ? `A Grande Ideia Central do sermão é: "${bigIdea}".` : '',
        `Responda em texto limpo e direto (sem marcação de seção nem títulos), pronto para ser colado em um bloco de ${meta.label}.`,
        `Escreva em ${lang === 'EN' ? 'inglês' : lang === 'ES' ? 'espanhol' : 'português do Brasil'}.`,
        `Limite: 200-350 palavras, com profundidade pastoral.`,
      ].filter(Boolean).join('\n');

      const { data, error } = await supabase.functions.invoke('ai-tool', {
        body: {
          systemPrompt,
          userPrompt: block.content
            ? `Baseado no que já escrevi:\n"${block.content}"\n\nMelhore ou substitua por algo melhor.`
            : `Gere ${meta.aiHint} para este sermão.`,
          toolId: `sermon-block-${block.type}`,
        },
      });
      if (error) throw error;
      const generated = data?.content || '';
      onChange(block.id, generated);
      toast.success('Bloco gerado com IA ✨');
    } catch {
      toast.error('Erro ao gerar. Tente novamente.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div
      className="group relative rounded-xl border transition-shadow hover:shadow-md"
      style={{
        borderColor: meta.color + '40',
        background: meta.bg,
        borderLeftWidth: '3px',
        borderLeftColor: meta.color,
      }}
    >
      {/* ── Header do Bloco ─────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        {/* Drag handle visual (decorativo por ora) */}
        <GripVertical className="h-4 w-4 shrink-0 opacity-20 group-hover:opacity-50 transition-opacity cursor-grab" />

        {/* Tag colorida */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider shrink-0"
          style={{ background: meta.tagBg, color: meta.color }}
        >
          <Icon className="h-3 w-3" />
          {meta.label}
        </div>

        <div className="flex-1" />

        {/* Controles de ordem + colapso + exclusão */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isFirst && (
            <button onClick={() => onMoveUp(block.id)} className="p-1 rounded hover:bg-white/20 text-muted-foreground hover:text-foreground transition-colors" title="Mover para cima">
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
          )}
          {!isLast && (
            <button onClick={() => onMoveDown(block.id)} className="p-1 rounded hover:bg-white/20 text-muted-foreground hover:text-foreground transition-colors" title="Mover para baixo">
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={() => setCollapsed(v => !v)} className="p-1 rounded hover:bg-white/20 text-muted-foreground hover:text-foreground transition-colors" title="Colapsar">
            {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => onDelete(block.id)} className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors" title="Excluir bloco">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Corpo (textarea + IA) ────────────────────────────── */}
      {!collapsed && (
        <div className="px-3 pb-3 space-y-2">
          <textarea
            ref={textareaRef}
            value={block.content}
            onChange={e => onChange(block.id, e.target.value)}
            placeholder={meta.placeholder}
            rows={3}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none leading-relaxed min-h-[72px]"
          />
          {/* Rodapé do bloco */}
          <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: meta.color + '20' }}>
            <span className="text-[10px] text-muted-foreground/40">
              {block.content.trim().split(/\s+/).filter(Boolean).length} palavras
            </span>
            <button
              onClick={handleAiGenerate}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              style={{ background: meta.color + '20', color: meta.color }}
            >
              {aiLoading
                ? <><Loader2 className="h-3 w-3 animate-spin" /> Gerando...</>
                : <><Sparkles className="h-3 w-3" /> Sugerir com IA</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Exporta metadados e tipos (útil para o Editor pai) ─────── */
export { BLOCK_META };
export type { SermonBlockProps };
