import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, BookOpen, Users, Library, Search, Brain, Trophy, ArrowRight, Star, Clock, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProgressItem {
  modulo: string;
  status: string;
  percentual: number;
}

interface Module {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  href: string;
  color: string;
  bg: string;
  count: string;
  description: string;
}

const MODULES: Module[] = [
  {
    id: 'parabolas',
    title: 'Parábolas de Jesus',
    subtitle: '40 parábolas completas',
    icon: BookOpen,
    href: '/estudos/parabolas',
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-500/10 border-amber-500/30',
    count: '40',
    description: 'Contexto histórico do século I, análise do grego original e aplicação pastoral'
  },
  {
    id: 'personagens',
    title: 'Personagens Bíblicos',
    subtitle: '200 perfis biográficos',
    icon: Users,
    href: '/estudos/personagens',
    color: 'from-blue-500 to-cyan-600',
    bg: 'bg-blue-500/10 border-blue-500/30',
    count: '200',
    description: 'Biografia, teologia e lições de cada personagem do Gênesis ao Apocalipse'
  },
  {
    id: 'panorama',
    title: 'Panorama Bíblico',
    subtitle: '66 livros da Bíblia',
    icon: Library,
    href: '/estudos/livros',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    count: '66',
    description: 'Autor, data, propósito e mensagem central de cada livro do cânon'
  },
  {
    id: 'pesquisa',
    title: 'Pesquisa do Original',
    subtitle: 'Grego • Hebraico • Aramaico',
    icon: Search,
    href: '/estudos/pesquisa',
    color: 'from-purple-500 to-violet-600',
    bg: 'bg-purple-500/10 border-purple-500/30',
    count: '∞',
    description: 'Análise morfológica, Strong\'s Concordance e insight teológico do texto original'
  },
  {
    id: 'quiz',
    title: 'Quiz Bíblico',
    subtitle: '250+ perguntas gamificadas',
    icon: Brain,
    href: '/estudos/quiz',
    color: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-500/10 border-rose-500/30',
    count: '250+',
    description: 'Teste seu conhecimento com perguntas de múltipla escolha, score e conquistas'
  }
];

export default function CEAHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('lw_cea_progress')
      .select('modulo, status, percentual')
      .eq('user_id', user.id)
      .then(({ data }) => { if (data) setProgress(data); });
  }, [user]);

  const getModuleProgress = (modulo: string) => {
    const items = progress.filter(p => p.modulo === modulo);
    if (items.length === 0) return 0;
    const concluded = items.filter(i => i.status === 'concluido').length;
    return Math.round((concluded / items.length) * 100);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('cea-search', {
        body: { query: searchQuery, limit: 6 }
      });
      if (error) throw error;
      setSearchResults(data.results || []);
    } catch (err) {
      console.error('Erro na busca:', err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0A1E] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-[#2D1F6E]">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30">
              <GraduationCap className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              NOVO
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mb-3" style={{ fontFamily: "'Crimson Pro', serif" }}>
            Centro de Estudos Avançados
          </h1>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl">
            Teologia de seminário. Profundidade real.
          </p>

          {/* Stats rápidos */}
          <div className="flex flex-wrap gap-4 mb-8">
            {[
              { icon: BookOpen, label: '40 Parábolas', value: '40' },
              { icon: Users, label: 'Personagens', value: '200' },
              { icon: Library, label: 'Livros do Cânon', value: '66' },
              { icon: Brain, label: 'Perguntas de Quiz', value: '250+' },
            ].map(stat => (
              <div key={stat.label} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                <stat.icon className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-white">{stat.value}</span>
                <span className="text-xs text-gray-400">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Busca semântica unificada */}
          <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar parábolas, personagens, livros ou temas..."
                className="w-full bg-[#1A1040] border border-[#2D1F6E] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-5 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              {searching ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
              Buscar
            </button>
          </form>

          {/* Resultados da busca */}
          {searchResults.length > 0 && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
              {searchResults.map((result: Record<string, unknown>, i) => (
                <button
                  key={i}
                  onClick={() => navigate(`/estudos/${result.tipo === 'parabola' ? 'parabolas' : result.tipo === 'personagem' ? 'personagens' : 'livros'}/${result.id}`)}
                  className="text-left p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 capitalize">{String(result.tipo)}</span>
                    <span className="text-xs text-gray-500">{Math.round((result.similarity as number) * 100)}% relevante</span>
                  </div>
                  <p className="text-sm font-medium text-white">{String(result.titulo || result.nome)}</p>
                  {result.referencia && <p className="text-xs text-gray-400 mt-0.5">{String(result.referencia)}</p>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Módulos */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-xl font-semibold text-gray-200 mb-6">Módulos de Estudo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map(mod => {
            const prog = getModuleProgress(mod.id);
            return (
              <button
                key={mod.id}
                onClick={() => navigate(mod.href)}
                className={`group text-left p-6 ${mod.bg} border rounded-2xl hover:border-opacity-60 transition-all duration-200 hover:scale-[1.02]`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${mod.color} bg-opacity-10`}>
                    <mod.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-bold text-white">{mod.count}</span>
                    {prog > 0 && (
                      <span className="text-xs text-gray-400">{prog}% concluído</span>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-white mb-1">{mod.title}</h3>
                <p className="text-xs text-gray-400 mb-3">{mod.subtitle}</p>
                <p className="text-sm text-gray-300 leading-relaxed">{mod.description}</p>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-400 group-hover:text-white transition-colors">
                  <span>Estudar agora</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue de onde parou */}
        {progress.filter(p => p.status === 'em_andamento').length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Continue de onde parou
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {progress.filter(p => p.status === 'em_andamento').slice(0, 3).map((item, i) => (
                <div key={i} className="p-4 bg-[#1A1040] border border-[#2D1F6E] rounded-xl">
                  <p className="text-sm font-medium text-white capitalize">{item.modulo}</p>
                  <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full"
                      style={{ width: `${item.percentual}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{item.percentual}% concluído</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conquistas recentes */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Progresso & Conquistas
          </h2>
          <button
            onClick={() => navigate('/estudos/meu-progresso')}
            className="group inline-flex items-center gap-2 px-5 py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-300 text-sm font-medium transition-colors"
          >
            <Star className="w-4 h-4" />
            Ver meu painel de progresso
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
