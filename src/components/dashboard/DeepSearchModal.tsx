import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, BookOpen, MapPin, Lightbulb, ScrollText, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';

type L = 'PT' | 'EN' | 'ES';

interface DeepSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
}

/* ── Mock data keyed by language ── */
const mockResult = (query: string, lang: L) => ({
  reference: 'João 4:1-42',
  passage: lang === 'EN'
    ? '"If you knew the gift of God, and who it is who says to you, \'Give me a drink,\' you would have asked Him, and He would have given you living water." — John 4:10 (ESV)'
    : lang === 'ES'
    ? '"Si conocieras el don de Dios, y quién es el que te dice: \'Dame de beber\', tú le habrías pedido, y él te habría dado agua viva." — Juan 4:10 (RVR)'
    : '"Se tu conhecesses o dom de Deus e quem é o que te diz: Dá-me de beber, tu lhe pedirias, e ele te daria água viva." — João 4:10 (ARA)',

  summary: lang === 'EN'
    ? 'Jesus, traveling through Samaria, stops at Jacob\'s well and initiates a conversation with a Samaritan woman — breaking social, ethnic, and gender barriers. The dialogue moves from physical water to spiritual thirst, revealing Jesus as the source of eternal life.'
    : lang === 'ES'
    ? 'Jesús, viajando por Samaria, se detiene en el pozo de Jacob e inicia una conversación con una mujer samaritana, rompiendo barreras sociales, étnicas y de género. El diálogo pasa del agua física a la sed espiritual, revelando a Jesús como la fuente de vida eterna.'
    : 'Jesus, viajando pela Samaria, para no poço de Jacó e inicia uma conversa com uma mulher samaritana — quebrando barreiras sociais, étnicas e de gênero. O diálogo evolui da água física para a sede espiritual, revelando Jesus como a fonte de vida eterna.',

  context: lang === 'EN'
    ? 'Jews and Samaritans had deep animosity dating back centuries. Samaritans were considered half-breeds after the Assyrian conquest (722 BC). Jews avoided passing through Samaria. For a Jewish rabbi to speak with an unaccompanied Samaritan woman was doubly shocking — violating both ethnic and gender norms of the era.'
    : lang === 'ES'
    ? 'Judíos y samaritanos tenían una profunda animosidad que databa de siglos. Los samaritanos eran considerados mestizos tras la conquista asiria (722 a.C.). Los judíos evitaban pasar por Samaria. Que un rabino judío hablara con una mujer samaritana sola era doblemente impactante — violando normas étnicas y de género de la época.'
    : 'Judeus e samaritanos tinham profunda animosidade que remontava séculos. Os samaritanos eram considerados mestiços após a conquista assíria (722 a.C.). Os judeus evitavam passar pela Samaria. Um rabino judeu conversar com uma mulher samaritana desacompanhada era duplamente chocante — violando normas étnicas e de gênero da época.',

  insights: lang === 'EN'
    ? [
        'Jesus deliberately chose to pass through Samaria (v.4) — "He had to go through Samaria" implies divine necessity, not geography.',
        'The "living water" metaphor operates on two levels: physical well water vs. the spiritual gift that quenches the deepest human thirst.',
        'Jesus reveals intimate knowledge of her life (five husbands) not to condemn, but to awaken faith — showing that true worship transcends location (Jerusalem vs. Gerizim) and is "in spirit and truth."',
        'The woman becomes the first evangelist in John\'s Gospel, bringing the whole village to encounter Jesus.',
      ]
    : lang === 'ES'
    ? [
        'Jesús deliberadamente eligió pasar por Samaria (v.4) — "Le era necesario pasar por Samaria" implica necesidad divina, no geográfica.',
        'La metáfora del "agua viva" opera en dos niveles: agua física del pozo vs. el don espiritual que sacia la sed más profunda del ser humano.',
        'Jesús revela conocimiento íntimo de su vida (cinco maridos) no para condenar, sino para despertar la fe — mostrando que la verdadera adoración trasciende el lugar (Jerusalén vs. Gerizim) y es "en espíritu y verdad."',
        'La mujer se convierte en la primera evangelista del Evangelio de Juan, trayendo a toda la aldea a encontrar a Jesús.',
      ]
    : [
        'Jesus deliberadamente escolheu passar pela Samaria (v.4) — "Era-lhe necessário atravessar a Samaria" implica necessidade divina, não geográfica.',
        'A metáfora da "água viva" opera em dois níveis: água física do poço vs. o dom espiritual que sacia a sede mais profunda do ser humano.',
        'Jesus revela conhecimento íntimo da vida dela (cinco maridos) não para condenar, mas para despertar a fé — mostrando que a verdadeira adoração transcende o lugar (Jerusalém vs. Gerizim) e é "em espírito e em verdade."',
        'A mulher se torna a primeira evangelista do Evangelho de João, levando toda a aldeia ao encontro de Jesus.',
      ],
});

