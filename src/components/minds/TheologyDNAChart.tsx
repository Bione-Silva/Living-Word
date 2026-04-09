import { Brain } from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer,
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
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
