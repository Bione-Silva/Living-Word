import { BookOpen } from 'lucide-react';

interface HistoricalSourcesCardProps {
  sources: string | null | undefined;
  lang: 'PT' | 'EN' | 'ES';
}

const labels = {
  PT: '📚 Fontes Históricas Utilizadas pelo Sistema RAG:',
  EN: '📚 Historical Sources Used by the RAG System:',
  ES: '📚 Fuentes Históricas Utilizadas por el Sistema RAG:',
};

export function HistoricalSourcesCard({ sources, lang }: HistoricalSourcesCardProps) {
  if (!sources || !sources.trim()) return null;

  return (
    <div className="rounded-lg border p-4 flex gap-3 items-start"
      style={{
        backgroundColor: '#faf8f5',
        borderColor: '#e7e0d5',
      }}
    >
      <BookOpen className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#8B7355' }} />
      <div className="space-y-1 min-w-0">
        <p className="text-xs font-semibold tracking-wide" style={{ color: '#6B4F3A' }}>
          {labels[lang]}
        </p>
        <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#5a4a3a' }}>
          {sources}
        </p>
      </div>
    </div>
  );
}
