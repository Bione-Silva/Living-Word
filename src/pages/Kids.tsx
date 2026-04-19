import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Loader2, RefreshCw, Palette, Download, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type L = 'PT' | 'EN' | 'ES';

interface Chapter {
  title: string;
  content: string;
  image_prompt?: string;
  image_url?: string;
}

interface Story {
  title: string;
  chapters: Chapter[];
  lesson: string;
  verse?: string;
}

const labels = {
  back: { PT: 'Voltar', EN: 'Back', ES: 'Volver' },
  title: { PT: 'Histórias para Crianças', EN: 'Stories for Kids', ES: 'Historias para Niños' },
  subtitle: { PT: 'Escolha um personagem bíblico e receba uma história mágica!', EN: 'Pick a Bible character and get a magical story!', ES: '¡Elige un personaje bíblico y recibe una historia mágica!' },
  generate: { PT: 'Gerar história', EN: 'Generate story', ES: 'Generar historia' },
  generating: { PT: 'Criando história mágica...', EN: 'Creating magical story...', ES: 'Creando historia mágica...' },
  newStory: { PT: 'Nova história', EN: 'New story', ES: 'Nueva historia' },
  ageGroup: { PT: 'Faixa etária', EN: 'Age group', ES: 'Grupo de edad' },
  download: { PT: 'Baixar PDF', EN: 'Download PDF', ES: 'Descargar PDF' },
  generatingPdf: { PT: 'Gerando PDF...', EN: 'Generating PDF...', ES: 'Generando PDF...' },
  chapter: { PT: 'Capítulo', EN: 'Chapter', ES: 'Capítulo' },
  lesson: { PT: 'Lição', EN: 'Lesson', ES: 'Lección' },
  illustrating: { PT: 'Desenhando ilustrações...', EN: 'Drawing illustrations...', ES: 'Dibujando ilustraciones...' },
} satisfies Record<string, Record<L, string>>;

const characters = [
  { id: 'david', emoji: '👑', name: { PT: 'Davi', EN: 'David', ES: 'David' } },
  { id: 'moses', emoji: '🌊', name: { PT: 'Moisés', EN: 'Moses', ES: 'Moisés' } },
  { id: 'noah', emoji: '🚢', name: { PT: 'Noé', EN: 'Noah', ES: 'Noé' } },
  { id: 'esther', emoji: '👸', name: { PT: 'Ester', EN: 'Esther', ES: 'Ester' } },
  { id: 'daniel', emoji: '🦁', name: { PT: 'Daniel', EN: 'Daniel', ES: 'Daniel' } },
  { id: 'joseph', emoji: '🌈', name: { PT: 'José', EN: 'Joseph', ES: 'José' } },
  { id: 'ruth', emoji: '🌾', name: { PT: 'Rute', EN: 'Ruth', ES: 'Rut' } },
  { id: 'jonah', emoji: '🐋', name: { PT: 'Jonas', EN: 'Jonah', ES: 'Jonás' } },
  { id: 'samuel', emoji: '📖', name: { PT: 'Samuel', EN: 'Samuel', ES: 'Samuel' } },
  { id: 'abraham', emoji: '⭐', name: { PT: 'Abraão', EN: 'Abraham', ES: 'Abraham' } },
  { id: 'elijah', emoji: '🔥', name: { PT: 'Elias', EN: 'Elijah', ES: 'Elías' } },
  { id: 'mary', emoji: '💙', name: { PT: 'Maria', EN: 'Mary', ES: 'María' } },
  { id: 'peter', emoji: '🐟', name: { PT: 'Pedro', EN: 'Peter', ES: 'Pedro' } },
  { id: 'paul', emoji: '✉️', name: { PT: 'Paulo', EN: 'Paul', ES: 'Pablo' } },
  { id: 'sarah', emoji: '😊', name: { PT: 'Sara', EN: 'Sarah', ES: 'Sara' } },
  { id: 'gideon', emoji: '🏺', name: { PT: 'Gideão', EN: 'Gideon', ES: 'Gedeón' } },
  { id: 'joshua', emoji: '🎺', name: { PT: 'Josué', EN: 'Joshua', ES: 'Josué' } },
  { id: 'solomon', emoji: '🏛️', name: { PT: 'Salomão', EN: 'Solomon', ES: 'Salomón' } },
  { id: 'samson', emoji: '💪', name: { PT: 'Sansão', EN: 'Samson', ES: 'Sansón' } },
  { id: 'miriam', emoji: '🎵', name: { PT: 'Miriã', EN: 'Miriam', ES: 'Miriam' } },
];

