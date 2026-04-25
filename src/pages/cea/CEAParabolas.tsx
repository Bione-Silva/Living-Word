import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Search, ArrowLeft, X, ChevronRight, BookMarked, Mic, Palette,
  Users as UsersIcon, Gamepad2, FileText, Languages, Copy, ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCEAChunks, useCEAProgress } from '@/hooks/useCEAData';

/* ─── Static data for 40 parables ─── */
const PARABLE_CATEGORIES = [
  { key: 'all', label: 'Todas' },
  { key: 'perdao', label: 'Perdão & Graça' },
  { key: 'reino', label: 'O Reino' },
  { key: 'missao', label: 'Missão' },
  { key: 'escatologia', label: 'Escatologia' },
  { key: 'oracao', label: 'Oração' },
];

const PARABLES = [
  { id: 'semeador', title: 'O Semeador', ref: 'Mateus 13:1-23', cat: 'reino', testament: 'sinótico' },
  { id: 'joio-trigo', title: 'O Joio e o Trigo', ref: 'Mateus 13:24-30', cat: 'escatologia', testament: 'sinótico' },
  { id: 'grao-mostarda', title: 'O Grão de Mostarda', ref: 'Mateus 13:31-32', cat: 'reino', testament: 'sinótico' },
  { id: 'fermento', title: 'O Fermento', ref: 'Mateus 13:33', cat: 'reino', testament: 'sinótico' },
  { id: 'tesouro-escondido', title: 'O Tesouro Escondido', ref: 'Mateus 13:44', cat: 'reino', testament: 'sinótico' },
  { id: 'perola', title: 'A Pérola de Grande Valor', ref: 'Mateus 13:45-46', cat: 'reino', testament: 'sinótico' },
  { id: 'rede', title: 'A Rede', ref: 'Mateus 13:47-50', cat: 'escatologia', testament: 'sinótico' },
  { id: 'ovelha-perdida', title: 'A Ovelha Perdida', ref: 'Lucas 15:1-7', cat: 'perdao', testament: 'lucas' },
  { id: 'dracma-perdida', title: 'A Dracma Perdida', ref: 'Lucas 15:8-10', cat: 'perdao', testament: 'lucas' },
  { id: 'filho-prodigo', title: 'O Filho Pródigo', ref: 'Lucas 15:11-32', cat: 'perdao', testament: 'lucas' },
  { id: 'bom-samaritano', title: 'O Bom Samaritano', ref: 'Lucas 10:25-37', cat: 'missao', testament: 'lucas' },
  { id: 'rico-lazaro', title: 'O Rico e Lázaro', ref: 'Lucas 16:19-31', cat: 'escatologia', testament: 'lucas' },
  { id: 'fariseu-publicano', title: 'O Fariseu e o Publicano', ref: 'Lucas 18:9-14', cat: 'oracao', testament: 'lucas' },
  { id: 'credor-incompassivo', title: 'O Credor Incompassivo', ref: 'Mateus 18:23-35', cat: 'perdao', testament: 'sinótico' },
  { id: 'talentos', title: 'Os Talentos', ref: 'Mateus 25:14-30', cat: 'escatologia', testament: 'sinótico' },
  { id: 'dez-virgens', title: 'As Dez Virgens', ref: 'Mateus 25:1-13', cat: 'escatologia', testament: 'sinótico' },
  { id: 'trabalhadores-vinha', title: 'Trabalhadores da Vinha', ref: 'Mateus 20:1-16', cat: 'perdao', testament: 'sinótico' },
  { id: 'dois-filhos', title: 'Os Dois Filhos', ref: 'Mateus 21:28-32', cat: 'missao', testament: 'sinótico' },
  { id: 'lavradores-maus', title: 'Os Lavradores Maus', ref: 'Mateus 21:33-46', cat: 'escatologia', testament: 'sinótico' },
  { id: 'festa-nupcial', title: 'A Festa Nupcial', ref: 'Mateus 22:1-14', cat: 'escatologia', testament: 'sinótico' },
  { id: 'amigo-importuno', title: 'O Amigo Importuno', ref: 'Lucas 11:5-13', cat: 'oracao', testament: 'lucas' },
  { id: 'juiz-iniquo', title: 'O Juiz Iníquo', ref: 'Lucas 18:1-8', cat: 'oracao', testament: 'lucas' },
  { id: 'rico-insensato', title: 'O Rico Insensato', ref: 'Lucas 12:13-21', cat: 'reino', testament: 'lucas' },
  { id: 'administrador-infiel', title: 'O Administrador Infiel', ref: 'Lucas 16:1-13', cat: 'missao', testament: 'lucas' },
  { id: 'figueira-esteril', title: 'A Figueira Estéril', ref: 'Lucas 13:6-9', cat: 'escatologia', testament: 'lucas' },
  { id: 'grande-ceia', title: 'A Grande Ceia', ref: 'Lucas 14:15-24', cat: 'missao', testament: 'lucas' },
  { id: 'torre-rei', title: 'A Torre e o Rei', ref: 'Lucas 14:28-33', cat: 'missao', testament: 'lucas' },
  { id: 'servo-vigilante', title: 'O Servo Vigilante', ref: 'Lucas 12:35-48', cat: 'escatologia', testament: 'lucas' },
  { id: 'minas', title: 'As Minas', ref: 'Lucas 19:11-27', cat: 'escatologia', testament: 'lucas' },
  { id: 'porta-estreita', title: 'A Porta Estreita', ref: 'Lucas 13:22-30', cat: 'reino', testament: 'lucas' },
  { id: 'casa-rocha', title: 'A Casa na Rocha', ref: 'Mateus 7:24-27', cat: 'reino', testament: 'sinótico' },
  { id: 'candeeiro', title: 'O Candeeiro', ref: 'Marcos 4:21-25', cat: 'missao', testament: 'sinótico' },
  { id: 'semente-cresce', title: 'A Semente que Cresce', ref: 'Marcos 4:26-29', cat: 'reino', testament: 'sinótico' },
  { id: 'remendo-novo', title: 'O Remendo Novo', ref: 'Marcos 2:21', cat: 'reino', testament: 'sinótico' },
  { id: 'vinho-novo', title: 'Vinho Novo em Odres Velhos', ref: 'Marcos 2:22', cat: 'reino', testament: 'sinótico' },
  { id: 'ovelhas-cabritos', title: 'Ovelhas e Cabritos', ref: 'Mateus 25:31-46', cat: 'escatologia', testament: 'sinótico' },
  { id: 'sal-terra', title: 'O Sal da Terra', ref: 'Mateus 5:13', cat: 'missao', testament: 'sinótico' },
  { id: 'videira-ramos', title: 'A Videira e os Ramos', ref: 'João 15:1-8', cat: 'reino', testament: 'joão' },
  { id: 'bom-pastor', title: 'O Bom Pastor', ref: 'João 10:1-18', cat: 'perdao', testament: 'joão' },
  { id: 'grao-trigo', title: 'O Grão de Trigo', ref: 'João 12:24', cat: 'missao', testament: 'joão' },
];

