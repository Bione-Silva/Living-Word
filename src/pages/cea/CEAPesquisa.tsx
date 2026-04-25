import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Languages, Zap, BookOpen, Copy, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCEAChunks } from '@/hooks/useCEAData';

interface WordResult {
  word: string;
  transliteration: string;
  strongs: string;
  language: 'grego' | 'hebraico';
  definition: string;
  morphology: {
    category: string;
    lexicalForm: string;
    tense?: string;
    voice?: string;
    mood?: string;
    person?: string;
    number?: string;
    root?: string;
    occurrences: number;
  };
  insight: string;
  versions: { name: string; text: string }[];
}

const SAMPLE_RESULT: WordResult = {
  word: 'σπλαγχνίζομαι',
  transliteration: 'splanchnízomai',
  strongs: 'G4697',
  language: 'grego',
  definition: 'Ser movido de compaixão nas entranhas; sentir piedade visceral.',
  morphology: {
    category: 'Verbo',
    lexicalForm: 'σπλαγχνίζομαι',
    tense: 'Aoristo',
    voice: 'Passivo (Depoente)',
    mood: 'Indicativo',
    person: '3ª pessoa',
    number: 'Singular',
    root: 'σπλάγχνα (entranhas)',
    occurrences: 12,
  },
  insight: 'Este verbo descreve uma emoção profunda e visceral — literalmente "ser movido nas entranhas". No mundo greco-romano, as entranhas (σπλάγχνα) eram consideradas a sede das emoções mais profundas. Jesus demonstrou esse tipo de compaixão ao ver multidões, curar enfermos e perdoar pecadores.',
  versions: [
    { name: 'NVI', text: 'Teve compaixão dele' },
    { name: 'ARA', text: 'Compadeceu-se dele' },
    { name: 'NAA', text: 'Ficou com compaixão dele' },
    { name: 'KJV', text: 'Was moved with compassion' },
  ],
};

export default function CEAPesquisa() {
  const navigate = useNavigate();
  const { chunks, loading, searchChunks } = useCEAChunks();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<WordResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    // Search for the word in RAG
    await searchChunks(query, undefined, 5);
    // For demo, show the sample result
    setResult(SAMPLE_RESULT);
    setSearching(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/estudos')} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pesquisa do Original</h1>
          <p className="text-sm text-muted-foreground">Grego • Hebraico • Aramaico — Análise morfológica e teológica</p>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Languages className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Digite uma palavra em grego, hebraico ou português..."
              className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-xl text-sm font-medium text-primary-foreground transition-colors flex items-center gap-2 shadow-sm"
          >
            {searching ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
            Pesquisar
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          {['ágape', 'logos', 'pneuma', 'chesed', 'shalom', 'σπλαγχνίζομαι'].map(term => (
            <button
              key={term}
              type="button"
              onClick={() => { setQuery(term); }}
              className="px-3 py-1 bg-muted text-muted-foreground rounded-lg text-xs hover:bg-muted/80 transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      </form>

      {/* Result */}
      {result && (
        <div className="space-y-6">
          {/* Word Display */}
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-4xl md:text-5xl font-bold text-foreground mb-2" style={{ fontFamily: "'Noto Serif', serif" }}>
                  {result.word}
                </p>
                <p className="text-lg text-primary font-medium italic">{result.transliteration}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">{result.strongs}</Badge>
                <Badge variant="outline" className="capitalize">{result.language}</Badge>
                <button
                  onClick={() => handleCopy(`${result.word} (${result.transliteration}) — ${result.strongs}: ${result.definition}`)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  title="Copiar"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
            </div>
            <p className="text-base text-foreground leading-relaxed">{result.definition}</p>
          </div>

          {/* Morphology Table */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h3 className="text-sm font-semibold text-foreground">Análise Morfológica</h3>
            </div>
            <div className="divide-y divide-border">
              {[
                ['Categoria', result.morphology.category],
                ['Forma Lexical', result.morphology.lexicalForm],
                ['Tempo', result.morphology.tense],
                ['Voz', result.morphology.voice],
                ['Modo', result.morphology.mood],
                ['Pessoa/Número', `${result.morphology.person} ${result.morphology.number}`],
                ['Raiz', result.morphology.root],
                ['Ocorrências no NT', `${result.morphology.occurrences}x`],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={String(label)} className="flex items-center px-6 py-3">
                  <span className="text-xs text-muted-foreground w-40 shrink-0">{label}</span>
                  <span className="text-sm text-foreground font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Theological Insight */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-50/50 p-6">
            <h3 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Insight Teológico
            </h3>
            <p className="text-sm text-amber-900 leading-relaxed">{result.insight}</p>
          </div>

          {/* Version Comparison */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h3 className="text-sm font-semibold text-foreground">Comparação de Versões</h3>
            </div>
            <div className="divide-y divide-border">
              {result.versions.map(v => (
                <div key={v.name} className="flex items-center px-6 py-3">
                  <Badge variant="outline" className="text-[10px] w-12 justify-center shrink-0">{v.name}</Badge>
                  <span className="text-sm text-foreground ml-4">"{v.text}"</span>
                </div>
              ))}
            </div>
          </div>

          {/* RAG Chunks */}
          {chunks.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Referências nos materiais do CEA</h3>
              <div className="space-y-3">
                {chunks.map((chunk, i) => (
                  <div key={i} className="p-3 bg-muted/30 rounded-lg text-sm text-foreground leading-relaxed">
                    {String((chunk as Record<string, unknown>).content || '')}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!result && !searching && (
        <div className="text-center py-16">
          <Languages className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Digite uma palavra para iniciar a pesquisa</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Suporte para grego, hebraico e aramaico</p>
        </div>
      )}
    </div>
  );
}
