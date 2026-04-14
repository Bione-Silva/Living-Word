// @ts-nocheck
import { useState, useCallback } from 'react';
import { Plus, FileText, Zap, BookOpen, Loader2, ChevronDown } from 'lucide-react';
import { SermonBlock, type SermonBlockData, type BlockType, BLOCK_META } from './SermonBlock';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/* ─── Templates de estrutura ─────────────────────────────────── */
const TEMPLATES: { id: string; label: string; desc: string; icon: React.ElementType; blocks: BlockType[] }[] = [
  {
    id: '3points',
    label: '3 Pontos Clássico',
    desc: 'Estrutura expositiva com 3 pontos e aplicações',
    icon: BookOpen,
    blocks: ['passagem', 'gancho', 'ponto', 'explicacao', 'ilustracao', 'aplicacao', 'transicao', 'ponto', 'explicacao', 'ilustracao', 'aplicacao', 'transicao', 'ponto', 'explicacao', 'aplicacao', 'conclusao', 'oracao'],
  },
  {
    id: 'narrativo',
    label: 'Narrativo',
    desc: 'Sermão em forma de história bíblica',
    icon: FileText,
    blocks: ['gancho', 'passagem', 'ilustracao', 'ponto', 'explicacao', 'ilustracao', 'aplicacao', 'conclusao', 'oracao'],
  },
  {
    id: 'evangelistico',
    label: 'Evangelístico',
    desc: 'Focado em apelo e decisão de fé',
    icon: Zap,
    blocks: ['gancho', 'passagem', 'ponto', 'ilustracao', 'aplicacao', 'citacao', 'conclusao', 'oracao'],
  },
  {
    id: 'devocional',
    label: 'Devocional',
    desc: 'Para momentos de reflexão e devoção',
    icon: BookOpen,
    blocks: ['gancho', 'passagem', 'explicacao', 'citacao', 'aplicacao', 'oracao'],
  },
];

/* ─── Gerador de ID único ─────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 9);

function createBlock(type: BlockType, order: number): SermonBlockData {
  return { id: uid(), type, content: '', order };
}

/* ─── Tipos de bloco disponíveis para menu Add Block ─────────── */
const BLOCK_MENU_ORDER: BlockType[] = [
  'passagem', 'gancho', 'ponto', 'explicacao',
  'ilustracao', 'aplicacao', 'transicao', 'citacao',
  'conclusao', 'oracao', 'livre',
];

/* ─── Props ─────────────────────────────────────────────────── */
interface SermonBlockEditorProps {
  blocks: SermonBlockData[];
  onChange: (blocks: SermonBlockData[]) => void;
  bigIdea: string;
  passageRef: string;
  lang?: 'PT' | 'EN' | 'ES';
  /** Chamado quando o pastor quer gerar o sermão inteiro de uma vez com IA */
  onGenerateAll?: (topic: string) => void;
  generating?: boolean;
}

