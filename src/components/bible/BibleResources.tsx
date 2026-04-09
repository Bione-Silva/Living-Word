import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Map, Clock, BookOpen, ChevronRight, Globe, Footprints, Building2, Cross, Scroll, Church } from 'lucide-react';
import type { L } from '@/lib/bible-data';

const labels = {
  title: { PT: 'Recursos de Estudo', EN: 'Study Resources', ES: 'Recursos de Estudio' },
  subtitle: { PT: 'Mapas, cronologia e contexto histórico', EN: 'Maps, timeline and historical context', ES: 'Mapas, cronología y contexto histórico' },
  maps: { PT: 'Mapas', EN: 'Maps', ES: 'Mapas' },
  timeline: { PT: 'Cronologia', EN: 'Timeline', ES: 'Cronología' },
  context: { PT: 'Contexto', EN: 'Context', ES: 'Contexto' },
  contextHelp: { PT: 'Toque em um livro para ver seu contexto histórico', EN: 'Tap a book to see its context', ES: 'Toca un libro para ver su contexto' },
  available: { PT: 'livros disponíveis', EN: 'books available', ES: 'libros disponibles' },
} satisfies Record<string, Record<L, string>>;

const mapItems = [
  { icon: Globe, title: 'Jardim do Éden e Mesopotâmia', desc: 'Contexto geográfico de Gênesis 1-11' },
  { icon: Footprints, title: 'Rota do Êxodo', desc: 'Caminho de Israel pelo deserto até Canaã' },
  { icon: Building2, title: 'Terra Prometida Dividida', desc: 'As 12 tribos de Israel e suas porções' },
  { icon: Cross, title: 'Israel no Tempo de Jesus', desc: 'Galileia, Samaria, Judeia e região' },
  { icon: Scroll, title: 'Viagens Missionárias de Paulo', desc: '3 viagens pelo Mediterrâneo (Atos 13-21)' },
  { icon: Church, title: 'Sete Igrejas do Apocalipse', desc: 'Localização das igrejas de Apocalipse 2-3' },
];

const timelineItems = [
  { year: '~4000 AC', title: 'Criação do mundo', ref: 'Gênesis 1-2' },
  { year: '~2350 AC', title: 'O Dilúvio de Noé', ref: 'Gênesis 6-9' },
  { year: '~2000 AC', title: 'Chamado de Abraão', ref: 'Gênesis 12' },
  { year: '~1700 AC', title: 'José no Egito', ref: 'Gênesis 37-50' },
  { year: '~1450 AC', title: 'O Êxodo e Moisés', ref: 'Êxodo 1-20' },
  { year: '~1406 AC', title: 'Entrada em Canaã', ref: 'Josué 1-6' },
  { year: '~1010 AC', title: 'Reino de Davi', ref: '2 Samuel 2' },
  { year: '~970 AC', title: 'Salomão e o Templo', ref: '1 Reis 6' },
  { year: '~931 AC', title: 'Divisão do Reino', ref: '1 Reis 12' },
  { year: '~722 AC', title: 'Queda de Israel', ref: '2 Reis 17' },
  { year: '~586 AC', title: 'Destruição de Jerusalém', ref: '2 Reis 25' },
  { year: '~4 AC', title: 'Nascimento de Jesus', ref: 'Mateus 1-2' },
  { year: '~30 DC', title: 'Crucificação e Ressurreição', ref: 'Mateus 27-28' },
  { year: '~95 DC', title: 'Apocalipse de João', ref: 'Apocalipse 1' },
];

const contextBooks = [
  'Gênesis', 'Êxodo', 'Levítico', 'Números', 'Deuteronômio', 'Josué',
  'Salmos', 'Provérbios', 'Isaías', 'Jeremias', 'Daniel', 'Mateus',
  'Marcos', 'Lucas', 'João', 'Atos', 'Romanos', '1 Coríntios',
  'Gálatas', 'Efésios', 'Filipenses', 'Hebreus', 'Tiago', 'Apocalipse',
];

type Tab = 'maps' | 'timeline' | 'context';

export function BibleResources() {
  const { lang } = useLanguage();
  const [tab, setTab] = useState<Tab>('maps');

  const tabs: { key: Tab; icon: React.ElementType; label: string }[] = [
    { key: 'maps', icon: Map, label: labels.maps[lang] },
    { key: 'timeline', icon: Clock, label: labels.timeline[lang] },
    { key: 'context', icon: BookOpen, label: labels.context[lang] },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display text-lg font-bold text-foreground">{labels.title[lang]}</h3>
        <p className="text-sm text-muted-foreground">{labels.subtitle[lang]}</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              tab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Maps */}
      {tab === 'maps' && (
        <div className="space-y-2">
          {mapItems.map((item, i) => (
            <button key={i} className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-left group">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Timeline */}
      {tab === 'timeline' && (
        <div className="space-y-1">
          {timelineItems.map((item, i) => (
            <div key={i} className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[11px] text-primary font-mono font-medium">{item.year}</p>
                <p className="text-sm text-foreground">{item.title} ({item.ref})</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Context */}
      {tab === 'context' && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {labels.contextHelp[lang]} ({contextBooks.length} {labels.available[lang]})
          </p>
          <div className="grid grid-cols-2 gap-2">
            {contextBooks.map(book => (
              <button key={book} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left text-sm text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {book}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
