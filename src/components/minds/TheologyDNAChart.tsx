import { Brain } from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip,
} from 'recharts';

type L = 'PT' | 'EN' | 'ES';

interface TheologyDNAItem {
  axis: Record<L, string>;
  value: number;
}

interface Props {
  data: TheologyDNAItem[];
  lang: L;
}

const labels = {
  title: { PT: 'DNA Teológico', EN: 'Theological DNA', ES: 'ADN Teológico' },
  subtitle: { PT: 'Impressão digital teológica desta mente', EN: 'Theological fingerprint of this mind', ES: 'Huella teológica de esta mente' },
};

const axisDescriptions: Record<string, Record<L, string>> = {
  Evangelismo: { PT: 'Foco em evangelização e alcance de não-crentes', EN: 'Focus on evangelization and reaching non-believers', ES: 'Enfoque en evangelización y alcance de no creyentes' },
  Profecia: { PT: 'Ênfase em revelação profética e dons espirituais', EN: 'Emphasis on prophetic revelation and spiritual gifts', ES: 'Énfasis en revelación profética y dones espirituales' },
  'Teologia Sistemática': { PT: 'Profundidade doutrinária e rigor teológico', EN: 'Doctrinal depth and theological rigor', ES: 'Profundidad doctrinal y rigor teológico' },
  Aconselhamento: { PT: 'Habilidade pastoral de cuidado e orientação pessoal', EN: 'Pastoral ability for care and personal guidance', ES: 'Habilidad pastoral de cuidado y orientación personal' },
  Avivamento: { PT: 'Paixão por renovação espiritual e mover do Espírito', EN: 'Passion for spiritual renewal and move of the Spirit', ES: 'Pasión por renovación espiritual y mover del Espíritu' },
  'Apelo Emocional': { PT: 'Capacidade de tocar corações e gerar resposta emocional', EN: 'Ability to touch hearts and generate emotional response', ES: 'Capacidad de tocar corazones y generar respuesta emocional' },
  Soberania: { PT: 'Ênfase na soberania de Deus e eleição divina', EN: 'Emphasis on God\'s sovereignty and divine election', ES: 'Énfasis en la soberanía de Dios y elección divina' },
};

// Map EN/ES axis names back to PT key for legend lookup
const axisKeyMap: Record<string, string> = {
  Evangelism: 'Evangelismo', Evangelismo: 'Evangelismo',
  Prophecy: 'Profecia', Profecía: 'Profecia', Profecia: 'Profecia',
  'Systematic Theology': 'Teologia Sistemática', 'Teología Sistemática': 'Teologia Sistemática', 'Teologia Sistemática': 'Teologia Sistemática',
  Counseling: 'Aconselhamento', Consejería: 'Aconselhamento', Aconselhamento: 'Aconselhamento',
  Revival: 'Avivamento', Avivamiento: 'Avivamento', Avivamento: 'Avivamento',
  'Emotional Appeal': 'Apelo Emocional', 'Apelación Emocional': 'Apelo Emocional', 'Apelo Emocional': 'Apelo Emocional',
  Sovereignty: 'Soberania', Soberanía: 'Soberania', Soberania: 'Soberania',
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { axis, value } = payload[0].payload;
  return (
    <div className="bg-white border border-[hsl(30,15%,85%)] rounded-lg px-3 py-2 shadow-md">
      <p className="text-sm font-semibold text-[hsl(220,15%,20%)]">{axis}</p>
      <p className="text-xs text-[hsl(35,50%,45%)] font-mono">{value}/100</p>
    </div>
  );
}

export function TheologyDNAChart({ data, lang }: Props) {
  const chartData = data.map(d => ({ axis: d.axis[lang], value: d.value }));

  return (
    <section className="mt-5 rounded-2xl border border-[hsl(30,15%,88%)] bg-white p-7 sm:p-10">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[hsl(35,35%,93%)] flex items-center justify-center border border-[hsl(35,25%,85%)]">
          <Brain className="h-5 w-5 text-[hsl(35,45%,45%)]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[hsl(220,15%,20%)]">{labels.title[lang]}</h2>
          <p className="text-xs text-[hsl(220,10%,55%)]">{labels.subtitle[lang]}</p>
        </div>
      </div>

      <div className="w-full flex justify-center">
        <ResponsiveContainer width="100%" height={280} maxHeight={280}>
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="hsl(30,15%,85%)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: 'hsl(220,10%,35%)', fontSize: 11, fontWeight: 600 }}
            />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="DNA"
              dataKey="value"
              stroke="hsl(35,50%,45%)"
              fill="hsl(270,40%,55%)"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 pl-0 sm:pl-2">
        {chartData.map((d, i) => {
          const key = axisKeyMap[d.axis] || d.axis;
          const desc = axisDescriptions[key];
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-1 w-2 h-2 rounded-full bg-[hsl(270,40%,55%)] shrink-0" />
              <div>
                <p className="text-xs font-semibold text-[hsl(220,15%,20%)]">{d.axis}</p>
                {desc && <p className="text-[11px] text-[hsl(220,10%,50%)] leading-snug">{desc[lang]}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
