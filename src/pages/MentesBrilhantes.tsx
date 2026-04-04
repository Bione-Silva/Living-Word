import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MindCard, type MindData } from '@/components/MindCard';
import { MindProfileSheet } from '@/components/MindProfileSheet';
import { Brain, Sparkles } from 'lucide-react';
import billyGrahamImg from '@/assets/minds/billy-graham.jpg';
import spurgeonImg from '@/assets/minds/charles-spurgeon.jpg';
import lloydJonesImg from '@/assets/minds/martyn-lloyd-jones.jpg';

type L = 'PT' | 'EN' | 'ES';

const minds: MindData[] = [
  {
    id: 'billy-graham',
    name: 'Billy Graham',
    image: billyGrahamImg,
    subtitle: { PT: 'O Evangelista da América', EN: 'America\'s Evangelist', ES: 'El Evangelista de América' },
    role: { PT: 'Apelo & Evangelismo em Massa', EN: 'Appeal & Mass Evangelism', ES: 'Apelación & Evangelismo Masivo' },
    locked: false,
    badges: [
      { PT: '350+ horas de pregações', EN: '350+ hours of sermons', ES: '350+ horas de predicaciones' },
      { PT: '32 Milhões de Tokens Lidos', EN: '32 Million Tokens Read', ES: '32 Millones de Tokens Leídos' },
    ],
    skills: [
      { PT: 'Apelo Evangelístico', EN: 'Evangelistic Appeal', ES: 'Apelación Evangelística' },
      { PT: 'Simplificação Teológica', EN: 'Theological Simplification', ES: 'Simplificación Teológica' },
      { PT: '"A Bíblia diz..." (Assinatura Homilética)', EN: '"The Bible says..." (Homiletic Signature)', ES: '"La Biblia dice..." (Firma Homilética)' },
    ],
    theology: {
      PT: 'A abordagem desta mente foca na conversão visceral, a cruz de Cristo e o amor incondicional de Deus. Billy Graham é reconhecido por sua capacidade de comunicar verdades profundas com simplicidade tocante, alcançando milhões ao redor do mundo.',
      EN: 'This mind focuses on visceral conversion, the cross of Christ and God\'s unconditional love. Billy Graham is renowned for communicating deep truths with touching simplicity, reaching millions worldwide.',
      ES: 'Este mentor se enfoca en la conversión visceral, la cruz de Cristo y el amor incondicional de Dios. Billy Graham es reconocido por comunicar verdades profundas con simplicidad conmovedora, alcanzando millones alrededor del mundo.',
    },
  },
  {
    id: 'charles-spurgeon',
    name: 'Charles Spurgeon',
    image: spurgeonImg,
    subtitle: { PT: 'O Príncipe dos Pregadores', EN: 'The Prince of Preachers', ES: 'El Príncipe de los Predicadores' },
    role: { PT: 'Pregação Poética e Puritana', EN: 'Poetic & Puritan Preaching', ES: 'Predicación Poética y Puritana' },
    locked: true,
    badges: [
      { PT: '500+ sermões analisados', EN: '500+ sermons analyzed', ES: '500+ sermones analizados' },
      { PT: '45 Milhões de Tokens Lidos', EN: '45 Million Tokens Read', ES: '45 Millones de Tokens Leídos' },
    ],
    skills: [
      { PT: 'Retórica Vitoriana Refinada', EN: 'Refined Victorian Rhetoric', ES: 'Retórica Victoriana Refinada' },
      { PT: 'Metáforas Teológicas Profundas', EN: 'Deep Theological Metaphors', ES: 'Metáforas Teológicas Profundas' },
      { PT: 'Soberania de Deus (Calvinismo Pastoral)', EN: 'God\'s Sovereignty (Pastoral Calvinism)', ES: 'Soberanía de Dios (Calvinismo Pastoral)' },
    ],
    theology: {
      PT: 'Spurgeon é reconhecido pela densidade poética e fervor puritano. Sua mente digital replica a maestria homilética de sermões que transformaram Londres no séc. XIX, com foco na graça soberana e na paixão pela Palavra.',
      EN: 'Spurgeon is recognized for his poetic density and puritan fervor. His digital mind replicates the homiletic mastery of sermons that transformed 19th-century London, focusing on sovereign grace and passion for the Word.',
      ES: 'Spurgeon es reconocido por su densidad poética y fervor puritano. Su mente digital replica la maestría homilética de sermones que transformaron el Londres del siglo XIX, con enfoque en la gracia soberana y la pasión por la Palabra.',
    },
  },
  {
    id: 'martyn-lloyd-jones',
    name: 'Martyn Lloyd-Jones',
    image: lloydJonesImg,
    subtitle: { PT: 'O Doutor', EN: 'The Doctor', ES: 'El Doctor' },
    role: { PT: 'Método e Diagnóstico Lógico', EN: 'Method & Logical Diagnosis', ES: 'Método y Diagnóstico Lógico' },
    locked: true,
    badges: [
      { PT: '400+ pregações indexadas', EN: '400+ sermons indexed', ES: '400+ predicaciones indexadas' },
      { PT: '28 Milhões de Tokens Lidos', EN: '28 Million Tokens Read', ES: '28 Millones de Tokens Leídos' },
    ],
    skills: [
      { PT: 'Exposição Bíblica Sistemática', EN: 'Systematic Bible Exposition', ES: 'Exposición Bíblica Sistemática' },
      { PT: 'Diagnóstico Espiritual Preciso', EN: 'Precise Spiritual Diagnosis', ES: 'Diagnóstico Espiritual Preciso' },
      { PT: 'Pregação como "Lógica em Chamas"', EN: 'Preaching as "Logic on Fire"', ES: 'Predicación como "Lógica en Llamas"' },
    ],
    theology: {
      PT: 'Lloyd-Jones traz a precisão de um médico à pregação. Sua mente digital analisa textos com rigor exegético, construindo argumentos teológicos irrefutáveis com aplicação pastoral que penetra a alma.',
      EN: 'Lloyd-Jones brings a physician\'s precision to preaching. His digital mind analyzes texts with exegetical rigor, building irrefutable theological arguments with pastoral application that penetrates the soul.',
      ES: 'Lloyd-Jones trae la precisión de un médico a la predicación. Su mente digital analiza textos con rigor exegético, construyendo argumentos teológicos irrefutables con aplicación pastoral que penetra el alma.',
    },
  },
];

