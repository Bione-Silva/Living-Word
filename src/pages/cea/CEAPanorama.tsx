import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Library, ChevronRight, X, Mic, Palette, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCEAChunks, useCEAProgress } from '@/hooks/useCEAData';

const SECTIONS = [
  { key: 'all', label: 'Todos' },
  { key: 'pentateuco', label: 'Pentateuco' },
  { key: 'historicos', label: 'Históricos' },
  { key: 'poeticos', label: 'Poéticos' },
  { key: 'profetas-maiores', label: 'Profetas Maiores' },
  { key: 'profetas-menores', label: 'Profetas Menores' },
  { key: 'evangelhos', label: 'Evangelhos' },
  { key: 'paulinas', label: 'Epístolas Paulinas' },
  { key: 'gerais', label: 'Epístolas Gerais' },
  { key: 'apocalipse', label: 'Profecia' },
];

const BOOKS = [
  { id: 'genesis', name: 'Gênesis', abbr: 'Gn', author: 'Moisés', chapters: 50, testament: 'AT', section: 'pentateuco' },
  { id: 'exodo', name: 'Êxodo', abbr: 'Êx', author: 'Moisés', chapters: 40, testament: 'AT', section: 'pentateuco' },
  { id: 'levitico', name: 'Levítico', abbr: 'Lv', author: 'Moisés', chapters: 27, testament: 'AT', section: 'pentateuco' },
  { id: 'numeros', name: 'Números', abbr: 'Nm', author: 'Moisés', chapters: 36, testament: 'AT', section: 'pentateuco' },
  { id: 'deuteronomio', name: 'Deuteronômio', abbr: 'Dt', author: 'Moisés', chapters: 34, testament: 'AT', section: 'pentateuco' },
  { id: 'josue', name: 'Josué', abbr: 'Js', author: 'Josué', chapters: 24, testament: 'AT', section: 'historicos' },
  { id: 'juizes', name: 'Juízes', abbr: 'Jz', author: 'Samuel', chapters: 21, testament: 'AT', section: 'historicos' },
  { id: 'rute', name: 'Rute', abbr: 'Rt', author: 'Samuel', chapters: 4, testament: 'AT', section: 'historicos' },
  { id: 'salmos', name: 'Salmos', abbr: 'Sl', author: 'Davi e outros', chapters: 150, testament: 'AT', section: 'poeticos' },
  { id: 'proverbios', name: 'Provérbios', abbr: 'Pv', author: 'Salomão', chapters: 31, testament: 'AT', section: 'poeticos' },
  { id: 'eclesiastes', name: 'Eclesiastes', abbr: 'Ec', author: 'Salomão', chapters: 12, testament: 'AT', section: 'poeticos' },
  { id: 'cantares', name: 'Cantares', abbr: 'Ct', author: 'Salomão', chapters: 8, testament: 'AT', section: 'poeticos' },
  { id: 'isaias', name: 'Isaías', abbr: 'Is', author: 'Isaías', chapters: 66, testament: 'AT', section: 'profetas-maiores' },
  { id: 'jeremias', name: 'Jeremias', abbr: 'Jr', author: 'Jeremias', chapters: 52, testament: 'AT', section: 'profetas-maiores' },
  { id: 'ezequiel', name: 'Ezequiel', abbr: 'Ez', author: 'Ezequiel', chapters: 48, testament: 'AT', section: 'profetas-maiores' },
  { id: 'daniel', name: 'Daniel', abbr: 'Dn', author: 'Daniel', chapters: 12, testament: 'AT', section: 'profetas-maiores' },
  { id: 'oseias', name: 'Oséias', abbr: 'Os', author: 'Oséias', chapters: 14, testament: 'AT', section: 'profetas-menores' },
  { id: 'jonas', name: 'Jonas', abbr: 'Jn', author: 'Jonas', chapters: 4, testament: 'AT', section: 'profetas-menores' },
  { id: 'mateus', name: 'Mateus', abbr: 'Mt', author: 'Mateus', chapters: 28, testament: 'NT', section: 'evangelhos' },
  { id: 'marcos', name: 'Marcos', abbr: 'Mc', author: 'Marcos', chapters: 16, testament: 'NT', section: 'evangelhos' },
  { id: 'lucas', name: 'Lucas', abbr: 'Lc', author: 'Lucas', chapters: 24, testament: 'NT', section: 'evangelhos' },
  { id: 'joao', name: 'João', abbr: 'Jo', author: 'João', chapters: 21, testament: 'NT', section: 'evangelhos' },
  { id: 'atos', name: 'Atos', abbr: 'At', author: 'Lucas', chapters: 28, testament: 'NT', section: 'historicos' },
  { id: 'romanos', name: 'Romanos', abbr: 'Rm', author: 'Paulo', chapters: 16, testament: 'NT', section: 'paulinas' },
  { id: '1corintios', name: '1 Coríntios', abbr: '1Co', author: 'Paulo', chapters: 16, testament: 'NT', section: 'paulinas' },
  { id: 'galatas', name: 'Gálatas', abbr: 'Gl', author: 'Paulo', chapters: 6, testament: 'NT', section: 'paulinas' },
  { id: 'efesios', name: 'Efésios', abbr: 'Ef', author: 'Paulo', chapters: 6, testament: 'NT', section: 'paulinas' },
  { id: 'filipenses', name: 'Filipenses', abbr: 'Fp', author: 'Paulo', chapters: 4, testament: 'NT', section: 'paulinas' },
  { id: 'hebreus', name: 'Hebreus', abbr: 'Hb', author: 'Desconhecido', chapters: 13, testament: 'NT', section: 'gerais' },
  { id: 'tiago', name: 'Tiago', abbr: 'Tg', author: 'Tiago', chapters: 5, testament: 'NT', section: 'gerais' },
  { id: '1pedro', name: '1 Pedro', abbr: '1Pe', author: 'Pedro', chapters: 5, testament: 'NT', section: 'gerais' },
  { id: 'apocalipse', name: 'Apocalipse', abbr: 'Ap', author: 'João', chapters: 22, testament: 'NT', section: 'apocalipse' },
];