/* ─── Deep Panel Tabs ─── */
const TABS = [
  { key: 'contexto', label: 'Contexto' },
  { key: 'original', label: 'Original' },
  { key: 'mensagem', label: 'Mensagem' },
  { key: 'aplicacao', label: 'Aplicação' },
  { key: 'recursos', label: 'Recursos' },
];

export default function CEAParabolas() {
  const navigate = useNavigate();
  const { chunks, loading: chunksLoading, searchChunks } = useCEAChunks();
  const { getModuleProgress } = useCEAProgress();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParable, setSelectedParable] = useState<typeof PARABLES[0] | null>(null);
  const [activeTab, setActiveTab] = useState('contexto');

  const progress = getModuleProgress('parabolas');

  const filtered = useMemo(() => {
    let list = PARABLES;
    if (filter !== 'all') list = list.filter(p => p.cat === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.ref.toLowerCase().includes(q));
    }
    return list;
  }, [filter, searchQuery]);

  const handleSelect = (parable: typeof PARABLES[0]) => {
    setSelectedParable(parable);
    setActiveTab('contexto');
    searchChunks(parable.title + ' ' + parable.ref, 'parabolas', 5);
  };

  const closePanel = () => setSelectedParable(null);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/estudos')} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parábolas de Jesus</h1>
          <p className="text-sm text-muted-foreground">40 parábolas com análise exegética completa</p>
        </div>
        {progress > 0 && (
          <Badge variant="outline" className="ml-auto text-xs">{progress}% concluído</Badge>
        )}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {PARABLE_CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setFilter(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === cat.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
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
            placeholder="Buscar parábola..."
            className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Grid */}
        <div className={`flex-1 min-w-0 transition-all ${selectedParable ? 'max-w-md' : ''}`}>
          <p className="text-xs text-muted-foreground mb-3">{filtered.length} parábola{filtered.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 gap-2">
            {filtered.map(p => (
              <button
                key={p.id}
                onClick={() => handleSelect(p)}
                className={`text-left p-4 rounded-xl border transition-all hover:shadow-sm ${
                  selectedParable?.id === p.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/30 bg-card'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{p.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.ref}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] capitalize">{p.cat}</Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Deep Panel */}
        {selectedParable && (
          <div className="hidden lg:block w-[480px] shrink-0 sticky top-4 self-start max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="rounded-2xl border border-border bg-card shadow-lg">
              {/* Panel Header */}
              <div className="p-5 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">Parábola</Badge>
                  <button onClick={closePanel} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-foreground">{selectedParable.title}</h2>
                <p className="text-sm text-primary font-medium">{selectedParable.ref}</p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border">
                {TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-3 text-xs font-medium transition-colors border-b-2 ${
                      activeTab === tab.key
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
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
                    Selecione uma parábola para ver a análise exegética completa.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-border flex flex-wrap gap-2">
                <button onClick={() => navigate(`/sermoes?tema=${selectedParable.id}`)} className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/15 transition-colors">
                  <Mic className="w-3.5 h-3.5" /> Sermão
                </button>
                <button onClick={() => navigate(`/social-studio?tema=${selectedParable.id}`)} className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/15 transition-colors">
                  <Palette className="w-3.5 h-3.5" /> Carrossel
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 bg-muted text-muted-foreground rounded-lg text-xs font-medium hover:bg-muted/80 transition-colors">
                  <UsersIcon className="w-3.5 h-3.5" /> Grupo
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 bg-muted text-muted-foreground rounded-lg text-xs font-medium hover:bg-muted/80 transition-colors">
                  <Gamepad2 className="w-3.5 h-3.5" /> Quiz
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 bg-muted text-muted-foreground rounded-lg text-xs font-medium hover:bg-muted/80 transition-colors">
                  <FileText className="w-3.5 h-3.5" /> PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
