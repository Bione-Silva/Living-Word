import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Map, Clock, BookOpen, ChevronRight, ChevronLeft, Globe, Footprints,
  Building2, Cross, Scroll, Church, Sparkles, GraduationCap, ChevronDown
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { L } from '@/lib/bible-data';
import { bibleBooks, getBookName } from '@/lib/bible-data';
import { ntBookIds } from '@/data/bible-book-descriptions';

const labels = {
  title: { PT: 'Recursos de Estudo', EN: 'Study Resources', ES: 'Recursos de Estudio' },
  subtitle: { PT: 'Mapas, cronologia e contexto histórico', EN: 'Maps, timeline and historical context', ES: 'Mapas, cronología y contexto histórico' },
  maps: { PT: 'Mapas', EN: 'Maps', ES: 'Mapas' },
  timeline: { PT: 'Cronologia', EN: 'Timeline', ES: 'Cronología' },
  context: { PT: 'Contexto', EN: 'Context', ES: 'Contexto' },
  contextHelp: { PT: 'Toque em um livro para ver seu contexto histórico', EN: 'Tap a book to see its context', ES: 'Toca un libro para ver su contexto' },
  available: { PT: 'livros disponíveis', EN: 'books available', ES: 'libros disponibles' },
  generateArt: { PT: 'Gerar Arte', EN: 'Generate Art', ES: 'Generar Arte' },
  study: { PT: 'Estudar', EN: 'Study', ES: 'Estudiar' },
  backToBooks: { PT: '‹ Voltar aos livros', EN: '‹ Back to books', ES: '‹ Volver a los libros' },
  author: { PT: 'AUTOR', EN: 'AUTHOR', ES: 'AUTOR' },
  date: { PT: 'DATA', EN: 'DATE', ES: 'FECHA' },
  centralTheme: { PT: 'TEMA CENTRAL', EN: 'CENTRAL THEME', ES: 'TEMA CENTRAL' },
  chapters: { PT: 'Capítulos', EN: 'Chapters', ES: 'Capítulos' },
  bookNum: { PT: 'Livro', EN: 'Book', ES: 'Libro' },
  testament: { PT: 'Testamento', EN: 'Testament', ES: 'Testamento' },
  ot: { PT: 'AT', EN: 'OT', ES: 'AT' },
  nt: { PT: 'NT', EN: 'NT', ES: 'NT' },
  studyMore: { PT: 'Estudar mais', EN: 'Study more', ES: 'Estudiar más' },
  periodOT: { PT: 'Período do AT', EN: 'OT Period', ES: 'Período del AT' },
  periodNT: { PT: 'Período do NT', EN: 'NT Period', ES: 'Período del NT' },
  totalBooks: { PT: 'Total de livros', EN: 'Total books', ES: 'Total de libros' },
  humanAuthors: { PT: 'Autores humanos', EN: 'Human authors', ES: 'Autores humanos' },
  originalLangs: { PT: 'Idiomas originais', EN: 'Original languages', ES: 'Idiomas originales' },
  writingYears: { PT: 'Anos de escrita', EN: 'Writing years', ES: 'Años de escritura' },
} satisfies Record<string, Record<L, string>>;

const mapItems = [
  {
    icon: Globe,
    title: 'Jardim do Éden e Mesopotâmia',
    desc: 'Contexto geográfico de Gênesis 1-11',
    locations: [
      'Localização: entre os rios Tigre e Eufrates (atual Iraque)',
      'Quatro rios mencionados: Pisom, Giom, Tigre e Eufrates',
      'Ur dos Caldeus: cidade natal de Abraão',
      'Babel/Babilônia: local da torre de Babel',
      'Monte Ararate (atual Turquia): onde a arca de Noé repousou',
    ],
  },
  { icon: Footprints, title: 'Rota do Êxodo', desc: 'Caminho de Israel pelo deserto até Canaã', locations: [] },
  { icon: Building2, title: 'Terra Prometida Dividida', desc: 'As 12 tribos de Israel e suas porções', locations: [] },
  { icon: Cross, title: 'Israel no Tempo de Jesus', desc: 'Galileia, Samaria, Judeia e região', locations: [] },
  { icon: Scroll, title: 'Viagens Missionárias de Paulo', desc: '3 viagens pelo Mediterrâneo (Atos 13-21)', locations: [] },
  { icon: Church, title: 'Sete Igrejas do Apocalipse', desc: 'Localização das igrejas de Apocalipse 2-3', locations: [] },
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
  { year: '~538 AC', title: 'Retorno do Exílio', ref: 'Esdras 1' },
  { year: '~450 AC', title: 'Esdras e Neemias reformam Israel', ref: '' },
  { year: '~400 AC', title: 'Último livro do AT (Malaquias)', ref: '' },
  { year: '~4 AC', title: 'Nascimento de Jesus', ref: 'Lucas 2' },
  { year: '~27 DC', title: 'Batismo e ministério de Jesus', ref: 'Marcos 1' },
  { year: '~30 DC', title: 'Crucificação e Ressurreição', ref: 'João 19-20' },
  { year: '~95 DC', title: 'Apocalipse de João', ref: 'Apocalipse 1' },
];