export default function CEAPanorama() {
  const navigate = useNavigate();
  const { chunks, loading: chunksLoading, searchChunks } = useCEAChunks();
  const { getModuleProgress } = useCEAProgress();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<typeof BOOKS[0] | null>(null);

  const progress = getModuleProgress('panorama');

  const filtered = useMemo(() => {
    let list = BOOKS;
    if (filter !== 'all') list = list.filter(b => b.section === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(b => b.name.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
    }
    return list;
  }, [filter, searchQuery]);

  const handleSelect = (book: typeof BOOKS[0]) => {
    setSelected(book);
    searchChunks(book.name + ' panorama visão geral', 'panorama', 5);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/estudos')} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panorama Bíblico</h1>
          <p className="text-sm text-muted-foreground">66 livros da Bíblia — visão completa do cânon</p>
        </div>
        {progress > 0 && <Badge variant="outline" className="ml-auto text-xs">{progress}% concluído</Badge>}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {SECTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === s.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar livro..."
            className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      <div className="flex gap-6">
        <div className={`flex-1 min-w-0 transition-all ${selected ? 'max-w-md' : ''}`}>
          <p className="text-xs text-muted-foreground mb-3">{filtered.length} livro{filtered.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filtered.map(b => (
              <button
                key={b.id}
                onClick={() => handleSelect(b)}
                className={`text-left p-4 rounded-xl border transition-all hover:shadow-sm ${
                  selected?.id === b.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/30 bg-card'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold text-xs">
                    {b.abbr}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">{b.name}</h3>
                    <p className="text-xs text-muted-foreground">{b.author} • {b.chapters} cap.</p>
                  </div>
                  <Badge variant="outline" className="text-[9px] shrink-0">{b.testament}</Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selected && (
          <div className="hidden lg:block w-[480px] shrink-0 sticky top-4 self-start max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="rounded-2xl border border-border bg-card shadow-lg">
              <div className="p-5 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-14 h-14 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold text-lg">
                    {selected.abbr}
                  </div>
                  <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-foreground">{selected.name}</h2>
                <p className="text-sm text-primary font-medium">Autor: {selected.author}</p>
                <p className="text-xs text-muted-foreground mt-1">{selected.chapters} capítulos • {selected.testament}</p>
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
                    Visão panorâmica completa será carregada do banco de dados.
                  </p>
                )}
              </div>

              <div className="p-4 border-t border-border flex gap-2">
                <button onClick={() => navigate(`/sermoes?tema=${selected.id}`)} className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/15 transition-colors">
                  <Mic className="w-3.5 h-3.5" /> Sermão
                </button>
                <button onClick={() => navigate(`/bible`)} className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/15 transition-colors">
                  <BookOpen className="w-3.5 h-3.5" /> Ler na Bíblia
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