const ageGroups = [
  { value: '3-5', label: { PT: '3–5 anos', EN: '3–5 years', ES: '3–5 años' } },
  { value: '6-8', label: { PT: '6–8 anos', EN: '6–8 years', ES: '6–8 años' } },
  { value: '9-12', label: { PT: '9–12 anos', EN: '9–12 years', ES: '9–12 años' } },
];

// Cores vibrantes por capítulo (estilo gibi)
const chapterColors = [
  { bg: 'bg-amber-50', border: 'border-amber-300', accent: 'bg-amber-500', text: 'text-amber-900' },
  { bg: 'bg-sky-50', border: 'border-sky-300', accent: 'bg-sky-500', text: 'text-sky-900' },
  { bg: 'bg-rose-50', border: 'border-rose-300', accent: 'bg-rose-500', text: 'text-rose-900' },
  { bg: 'bg-emerald-50', border: 'border-emerald-300', accent: 'bg-emerald-500', text: 'text-emerald-900' },
  { bg: 'bg-violet-50', border: 'border-violet-300', accent: 'bg-violet-500', text: 'text-violet-900' },
];

/** Limpa fences markdown (```json ... ```) e tenta extrair JSON válido */
function extractJSON(raw: string): string {
  let s = raw.trim();
  // remove ```json ... ``` ou ``` ... ```
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  // se ainda tiver texto antes de { ou [, captura do primeiro { até o último }
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    s = s.slice(first, last + 1);
  }
  return s;
}

