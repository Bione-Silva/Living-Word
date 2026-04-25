import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Users, ChevronRight, X, BookOpen, Mic, Palette } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCEAChunks, useCEAProgress } from '@/hooks/useCEAData';

const CATEGORIES = [
  { key: 'all', label: 'Todos' },
  { key: 'at', label: 'Antigo Testamento' },
  { key: 'nt', label: 'Novo Testamento' },
  { key: 'reis', label: 'Reis' },
  { key: 'profetas', label: 'Profetas' },
  { key: 'apostolos', label: 'Apóstolos' },
  { key: 'mulheres', label: 'Mulheres' },
];

const CHARACTERS = [
  { id: 'abraao', name: 'Abraão', role: 'Patriarca', period: '2000 a.C.', cat: 'at', tags: ['reis'] },
  { id: 'moises', name: 'Moisés', role: 'Legislador e Profeta', period: '1400 a.C.', cat: 'at', tags: ['profetas'] },
  { id: 'davi', name: 'Davi', role: 'Rei de Israel', period: '1010 a.C.', cat: 'at', tags: ['reis'] },
  { id: 'elias', name: 'Elias', role: 'Profeta', period: '870 a.C.', cat: 'at', tags: ['profetas'] },
  { id: 'isaias', name: 'Isaías', role: 'Profeta Maior', period: '740 a.C.', cat: 'at', tags: ['profetas'] },
  { id: 'daniel', name: 'Daniel', role: 'Profeta', period: '605 a.C.', cat: 'at', tags: ['profetas'] },
  { id: 'jose', name: 'José (AT)', role: 'Governador do Egito', period: '1800 a.C.', cat: 'at', tags: [] },
  { id: 'rute', name: 'Rute', role: 'Moabita fiel', period: '1100 a.C.', cat: 'at', tags: ['mulheres'] },
  { id: 'ester', name: 'Ester', role: 'Rainha da Pérsia', period: '480 a.C.', cat: 'at', tags: ['mulheres', 'reis'] },
  { id: 'salomao', name: 'Salomão', role: 'Rei Sábio', period: '970 a.C.', cat: 'at', tags: ['reis'] },
  { id: 'pedro', name: 'Pedro', role: 'Apóstolo', period: '30 d.C.', cat: 'nt', tags: ['apostolos'] },
  { id: 'paulo', name: 'Paulo', role: 'Apóstolo dos Gentios', period: '35 d.C.', cat: 'nt', tags: ['apostolos'] },
  { id: 'joao', name: 'João', role: 'Apóstolo Amado', period: '30 d.C.', cat: 'nt', tags: ['apostolos'] },
  { id: 'maria', name: 'Maria', role: 'Mãe de Jesus', period: '6 a.C.', cat: 'nt', tags: ['mulheres'] },
  { id: 'maria-madalena', name: 'Maria Madalena', role: 'Discípula', period: '30 d.C.', cat: 'nt', tags: ['mulheres'] },
  { id: 'tiago', name: 'Tiago', role: 'Irmão do Senhor', period: '30 d.C.', cat: 'nt', tags: ['apostolos'] },
  { id: 'barnabe', name: 'Barnabé', role: 'Filho da Consolação', period: '40 d.C.', cat: 'nt', tags: ['apostolos'] },
  { id: 'timoteo', name: 'Timóteo', role: 'Pastor e discípulo de Paulo', period: '50 d.C.', cat: 'nt', tags: ['apostolos'] },
  { id: 'josue', name: 'Josué', role: 'Conquistador', period: '1400 a.C.', cat: 'at', tags: [] },
  { id: 'samuel', name: 'Samuel', role: 'Juiz e Profeta', period: '1050 a.C.', cat: 'at', tags: ['profetas'] },
];

export default function CEAPersonagens() {
  const navigate = useNavigate();
  const { chunks, loading: chunksLoading, searchChunks } = useCEAChunks();
  const { getModuleProgress } = useCEAProgress();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<typeof CHARACTERS[0] | null>(null);

  const progress = getModuleProgress('personagens');

  const filtered = useMemo(() => {
    let list = CHARACTERS;
    if (filter === 'at') list = list.filter(c => c.cat === 'at');
    else if (filter === 'nt') list = list.filter(c => c.cat === 'nt');
    else if (filter !== 'all') list = list.filter(c => c.tags.includes(filter));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q));
    }
    return list;
  }, [filter, searchQuery]);

  const handleSelect = (char: typeof CHARACTERS[0]) => {
    setSelected(char);
    searchChunks(char.name + ' ' + char.role, 'personagens', 5);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/estudos')} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Personagens Bíblicos</h1>
          <p className="text-sm text-muted-foreground">200 perfis biográficos completos</p>
        </div>
        {progress > 0 && <Badge variant="outline" className="ml-auto text-xs">{progress}% concluído</Badge>}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setFilter(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === cat.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar personagem..."
            className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Grid */}
        <div className={`flex-1 min-w-0 transition-all ${selected ? 'max-w-md' : ''}`}>
          <p className="text-xs text-muted-foreground mb-3">{filtered.length} personagen{filtered.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 gap-2">
            {filtered.map(c => (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                className={`text-left p-4 rounded-xl border transition-all hover:shadow-sm ${
                  selected?.id === c.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/30 bg-card'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold text-sm">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{c.name}</h3>
                      <p className="text-xs text-muted-foreground">{c.role} • {c.period}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px]">{c.cat === 'at' ? 'AT' : 'NT'}</Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="hidden lg:block w-[480px] shrink-0 sticky top-4 self-start max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="rounded-2xl border border-border bg-card shadow-lg">
              <div className="p-5 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold text-xl">
                    {selected.name.charAt(0)}
                  </div>
                  <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-foreground">{selected.name}</h2>
                <p className="text-sm text-primary font-medium">{selected.role}</p>
                <p className="text-xs text-muted-foreground mt-1">Período: {selected.period}</p>
              </div>

              <div className="p-5">
                {chunksLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : chunks.length > 0 ? (
                  <div className="space-y-4">
                    {chunks.map((chunk, i) => (
                      <div key={i} className="text-sm text-foreground leading-relaxed">
                        <p>{String((chunk as Record<string, unknown>).content || '')}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Análise biográfica completa será carregada do banco de dados.
                  </p>
                )}
              </div>

              <div className="p-4 border-t border-border flex gap-2">
                <button onClick={() => navigate(`/sermoes?tema=${selected.id}`)} className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/15 transition-colors">
                  <Mic className="w-3.5 h-3.5" /> Sermão
                </button>
                <button onClick={() => navigate(`/social-studio?tema=${selected.id}`)} className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/15 transition-colors">
                  <Palette className="w-3.5 h-3.5" /> Carrossel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