export function SermonBlockEditor({
  blocks, onChange, bigIdea, passageRef, lang = 'PT',
  onGenerateAll, generating,
}: SermonBlockEditorProps) {
  const [showTemplates, setShowTemplates] = useState(blocks.length === 0);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [bulkTopic, setBulkTopic] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  /* ── Aplicar template ────────────────────────────────────── */
  const applyTemplate = useCallback((tpl: typeof TEMPLATES[0]) => {
    const newBlocks: SermonBlockData[] = tpl.blocks.map((type, i) => createBlock(type, i));
    onChange(newBlocks);
    setShowTemplates(false);
    toast.success(`Template "${tpl.label}" aplicado!`);
  }, [onChange]);

  /* ── Adicionar bloco ─────────────────────────────────────── */
  const addBlock = useCallback((type: BlockType) => {
    const next: SermonBlockData = createBlock(type, blocks.length);
    onChange([...blocks, next]);
    setShowAddMenu(false);
  }, [blocks, onChange]);

  /* ── Atualizar conteúdo de um bloco ─────────────────────── */
  const handleChange = useCallback((id: string, content: string) => {
    onChange(blocks.map(b => b.id === id ? { ...b, content } : b));
  }, [blocks, onChange]);

  /* ── Excluir bloco ───────────────────────────────────────── */
  const handleDelete = useCallback((id: string) => {
    onChange(blocks.filter(b => b.id !== id).map((b, i) => ({ ...b, order: i })));
  }, [blocks, onChange]);

  /* ── Mover bloco para cima ───────────────────────────────── */
  const handleMoveUp = useCallback((id: string) => {
    const i = blocks.findIndex(b => b.id === id);
    if (i <= 0) return;
    const next = [...blocks];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next.map((b, idx) => ({ ...b, order: idx })));
  }, [blocks, onChange]);

  /* ── Mover bloco para baixo ──────────────────────────────── */
  const handleMoveDown = useCallback((id: string) => {
    const i = blocks.findIndex(b => b.id === id);
    if (i >= blocks.length - 1) return;
    const next = [...blocks];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    onChange(next.map((b, idx) => ({ ...b, order: idx })));
  }, [blocks, onChange]);

  /* ── Gerar esboço completo via IA e popular os blocos ────── */
  const handleBulkGenerate = async () => {
    if (!bulkTopic.trim()) return;
    setBulkLoading(true);
    try {
      const systemPrompt = [
        'Você é um homiletista especializado. Gere um esboço de sermão completo em formato JSON.',
        `Passagem/Tema: "${bulkTopic}".`,
        bigIdea ? `Grande Ideia: "${bigIdea}".` : '',
        'Retorne APENAS um JSON válido com este formato (sem markdown, sem explicações):',
        JSON.stringify([
          { type: 'passagem', content: '...' },
          { type: 'gancho', content: '...' },
          { type: 'ponto', content: '...' },
          { type: 'explicacao', content: '...' },
          { type: 'ilustracao', content: '...' },
          { type: 'aplicacao', content: '...' },
          { type: 'ponto', content: '...' },
          { type: 'explicacao', content: '...' },
          { type: 'ilustracao', content: '...' },
          { type: 'aplicacao', content: '...' },
          { type: 'conclusao', content: '...' },
          { type: 'oracao', content: '...' },
        ]),
        `Escreva em ${lang === 'EN' ? 'inglês' : lang === 'ES' ? 'espanhol' : 'português do Brasil'}.`,
        'Cada bloco deve ter 100-200 palavras de conteúdo pastoral profundo.',
      ].filter(Boolean).join('\n');

      const { data, error } = await supabase.functions.invoke('ai-tool', {
        body: { systemPrompt, userPrompt: bulkTopic.trim(), toolId: 'sermon-block-bulk' },
      });
      if (error) throw error;

      // tenta extrair o JSON da resposta
      let raw = data?.content || '[]';
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) raw = jsonMatch[0];
      const parsed: { type: BlockType; content: string }[] = JSON.parse(raw);

      const newBlocks: SermonBlockData[] = parsed.map((b, i) => ({
        id: uid(), type: b.type as BlockType, content: b.content, order: i,
      }));
      onChange(newBlocks);
      setShowTemplates(false);
      toast.success('Esboço completo gerado! ✨');
    } catch (e) {
      toast.error('Erro ao gerar esboço. Tente novamente.');
    } finally {
      setBulkLoading(false);
    }
  };

  /* ═══ RENDER ════════════════════════════════════════════════ */

  /* Tela de seleção de template / ponto de partida */
  if (showTemplates && blocks.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="text-center space-y-1">
          <h2 className="text-base font-bold text-foreground">Como você quer começar?</h2>
          <p className="text-xs text-muted-foreground">Escolha um template ou deixe a IA montar o esboço para você</p>
        </div>

        {/* Gerar com IA */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <p className="text-xs font-bold text-primary uppercase tracking-wider">✨ Gerar Esboço com IA</p>
          <input
            value={bulkTopic}
            onChange={e => setBulkTopic(e.target.value)}
            placeholder="Digite o tema ou passagem bíblica..."
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={handleBulkGenerate}
            disabled={!bulkTopic.trim() || bulkLoading}
            className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            {bulkLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando esboço...</> : <><Zap className="h-4 w-4" /> Gerar Esboço</>}
          </button>
        </div>

        {/* Separador */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">ou escolha um template</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Templates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEMPLATES.map(tpl => {
            const Icon = tpl.icon;
            return (
              <button
                key={tpl.id}
                onClick={() => applyTemplate(tpl)}
                className="group text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">{tpl.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{tpl.desc}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-2">{tpl.blocks.length} blocos</p>
              </button>
            );
          })}
        </div>

        {/* Começar do zero */}
        <button
          onClick={() => { onChange([createBlock('gancho', 0)]); setShowTemplates(false); }}
          className="w-full text-xs text-muted-foreground hover:text-foreground text-center py-2 transition-colors"
        >
          Começar em branco →
        </button>
      </div>
    );
  }

  /* Editor com blocos */
  return (
    <div className="space-y-3">
      {/* Lista de blocos */}
      {blocks.map((block, idx) => (
        <SermonBlock
          key={block.id}
          block={block}
          bigIdea={bigIdea}
          passageRef={passageRef}
          onChange={handleChange}
          onDelete={handleDelete}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          isFirst={idx === 0}
          isLast={idx === blocks.length - 1}
          lang={lang}
        />
      ))}

      {/* Barra de adicionar bloco */}
      <div className="relative">
        <button
          onClick={() => setShowAddMenu(v => !v)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Plus className="h-4 w-4" />
          Adicionar Bloco
          <ChevronDown className={`h-3 w-3 transition-transform ${showAddMenu ? 'rotate-180' : ''}`} />
        </button>

        {showAddMenu && (
          <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-xl border border-border bg-popover shadow-xl p-2 grid grid-cols-2 sm:grid-cols-3 gap-1 animate-in fade-in slide-in-from-top-2 duration-150">
            {BLOCK_MENU_ORDER.map(type => {
              const m = BLOCK_META[type];
              const Icon = m.icon;
              return (
                <button
                  key={type}
                  onClick={() => addBlock(type)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ background: m.color }} />
                  <span className="text-xs font-medium text-foreground leading-tight">{m.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Mudar template */}
      {blocks.length > 0 && (
        <button
          onClick={() => { onChange([]); setShowTemplates(true); }}
          className="w-full text-[10px] text-muted-foreground/50 hover:text-muted-foreground text-center py-1 transition-colors"
        >
          Reiniciar com outro template
        </button>
      )}
    </div>
  );
}

/* ─── Utilitário: converte array de blocos para Markdown ─────── */
export function blocksToMarkdown(blocks: SermonBlockData[]): string {
  return blocks
    .map(b => {
      const meta = BLOCK_META[b.type];
      if (!b.content.trim()) return null;
      switch (b.type) {
        case 'passagem':  return `## 📖 ${meta.label}\n\n> ${b.content}`;
        case 'gancho':    return `## 🚀 ${meta.label}\n\n${b.content}`;
        case 'ponto':     return `## 🎯 ${meta.label}\n\n**${b.content}**`;
        case 'explicacao':return `### ${meta.label}\n\n${b.content}`;
        case 'ilustracao':return `### 💡 ${meta.label}\n\n${b.content}`;
        case 'aplicacao': return `### ✅ ${meta.label}\n\n${b.content}`;
        case 'citacao':   return `> *"${b.content}"*`;
        case 'transicao': return `---\n\n${b.content}`;
        case 'conclusao': return `## 🌹 ${meta.label}\n\n${b.content}`;
        case 'oracao':    return `## 🙏 ${meta.label}\n\n*${b.content}*`;
        default:          return b.content;
      }
    })
    .filter(Boolean)
    .join('\n\n');
}

export type { SermonBlockEditorProps };
