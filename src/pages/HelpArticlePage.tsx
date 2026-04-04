import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { getFullArticle, getCategoryForTool, helpCategories } from '@/data/help-center-data';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight, ExternalLink, Lightbulb, AlertTriangle, Zap, Target, Star, Users } from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  back: { PT: 'Voltar à Central de Ajuda', EN: 'Back to Help Center', ES: 'Volver al Centro de Ayuda' },
  useTool: { PT: 'Usar esta ferramenta', EN: 'Use this tool', ES: 'Usar esta herramienta' },
  related: { PT: 'Ferramentas relacionadas', EN: 'Related tools', ES: 'Herramientas relacionadas' },
  backCta: { PT: 'Voltar para a Central', EN: 'Back to Help Center', ES: 'Volver al Centro' },
  notFound: { PT: 'Artigo não encontrado.', EN: 'Article not found.', ES: 'Artículo no encontrado.' },
};

const summaryIcons = [Target, Star, Users];

export default function HelpArticlePage() {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const article = toolId ? getFullArticle(toolId) : undefined;
  const category = toolId ? getCategoryForTool(toolId) : undefined;

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <p className="text-muted-foreground">{labels.notFound[lang]}</p>
        <Button variant="ghost" onClick={() => navigate('/ajuda')} className="mt-4 gap-2">
          <ArrowLeft className="h-4 w-4" />
          {labels.back[lang]}
        </Button>
      </div>
    );
  }

  const Icon = article.icon;

  const allTools = helpCategories.flatMap(c => c.tools);
  const relatedTools = article.relatedTools
    .map(id => allTools.find(t => t.id === id))
    .filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-6">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-1.5 text-xs text-[hsl(220,10%,55%)] flex-wrap">
        <button onClick={() => navigate('/ajuda')} className="hover:text-[hsl(35,45%,45%)] transition-colors">
          {lang === 'EN' ? 'Help Center' : lang === 'ES' ? 'Centro de Ayuda' : 'Central de Ajuda'}
        </button>
        <ChevronRight className="h-3 w-3" />
        {category && (
          <>
            <span>{category.label[lang]}</span>
            <ChevronRight className="h-3 w-3" />
          </>
        )}
        <span className="font-semibold text-[hsl(220,15%,30%)]">{article.title[lang]}</span>
      </div>

      {/* ── Back + Actions ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/ajuda')} className="text-[hsl(24,30%,30%)] hover:text-[hsl(24,30%,15%)] gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          {labels.back[lang]}
        </Button>
        {article.ctaRoute && (
          <Button
            onClick={() => navigate(article.ctaRoute!)}
            size="sm"
            className="bg-gradient-to-r from-[hsl(28,45%,32%)] to-[hsl(25,40%,26%)] hover:from-[hsl(28,45%,38%)] hover:to-[hsl(25,40%,32%)] text-white gap-2 rounded-xl"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {labels.useTool[lang]}
          </Button>
        )}
      </div>

      {/* ── Hero Header ── */}
      <section className="rounded-2xl border border-[hsl(30,15%,88%)] bg-white p-8 sm:p-10 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(35,40%,75%)] to-transparent" />
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[hsl(35,35%,93%)] flex items-center justify-center shrink-0 border border-[hsl(35,25%,85%)]">
            <Icon className="h-8 w-8 text-[hsl(35,45%,45%)]" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[hsl(220,15%,15%)] tracking-tight">
              {article.title[lang]}
            </h1>
            <p className="text-base italic text-[hsl(35,40%,45%)] mt-1 font-display">
              {article.subtitle[lang]}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-[hsl(30,15%,92%)]">
          <p className="text-[15px] leading-[1.8] text-[hsl(220,10%,35%)]">{article.heroSummary[lang]}</p>
          {article.heroBullets.length > 0 && (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {article.heroBullets.map((bullet, i) => (
                <div key={i} className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[hsl(40,30%,97%)] border border-[hsl(30,15%,92%)]">
                  <Zap className="h-3.5 w-3.5 text-[hsl(35,50%,50%)] shrink-0" />
                  <span className="text-xs font-medium text-[hsl(220,10%,30%)]">{bullet[lang]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Quick Summary 3-Card Block ── */}
      {article.quickSummary && article.quickSummary.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {article.quickSummary.map((card, i) => {
            const SummaryIcon = summaryIcons[i] || Target;
            return (
              <div key={i} className="rounded-2xl border border-[hsl(30,15%,88%)] bg-white p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[hsl(35,35%,93%)] flex items-center justify-center border border-[hsl(35,25%,85%)]">
                    <SummaryIcon className="h-4 w-4 text-[hsl(35,45%,45%)]" />
                  </div>
                  <h3 className="text-sm font-bold text-[hsl(220,15%,20%)]">{card.label[lang]}</h3>
                </div>
                <p className="text-xs leading-relaxed text-[hsl(220,10%,40%)]">{card.content[lang]}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Article Sections ── */}
      {article.sections.map((section) => (
        <section
          key={section.id}
          className={`rounded-2xl border p-6 sm:p-8 ${
            section.type === 'tip'
              ? 'border-emerald-200 bg-emerald-50/50'
              : section.type === 'warning'
                ? 'border-amber-200 bg-amber-50/50'
                : 'border-[hsl(30,15%,88%)] bg-white'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            {section.type === 'tip' ? (
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center border border-emerald-200">
                <Lightbulb className="h-4.5 w-4.5 text-emerald-600" />
              </div>
            ) : section.type === 'warning' ? (
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-600" />
              </div>
            ) : (
              <span className="text-xl">{section.emoji}</span>
            )}
            <h2 className={`text-lg font-bold ${
              section.type === 'tip' ? 'text-emerald-800' :
              section.type === 'warning' ? 'text-amber-800' :
              'text-[hsl(220,15%,20%)]'
            }`}>
              {section.heading[lang]}
            </h2>
          </div>

          <div className="pl-0 sm:pl-[44px]">
            {section.type === 'steps' ? (
              <div className="space-y-3">
                {section.content[lang].split('\n').filter(Boolean).map((line, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[hsl(35,35%,90%)] flex items-center justify-center shrink-0 text-xs font-bold text-[hsl(35,45%,40%)] border border-[hsl(35,25%,82%)]">
                      {i + 1}
                    </span>
                    <p className="text-sm text-[hsl(220,10%,35%)] leading-relaxed pt-0.5">{line.replace(/^\d+\.\s*/, '')}</p>
                  </div>
                ))}
              </div>
            ) : section.type === 'list' ? (
              <div className="space-y-2">
                {section.content[lang].split('\n').filter(Boolean).map((line, i) => (
                  <div key={i} className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg bg-[hsl(40,30%,97%)] border border-[hsl(30,15%,93%)]">
                    <Zap className="h-3 w-3 text-[hsl(35,50%,50%)] shrink-0 mt-0.5" />
                    <span className="text-sm text-[hsl(220,10%,30%)]">{line.replace(/^[•\-]\s*/, '')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[15px] leading-[1.85] text-[hsl(220,10%,35%)] whitespace-pre-line">
                {section.content[lang].split('\n').map((line, i) => {
                  if (line.startsWith('•') || line.startsWith('-')) {
                    return (
                      <div key={i} className="flex items-start gap-2 mb-1.5">
                        <span className="text-[hsl(35,50%,50%)] mt-1">•</span>
                        <span>{line.replace(/^[•\-]\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1')}</span>
                      </div>
                    );
                  }
                  return <p key={i} className={line.trim() === '' ? 'h-3' : 'mb-2'}>{line}</p>;
                })}
              </div>
            )}
          </div>
        </section>
      ))}

      {/* ── Related Tools ── */}
      {relatedTools.length > 0 && (
        <section className="rounded-2xl border border-[hsl(30,15%,88%)] bg-[hsl(35,30%,96%)] p-6 sm:p-8">
          <h2 className="text-lg font-bold text-[hsl(220,15%,20%)] mb-4 flex items-center gap-2">
            🔗 {labels.related[lang]}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {relatedTools.map(tool => {
              if (!tool) return null;
              const ToolIcon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => navigate(`/ajuda/${tool.id}`)}
                  className="group flex items-center gap-3 p-4 rounded-xl bg-white border border-[hsl(30,15%,90%)] hover:border-[hsl(35,30%,75%)] hover:shadow-sm transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-[hsl(35,35%,93%)] flex items-center justify-center border border-[hsl(35,25%,85%)]">
                    <ToolIcon className="h-4 w-4 text-[hsl(35,45%,45%)]" />
                  </div>
                  <span className="text-sm font-semibold text-[hsl(220,15%,20%)] group-hover:text-[hsl(35,45%,40%)] transition-colors">{tool.name[lang]}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Final CTA ── */}
      <section className="rounded-2xl border border-[hsl(30,15%,88%)] bg-white p-8 text-center space-y-4">
        <p className="text-lg font-display font-bold text-[hsl(220,15%,20%)]">
          {lang === 'EN' ? 'Ready to create?' : lang === 'ES' ? '¿Listo para crear?' : 'Pronto para criar?'}
        </p>
        <p className="text-sm text-[hsl(220,10%,50%)] max-w-md mx-auto">
          {lang === 'EN' ? 'Open this tool and start generating high-quality content in seconds.' : lang === 'ES' ? 'Abre esta herramienta y empieza a generar contenido de alta calidad en segundos.' : 'Abra esta ferramenta e comece a gerar conteúdo de alta qualidade em segundos.'}
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {article.ctaRoute && (
            <Button
              onClick={() => navigate(article.ctaRoute!)}
              className="px-8 py-5 text-sm font-bold bg-gradient-to-r from-[hsl(28,45%,32%)] to-[hsl(25,40%,26%)] hover:from-[hsl(28,45%,38%)] hover:to-[hsl(25,40%,32%)] text-white gap-2 rounded-xl"
            >
              <Icon className="h-4 w-4" />
              {article.ctaLabel[lang]}
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate('/ajuda')} className="rounded-xl gap-2">
            <ArrowLeft className="h-4 w-4" />
            {labels.backCta[lang]}
          </Button>
        </div>
      </section>
    </div>
  );
}