interface BookContextData {
  name: string;
  description: string;
  author: string;
  date: string;
  theme: string;
  chapters: number;
  bookNumber: number;
  isNT: boolean;
}

const contextBooksData: Record<string, Omit<BookContextData, 'name' | 'chapters' | 'bookNumber' | 'isNT'>> = {
  Genesis: { description: 'Relata a criação do mundo, a queda do homem, o dilúvio e os patriarcas de Israel.', author: 'Moisés', date: '~1450 AC', theme: 'Origens e promessas' },
  Exodus: { description: 'A libertação de Israel do Egito, a entrega da Lei e a construção do tabernáculo.', author: 'Moisés', date: '~1440 AC', theme: 'Libertação e aliança' },
  Leviticus: { description: 'Leis de sacrifício, purificação e santidade para o povo de Israel.', author: 'Moisés', date: '~1440 AC', theme: 'Santidade e sacerdócio' },
  Numbers: { description: 'Relata a jornada de Israel pelo deserto por 40 anos, sua rebeldia e consequências.', author: 'Moisés', date: '~1400 AC', theme: 'Peregrinação e obediência' },
  Deuteronomy: { description: 'Discursos finais de Moisés e renovação da aliança antes de entrar em Canaã.', author: 'Moisés', date: '~1400 AC', theme: 'Renovação da aliança' },
  Joshua: { description: 'A conquista e divisão da terra prometida sob a liderança de Josué.', author: 'Josué', date: '~1350 AC', theme: 'Conquista e fidelidade' },
  Psalms: { description: 'Coletânea de 150 cânticos de louvor, lamento, sabedoria e profecia.', author: 'Davi e outros', date: '~1000-400 AC', theme: 'Louvor e oração' },
  Proverbs: { description: 'Sabedoria prática para a vida diária, relações e temor ao Senhor.', author: 'Salomão e outros', date: '~950 AC', theme: 'Sabedoria prática' },
  Isaiah: { description: 'Profecias sobre o juízo de Deus, a restauração de Israel e o Messias vindouro.', author: 'Isaías', date: '~700 AC', theme: 'Juízo e redenção messiânica' },
  Jeremiah: { description: 'O profeta chora pela desobediência de Judá e anuncia o novo pacto.', author: 'Jeremias', date: '~627-585 AC', theme: 'Arrependimento e novo pacto' },
  Daniel: { description: 'Visões apocalípticas e a fidelidade de Daniel na corte babilônica.', author: 'Daniel', date: '~535 AC', theme: 'Soberania de Deus' },
  Matthew: { description: 'Jesus como o Messias prometido, cumprindo as profecias do Antigo Testamento.', author: 'Mateus', date: '~60 DC', theme: 'Jesus, o Rei prometido' },
  Mark: { description: 'O evangelho da ação — Jesus como servo sofredor e poderoso em obras.', author: 'Marcos', date: '~55 DC', theme: 'Jesus, o Servo' },
  Luke: { description: 'Relato detalhado da vida de Jesus com ênfase na compaixão pelos marginalizados.', author: 'Lucas', date: '~60 DC', theme: 'Jesus, o Salvador universal' },
  John: { description: 'O evangelho teológico — Jesus como o Verbo encarnado, Deus entre nós.', author: 'João', date: '~90 DC', theme: 'Jesus, o Filho de Deus' },
  Acts: { description: 'O nascimento e expansão da Igreja primitiva pelo poder do Espírito Santo.', author: 'Lucas', date: '~62 DC', theme: 'Missão e Espírito Santo' },
  Romans: { description: 'A doutrina da justificação pela fé e a vida no Espírito.', author: 'Paulo', date: '~57 DC', theme: 'Justificação pela fé' },
  '1 Corinthians': { description: 'Correções à igreja de Corinto sobre divisões, imoralidade e dons espirituais.', author: 'Paulo', date: '~55 DC', theme: 'Unidade e santidade' },
  Galatians: { description: 'Defesa da liberdade cristã contra o legalismo judaizante.', author: 'Paulo', date: '~49 DC', theme: 'Liberdade em Cristo' },
  Ephesians: { description: 'A glória da Igreja como corpo de Cristo e a vida prática do cristão.', author: 'Paulo', date: '~60 DC', theme: 'A Igreja, corpo de Cristo' },
  Philippians: { description: 'Carta de alegria e encorajamento escrita da prisão.', author: 'Paulo', date: '~62 DC', theme: 'Alegria em Cristo' },
  Hebrews: { description: 'A superioridade de Cristo sobre anjos, Moisés, o sacerdócio levítico e a antiga aliança.', author: 'Desconhecido', date: '~65 DC', theme: 'Superioridade de Cristo' },
  James: { description: 'Fé prática: obras, língua, paciência e sabedoria para o dia a dia.', author: 'Tiago', date: '~45 DC', theme: 'Fé e obras' },
  Revelation: { description: 'Visão apocalíptica do triunfo final de Cristo e o novo céu e nova terra.', author: 'João', date: '~95 DC', theme: 'Vitória final de Cristo' },
};

