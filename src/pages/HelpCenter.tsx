import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { helpCategories } from '@/data/help-center-data';
import { BookOpen, Search, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type L = 'PT' | 'EN' | 'ES';

const pageLabels = {
  title: { PT: 'Central de Ajuda', EN: 'Help Center', ES: 'Centro de Ayuda' },
  subtitle: { PT: 'Entenda cada ferramenta e aprenda como usar a Living Word com profundidade.', EN: 'Understand each tool and learn how to use Living Word in depth.', ES: 'Entiende cada herramienta y aprende a usar Living Word con profundidad.' },
  search: { PT: 'Buscar ferramenta, recurso ou tipo de conteúdo...', EN: 'Search tool, feature or content type...', ES: 'Buscar herramienta, recurso o tipo de contenido...' },
  toolCount: { PT: 'ferramentas disponíveis', EN: 'tools available', ES: 'herramientas disponibles' },
};

const tagColors: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  violet: 'bg-violet-100 text-violet-700 border-violet-200',
  rose: 'bg-rose-100 text-rose-700 border-rose-200',
  sky: 'bg-sky-100 text-sky-700 border-sky-200',
};

export default function HelpCenter() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const totalTools = helpCategories.reduce((sum, c) => sum + c.tools.length, 0);

  const filteredCategories = helpCategories.map(cat => ({
    ...cat,
    tools: cat.tools.filter(t => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return t.name[lang].toLowerCase().includes(q) || t.description[lang].toLowerCase().includes(q);
    }),
  })).filter(cat => cat.tools.length > 0);

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-8">
      {/* ── Header ── */}
      <div className="relative rounded-2xl border border-[hsl(30,15%,88%)] bg-white p-8 sm:p-12 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(35,40%,75%)] to-transparent" />
        <div className="relative z-10">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[hsl(35,35%,93%)] flex items-center justify-center shrink-0 border border-[hsl(35,25%,85%)]">
              <BookOpen className="h-7 w-7 text-[hsl(35,45%,45%)]" />
            </div>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-[hsl(220,15%,15%)] tracking-tight flex items-center gap-3">
                {pageLabels.title[lang]}
                <Sparkles className="h-5 w-5 text-[hsl(35,50%,55%)]" />
              </h1>
              <p className="text-sm text-[hsl(220,10%,50%)] mt-1.5 max-w-xl leading-relaxed">
                {pageLabels.subtitle[lang]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[hsl(30,15%,90%)]">
            <span className="text-sm font-mono font-bold text-[hsl(35,45%,45%)]">{totalTools}</span>
            <span className="text-xs text-[hsl(220,10%,55%)] uppercase tracking-wider">{pageLabels.toolCount[lang]}</span>
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-[hsl(220,10%,55%)]" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={pageLabels.search[lang]}
          className="pl-11 h-12 rounded-xl border-[hsl(30,15%,88%)] bg-white text-[hsl(220,15%,20%)] placeholder:text-[hsl(220,10%,65%)] focus-visible:ring-[hsl(35,40%,70%)] text-sm"
        />
      </div>

      {/* ── Categories ── */}
      {filteredCategories.map(category => (
        <section key={category.id}>
          <div className="flex items-center gap-2.5 mb-4">
            <span className="text-xl">{category.emoji}</span>
            <h2 className="text-lg font-bold text-[hsl(220,15%,20%)]">{category.label[lang]}</h2>
            <Badge variant="outline" className="text-[10px] border-[hsl(35,25%,82%)] text-[hsl(220,10%,50%)] font-mono">
              {category.tools.length}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.tools.map(tool => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => navigate(`/ajuda/${tool.id}`)}
                  className="group text-left rounded-2xl border border-[hsl(30,15%,88%)] bg-white p-5 hover:border-[hsl(35,30%,75%)] hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[hsl(35,35%,93%)] flex items-center justify-center shrink-0 border border-[hsl(35,25%,85%)] group-hover:bg-[hsl(35,40%,88%)] transition-colors">
                      <Icon className="h-5 w-5 text-[hsl(35,45%,45%)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-[hsl(220,15%,20%)] truncate">{tool.name[lang]}</p>
                        {tool.tag && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${tagColors[tool.tagColor || 'emerald']}`}>
                            {tool.tag[lang]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[hsl(220,10%,50%)] leading-relaxed line-clamp-2">{tool.description[lang]}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {filteredCategories.length === 0 && (
        <div className="text-center py-16">
          <Search className="h-10 w-10 text-[hsl(220,10%,75%)] mx-auto mb-3" />
          <p className="text-sm text-[hsl(220,10%,55%)]">
            {lang === 'EN' ? 'No tools found for this search.' : lang === 'ES' ? 'No se encontraron herramientas.' : 'Nenhuma ferramenta encontrada para esta busca.'}
          </p>
        </div>
      )}
    </div>
  );
}