const labels: Record<string, Record<L, string>> = {
  searching: { PT: 'Analisando passagens bíblicas...', EN: 'Analyzing biblical passages...', ES: 'Analizando pasajes bíblicos...' },
  passage: { PT: 'Passagem Bíblica', EN: 'Biblical Passage', ES: 'Pasaje Bíblico' },
  summary: { PT: 'O que está acontecendo', EN: 'What is happening', ES: 'Qué está sucediendo' },
  context: { PT: 'Ambiente e Contexto Histórico', EN: 'Setting & Historical Context', ES: 'Ambiente y Contexto Histórico' },
  insights: { PT: 'Insights Teológicos', EN: 'Theological Insights', ES: 'Perspectivas Teológicas' },
  results: { PT: 'Resultado para', EN: 'Results for', ES: 'Resultados para' },
};

export function DeepSearchModal({ open, onOpenChange, query }: DeepSearchModalProps) {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setLoading(true);
      const t = setTimeout(() => setLoading(false), 1600);
      return () => clearTimeout(t);
    }
  }, [open, query]);

  const data = mockResult(query, lang);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border-border/60 bg-card backdrop-blur-sm">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-md border-b border-border/40 px-5 py-4 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base font-semibold text-foreground truncate">
              {labels.results[lang]} <span className="text-primary">"{query}"</span>
            </DialogTitle>
          </div>
          <button onClick={() => onOpenChange(false)} className="ml-3 shrink-0 rounded-full p-1.5 hover:bg-muted/60 transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-7 w-7 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">{labels.searching[lang]}</p>
          </div>
        ) : (
          <div className="px-5 py-5 space-y-6">
            {/* 1. Passagem */}
            <section>
              <SectionHeader icon={BookOpen} label={labels.passage[lang]} />
              <p className="text-xs font-medium text-primary/80 mb-1.5">{data.reference}</p>
              <blockquote className="border-l-[3px] border-primary/40 pl-4 text-[15px] leading-relaxed text-foreground/90 italic font-serif">
                {data.passage}
              </blockquote>
            </section>

            {/* 2. Resumo */}
            <section>
              <SectionHeader icon={ScrollText} label={labels.summary[lang]} />
              <p className="text-sm leading-relaxed text-foreground/85">{data.summary}</p>
            </section>

            {/* 3. Contexto Histórico */}
            <section>
              <SectionHeader icon={MapPin} label={labels.context[lang]} />
              <p className="text-sm leading-relaxed text-foreground/85">{data.context}</p>
            </section>

            {/* 4. Insights */}
            <section>
              <SectionHeader icon={Lightbulb} label={labels.insights[lang]} />
              <ul className="space-y-2.5">
                {data.insights.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-foreground/85">
                    <span className="shrink-0 mt-1 h-5 w-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <Icon className="h-4 w-4 text-primary/70" />
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</h3>
    </div>
  );
}