const pageTitle: Record<L, string> = {
  PT: 'Mentes Brilhantes',
  EN: 'Brilliant Minds',
  ES: 'Mentes Brillantes',
};

const pageSubtitle: Record<L, string> = {
  PT: 'Converse com as maiores mentes da história da pregação cristã. Cada mentor foi treinado com centenas de horas de material original.',
  EN: 'Converse with the greatest minds in Christian preaching history. Each mentor was trained on hundreds of hours of original material.',
  ES: 'Conversa con las mayores mentes de la historia de la predicación cristiana. Cada mentor fue entrenado con cientos de horas de material original.',
};

export default function MentesBrilhantes() {
  const { profile } = useAuth();
  const { lang } = useLanguage();
  const isFree = profile?.plan === 'free';

  const [selectedMind, setSelectedMind] = useState<MindData | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleMindClick = (mind: MindData) => {
    setSelectedMind(mind);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[hsl(43,55%,58%)]/20 flex items-center justify-center">
          <Brain className="h-5 w-5 text-[hsl(43,55%,58%)]" />
        </div>
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-2">
            {pageTitle[lang]}
            <Sparkles className="h-6 w-6 text-[hsl(43,55%,58%)]" />
          </h1>
          <p className="text-[15px] text-muted-foreground mt-1 max-w-2xl">
            {pageSubtitle[lang]}
          </p>
        </div>
      </div>

      {/* Premium Grid */}
      <div className="relative rounded-2xl border border-[hsl(43,55%,58%)]/20 bg-[hsl(210,40%,6%)] p-6 sm:p-8 overflow-hidden">
        {/* Subtle gold reflections */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[hsl(43,55%,58%)]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[hsl(43,55%,58%)]/3 rounded-full blur-3xl pointer-events-none" />

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {minds.map((mind, index) => (
            <MindCard
              key={mind.id}
              mind={mind}
              lang={lang}
              isFree={isFree}
              onClick={handleMindClick}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Profile Sheet */}
      {selectedMind && (
        <MindProfileSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          mind={selectedMind}
          lang={lang}
          isFree={isFree}
        />
      )}
    </div>
  );
}