const contextBookIds = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua',
  'Psalms', 'Proverbs', 'Isaiah', 'Jeremiah', 'Daniel', 'Matthew',
  'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians',
  'Galatians', 'Ephesians', 'Philippians', 'Hebrews', 'James', 'Revelation',
];

type Tab = 'maps' | 'timeline' | 'context';

export function BibleResources() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('maps');
  const [selectedContextBook, setSelectedContextBook] = useState<string | null>(null);

  const tabs: { key: Tab; icon: React.ElementType; label: string }[] = [
    { key: 'maps', icon: Map, label: labels.maps[lang] },
    { key: 'timeline', icon: Clock, label: labels.timeline[lang] },
    { key: 'context', icon: BookOpen, label: labels.context[lang] },
  ];

  const handleGenerateArt = (topic: string) => {
    navigate('/social-studio', { state: { prefilledSlides: [{ text: topic, slideNumber: 1, totalSlides: 1 }] } });
  };

  const handleStudy = (passage: string) => {
    navigate('/estudo-biblico', { state: { prefillPassage: passage } });
  };

  const getBookContext = (bookId: string): BookContextData | null => {
    const meta = contextBooksData[bookId];
    if (!meta) return null;
    const book = bibleBooks.find(b => b.id === bookId);
    if (!book) return null;
    const idx = bibleBooks.findIndex(b => b.id === bookId) + 1;
    return {
      name: getBookName(bookId, lang),
      ...meta,
      chapters: book.chapters,
      bookNumber: idx,
      isNT: ntBookIds.has(bookId),
    };
  };

  const selectedBook = selectedContextBook ? getBookContext(selectedContextBook) : null;

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
            onClick={() => { setTab(t.key); setSelectedContextBook(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
              tab === t.key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
            <Collapsible key={i}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-left group">
                  <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-transform shrink-0 group-data-[state=open]:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {item.locations.length > 0 ? (
                  <div className="ml-4 border-l-2 border-border pl-4 py-2 space-y-3">
                    {item.locations.map((loc, li) => (
                      <div key={li} className="space-y-1.5">
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <p className="text-sm text-foreground/80">{loc}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-3.5">
                          <button
                            onClick={() => handleGenerateArt(loc)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
                          >
                            <Sparkles className="h-3 w-3" /> {labels.generateArt[lang]}
                          </button>
                          <button
                            onClick={() => handleStudy(item.title)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                          >
                            <GraduationCap className="h-3 w-3" /> {labels.study[lang]}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ml-4 border-l-2 border-border pl-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleGenerateArt(item.title)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
                      >
                        <Sparkles className="h-3 w-3" /> {labels.generateArt[lang]}
                      </button>
                      <button
                        onClick={() => handleStudy(item.title)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                      >
                        <GraduationCap className="h-3 w-3" /> {labels.study[lang]}
                      </button>
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}

      {/* Timeline */}
      {tab === 'timeline' && (
        <div className="space-y-0">
          {timelineItems.map((item, i) => (
            <div key={i} className="flex items-start gap-3 py-3.5 border-b border-border/40 last:border-0 group">
              <div className="flex flex-col items-center gap-1 mt-0.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                {i < timelineItems.length - 1 && <div className="w-px h-full bg-border/60" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-primary font-mono font-semibold tracking-wide">{item.year}</p>
                <p className="text-sm text-foreground font-medium">
                  {item.title}{item.ref ? ` (${item.ref})` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => handleGenerateArt(`${item.title} - ${item.ref}`)}
                  className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center hover:bg-primary/25 transition-colors"
                  title={labels.generateArt[lang]}
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </button>
                <button
                  onClick={() => handleStudy(item.ref || item.title)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                  title={labels.studyMore[lang]}
                >
                  <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Context */}
      {tab === 'context' && !selectedBook && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {labels.contextHelp[lang]} ({contextBookIds.length} {labels.available[lang]})
          </p>
          <div className="grid grid-cols-2 gap-2">
            {contextBookIds.map(bookId => (
              <button
                key={bookId}
                onClick={() => setSelectedContextBook(bookId)}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all text-left text-sm text-foreground group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span className="flex-1">{getBookName(bookId, lang)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Context — Book Detail */}
      {tab === 'context' && selectedBook && (
        <div className="space-y-5">
          <button
            onClick={() => setSelectedContextBook(null)}
            className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
          >
            {labels.backToBooks[lang]}
          </button>

          {/* Book Card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-primary/15 text-primary mb-2">
                {selectedBook.isNT ? labels.nt[lang] + ' — ' + (lang === 'PT' ? 'Novo Testamento' : lang === 'EN' ? 'New Testament' : 'Nuevo Testamento') :
                  labels.ot[lang] + ' — ' + (lang === 'PT' ? 'Antigo Testamento' : lang === 'EN' ? 'Old Testament' : 'Antiguo Testamento')}
              </span>
              <h4 className="font-display text-xl font-bold text-foreground">{selectedBook.name}</h4>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{selectedBook.description}</p>
            </div>

            {/* Author + Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-primary/70 mb-0.5">{labels.author[lang]}</p>
                <p className="text-sm font-semibold text-foreground">{selectedBook.author}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-primary/70 mb-0.5">{labels.date[lang]}</p>
                <p className="text-sm font-semibold text-foreground">{selectedBook.date}</p>
              </div>
            </div>

            {/* Central Theme */}
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-primary/70 mb-0.5">{labels.centralTheme[lang]}</p>
              <p className="text-sm font-semibold text-foreground">{selectedBook.theme}</p>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-6">
              <div>
                <p className="text-2xl font-bold text-foreground">{selectedBook.chapters}</p>
                <p className="text-[11px] text-muted-foreground">{labels.chapters[lang]}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{selectedBook.bookNumber}º</p>
                <p className="text-[11px] text-muted-foreground">{labels.bookNum[lang]}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{selectedBook.isNT ? labels.nt[lang] : labels.ot[lang]}</p>
                <p className="text-[11px] text-muted-foreground">{labels.testament[lang]}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleGenerateArt(selectedBook.name)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/30 bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                <Sparkles className="h-4 w-4" /> {labels.generateArt[lang]}
              </button>
              <button
                onClick={() => handleStudy(selectedBook.name)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-muted/50 text-foreground text-sm font-medium hover:bg-muted transition-colors"
              >
                <GraduationCap className="h-4 w-4" /> {labels.studyMore[lang]}
              </button>
            </div>
          </div>

          {/* Bible Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { emoji: '📜', value: '~4000-400 AC', label: labels.periodOT[lang] },
              { emoji: '✝️', value: '~4 AC-95 DC', label: labels.periodNT[lang] },
              { emoji: '📚', value: '66 ' + (lang === 'PT' ? 'livros' : lang === 'EN' ? 'books' : 'libros'), label: labels.totalBooks[lang] },
              { emoji: '✍️', value: '~40 ' + (lang === 'PT' ? 'autores' : lang === 'EN' ? 'authors' : 'autores'), label: labels.humanAuthors[lang] },
              { emoji: '🌍', value: '3 ' + (lang === 'PT' ? 'idiomas' : lang === 'EN' ? 'languages' : 'idiomas'), label: labels.originalLangs[lang] },
              { emoji: '⏳', value: '~1.600 ' + (lang === 'PT' ? 'anos' : lang === 'EN' ? 'years' : 'años'), label: labels.writingYears[lang] },
            ].map((stat, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-3.5">
                <span className="text-lg">{stat.emoji}</span>
                <p className="text-sm font-bold text-foreground mt-1">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