export default function Kids() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [ageGroup, setAgeGroup] = useState('6-8');
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState<Story | null>(null);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const storyRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!selected || !user) return;
    const char = characters.find(c => c.id === selected);
    if (!char) return;

    setLoading(true);
    setStory(null);

    try {
      const langName = lang === 'PT' ? 'Portuguese (Brazilian)' : lang === 'ES' ? 'Spanish' : 'English';
      const { data, error } = await supabase.functions.invoke('ai-tool', {
        body: {
          systemPrompt: `You are a children's Bible story writer. Write a story about ${char.name.EN} for children aged ${ageGroup}, in ${langName}.

Structure: 3 to 4 short chapters, each with a title, 2-3 paragraphs (80-120 words per chapter), and a vivid scene description for an illustration.

Return ONLY valid JSON (no markdown, no code fences, no explanation):
{
  "title": "story title in ${langName}",
  "verse": "1 short Bible verse reference relevant to the story (e.g., 'Salmos 23:1')",
  "chapters": [
    {
      "title": "chapter title in ${langName}",
      "content": "chapter text in ${langName} with simple vocabulary and dialogue",
      "image_prompt": "vivid English description of the key scene for AI illustration (watercolor children's Bible art style)"
    }
  ],
  "lesson": "single sentence moral lesson in ${langName}"
}`,
          userPrompt: `Tell me a Bible story about ${char.name[lang]} for children aged ${ageGroup}.`,
          toolId: 'kids-story',
        },
      });

      if (error) throw error;
      const content: string = data?.content || '';
      if (!content) throw new Error('empty');

      let parsed: Story;
      try {
        parsed = JSON.parse(extractJSON(content));
      } catch {
        // fallback: cria 1 capítulo único
        parsed = {
          title: char.name[lang],
          chapters: [{ title: char.name[lang], content }],
          lesson: '',
        };
      }

      // garante chapters
      if (!parsed.chapters || !Array.isArray(parsed.chapters) || parsed.chapters.length === 0) {
        parsed.chapters = [{ title: parsed.title, content: (parsed as unknown as { content?: string }).content || '' }];
      }

      setStory(parsed);
      // Gera ilustrações em paralelo
      generateAllImages(char.name.EN, parsed);
    } catch {
      toast.error(lang === 'PT' ? 'Erro ao gerar história' : 'Error generating story');
    } finally {
      setLoading(false);
    }
  };

  const generateAllImages = async (characterName: string, parsedStory: Story) => {
    setImagesLoading(true);
    const updated = { ...parsedStory };
    await Promise.all(
      updated.chapters.map(async (ch, idx) => {
        try {
          const { data, error } = await supabase.functions.invoke('generate-kids-illustration', {
            body: {
              character_name: characterName,
              story_title: ch.image_prompt || `${characterName} - ${ch.title}`,
              type: 'illustration',
            },
          });
          if (!error && data?.image_url) {
            updated.chapters[idx].image_url = data.image_url;
            setStory({ ...updated, chapters: [...updated.chapters] });
          }
        } catch { /* skip */ }
      })
    );
    setImagesLoading(false);
  };

  const handleDownloadPDF = async () => {
    if (!storyRef.current || !story) return;
    setPdfLoading(true);
    try {
      // Aguarda todas as imagens carregarem
      const imgs = Array.from(storyRef.current.querySelectorAll('img'));
      await Promise.all(
        imgs.map(img =>
          img.complete && img.naturalWidth > 0
            ? Promise.resolve()
            : new Promise<void>(res => {
                img.addEventListener('load', () => res(), { once: true });
                img.addEventListener('error', () => res(), { once: true });
              })
        )
      );

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const MARGIN = 10;
      const FOOTER_RESERVE = 8;
      const contentWidth = pageWidth - MARGIN * 2;
      const usableHeight = pageHeight - MARGIN - FOOTER_RESERVE;

      // Captura cada seção individualmente para evitar cortes
      const sections = Array.from(
        storyRef.current.querySelectorAll<HTMLElement>('[data-pdf-section]')
      );
      if (sections.length === 0) sections.push(storyRef.current);

      let currentY = MARGIN;
      const SECTION_GAP = 4;

      for (const section of sections) {
        const canvas = await html2canvas(section, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
        });
        const sectionWidthMm = contentWidth;
        const sectionHeightMm = (canvas.height * contentWidth) / canvas.width;
        const imgData = canvas.toDataURL('image/jpeg', 0.9);

        // Se a seção sozinha é maior que uma página inteira, fatiamos ela
        if (sectionHeightMm > usableHeight - MARGIN) {
          // Adiciona em nova página se já houver conteúdo
          if (currentY > MARGIN) {
            pdf.addPage();
            currentY = MARGIN;
          }
          // Fatia em múltiplas páginas
          const pageContentHeight = usableHeight - MARGIN;
          const pxPerMm = canvas.height / sectionHeightMm;
          const sliceHeightPx = Math.floor(pageContentHeight * pxPerMm);
          let offsetPx = 0;
          let firstSlice = true;
          while (offsetPx < canvas.height) {
            const remainingPx = canvas.height - offsetPx;
            const thisSlicePx = Math.min(sliceHeightPx, remainingPx);
            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = canvas.width;
            sliceCanvas.height = thisSlicePx;
            const ctx = sliceCanvas.getContext('2d')!;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
            ctx.drawImage(canvas, 0, -offsetPx);
            const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.9);
            const sliceHeightMm = thisSlicePx / pxPerMm;
            if (!firstSlice) {
              pdf.addPage();
              currentY = MARGIN;
            }
            pdf.addImage(sliceData, 'JPEG', MARGIN, currentY, sectionWidthMm, sliceHeightMm);
            currentY += sliceHeightMm;
            offsetPx += thisSlicePx;
            firstSlice = false;
          }
          currentY += SECTION_GAP;
        } else {
          // Cabe inteira: verifica se cabe na página atual
          if (currentY + sectionHeightMm > usableHeight && currentY > MARGIN) {
            pdf.addPage();
            currentY = MARGIN;
          }
          pdf.addImage(imgData, 'JPEG', MARGIN, currentY, sectionWidthMm, sectionHeightMm);
          currentY += sectionHeightMm + SECTION_GAP;
        }
      }

      // Rodapé Living Word em todas as páginas
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text('Living Word — livingwordgo.com', pageWidth / 2, pageHeight - 5, { align: 'center' });
      }

      pdf.save(`${story.title.replace(/[^\w\s-]/g, '').slice(0, 40)}.pdf`);
      toast.success(lang === 'PT' ? 'PDF baixado!' : 'PDF downloaded!');
    } catch (err) {
      console.error('PDF error:', err);
      toast.error(lang === 'PT' ? 'Erro ao gerar PDF' : 'Error generating PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleReset = () => {
    setStory(null);
    setSelected(null);
  };

  const selectedChar = characters.find(c => c.id === selected);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> {labels.back[lang]}
      </Link>

      <div className="text-center space-y-2">
        <h1 className="text-2xl font-display font-bold text-foreground">
          🧒 {labels.title[lang]}
        </h1>
        <p className="text-sm text-muted-foreground">{labels.subtitle[lang]}</p>
      </div>

      {!story ? (
        <>
          {/* Age selector */}
          <div className="flex justify-center gap-2">
            {ageGroups.map(ag => (
              <button
                key={ag.value}
                onClick={() => setAgeGroup(ag.value)}
                className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                  ageGroup === ag.value
                    ? 'bg-primary/15 border-primary/50 text-primary'
                    : 'bg-background border-border text-muted-foreground hover:border-primary/30'
                }`}
              >
                {ag.label[lang]}
              </button>
            ))}
          </div>

          {/* Character grid */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {characters.map(char => (
              <button
                key={char.id}
                onClick={() => setSelected(char.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                  selected === char.id
                    ? 'bg-primary/10 border-primary/50 shadow-sm scale-105'
                    : 'bg-card border-border hover:border-primary/30 hover:bg-muted/50'
                }`}
              >
                <span className="text-3xl">{char.emoji}</span>
                <span className="text-[11px] font-medium text-foreground leading-tight text-center">{char.name[lang]}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={!selected || loading}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {labels.generating[lang]}</>
            ) : (
              <>✨ {labels.generate[lang]}</>
            )}
          </button>
        </>
      ) : (
        <div className="space-y-5 animate-fade-in">
          {/* Action bar */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleReset}
              className="flex-1 min-w-[120px] h-10 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> {labels.newStory[lang]}
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading || imagesLoading}
              className="flex-1 min-w-[120px] h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
            >
              {pdfLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {labels.generatingPdf[lang]}</>
              ) : (
                <><Download className="h-4 w-4" /> {labels.download[lang]}</>
              )}
            </button>
          </div>

          {imagesLoading && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              {labels.illustrating[lang]}
            </div>
          )}

          {/* Comic-book style story */}
          <div ref={storyRef} className="bg-white rounded-3xl p-5 sm:p-8 space-y-6 shadow-sm">
            {/* Cover */}
            <header data-pdf-section className="text-center space-y-3 pb-4 border-b-2 border-dashed border-amber-200">
              <div className="text-6xl">{selectedChar?.emoji}</div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground leading-tight">
                {story.title}
              </h1>
              {story.verse && (
                <p className="text-xs font-medium text-primary inline-flex items-center gap-1">
                  <BookOpen className="h-3 w-3" /> {story.verse}
                </p>
              )}
            </header>

            {/* Chapters */}
            {story.chapters.map((ch, idx) => {
              const c = chapterColors[idx % chapterColors.length];
              return (
                <article
                  key={idx}
                  data-pdf-section
                  className={`rounded-2xl border-2 ${c.border} ${c.bg} p-4 sm:p-5 space-y-3 animate-fade-in`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-center gap-2">
                    <span className={`${c.accent} text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full`}>
                      {labels.chapter[lang]} {idx + 1}
                    </span>
                  </div>
                  <h2 className={`text-lg sm:text-xl font-display font-bold ${c.text}`}>
                    {ch.title}
                  </h2>

                  {ch.image_url ? (
                    <img
                      src={ch.image_url}
                      alt={ch.title}
                      className="w-full rounded-xl object-cover max-h-72 border-2 border-white shadow-sm"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className={`w-full h-48 rounded-xl ${c.bg} border-2 border-dashed ${c.border} flex items-center justify-center`}>
                      {imagesLoading ? (
                        <Loader2 className={`h-5 w-5 animate-spin ${c.text} opacity-60`} />
                      ) : (
                        <Palette className={`h-6 w-6 ${c.text} opacity-30`} />
                      )}
                    </div>
                  )}

                  <div className="space-y-2 text-[15px] leading-[1.75] text-foreground/85">
                    {ch.content.split(/\n\n+/).map((p, i) => (
                      <p key={i}>{p.trim()}</p>
                    ))}
                  </div>
                </article>
              );
            })}

            {/* Lesson */}
            {story.lesson && (
              <aside data-pdf-section className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-2xl p-5 text-center space-y-2">
                <div className="text-3xl">💡</div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary">
                  {labels.lesson[lang]}
                </h3>
                <p className="text-base font-medium text-foreground/90 italic">
                  "{story.lesson}"
                </p>
              </aside>
            )}

            {/* Footer brand */}
            <footer className="text-center pt-4 border-t border-border">
              <p className="text-[10px] text-muted-foreground tracking-wider">
                ✨ Living Word · livingwordgo.com
              </p>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
