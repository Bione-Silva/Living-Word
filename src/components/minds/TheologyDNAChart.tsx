import { Brain } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
  dominant: { PT: 'Traço dominante', EN: 'Dominant trait', ES: 'Rasgo dominante' },
  strong: { PT: 'Forte em', EN: 'Strong in', ES: 'Fuerte en' },
  moderate: { PT: 'Moderado', EN: 'Moderate', ES: 'Moderado' },
  low: { PT: 'Menor ênfase', EN: 'Lower emphasis', ES: 'Menor énfasis' },
  profileLabel: { PT: 'Perfil Resumido', EN: 'Profile Summary', ES: 'Perfil Resumido' },
};

const axisDescriptions: Record<string, Record<L, string>> = {
  Evangelismo: { PT: 'Evangelização e alcance', EN: 'Evangelization and outreach', ES: 'Evangelización y alcance' },
  Profecia: { PT: 'Revelação profética e dons', EN: 'Prophetic revelation and gifts', ES: 'Revelación profética y dones' },
  'Teologia Sistemática': { PT: 'Rigor doutrinário', EN: 'Doctrinal rigor', ES: 'Rigor doctrinal' },
  Aconselhamento: { PT: 'Cuidado e orientação pastoral', EN: 'Pastoral care and guidance', ES: 'Cuidado y orientación pastoral' },
  Avivamento: { PT: 'Renovação espiritual', EN: 'Spiritual renewal', ES: 'Renovación espiritual' },
  'Apelo Emocional': { PT: 'Resposta emocional e convicção', EN: 'Emotional response and conviction', ES: 'Respuesta emocional y convicción' },
  Soberania: { PT: 'Soberania divina e eleição', EN: 'Divine sovereignty and election', ES: 'Soberanía divina y elección' },
};

const axisKeyMap: Record<string, string> = {
  Evangelism: 'Evangelismo', Evangelismo: 'Evangelismo',
  Prophecy: 'Profecia', Profecía: 'Profecia', Profecia: 'Profecia',
  'Systematic Theology': 'Teologia Sistemática', 'Teología Sistemática': 'Teologia Sistemática', 'Teologia Sistemática': 'Teologia Sistemática',
  Counseling: 'Aconselhamento', Consejería: 'Aconselhamento', Aconselhamento: 'Aconselhamento',
  Revival: 'Avivamento', Avivamiento: 'Avivamento', Avivamento: 'Avivamento',
  'Emotional Appeal': 'Apelo Emocional', 'Apelación Emocional': 'Apelo Emocional', 'Apelo Emocional': 'Apelo Emocional',
  Sovereignty: 'Soberania', Soberanía: 'Soberania', Soberania: 'Soberania',
};

function shortLabel(label: string): string {
  const map: Record<string, string> = {
    'Teologia Sistemática': 'Teol. Sist.',
    'Systematic Theology': 'Syst. Theo.',
    'Teología Sistemática': 'Teol. Sist.',
    'Apelo Emocional': 'Apelo Emoc.',
    'Emotional Appeal': 'Emot. Appeal',
    'Apelación Emocional': 'Apel. Emoc.',
    Aconselhamento: 'Aconselh.',
    Counseling: 'Counseling',
    Consejería: 'Consejería',
  };
  return map[label] || label;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { axis, value } = payload[0].payload;
  return (
    <div className="bg-white border border-[hsl(270,43%,92%)] rounded-lg px-3 py-2 shadow-md">
      <p className="text-sm font-semibold text-[hsl(220,15%,20%)]">{axis}</p>
      <div className="flex items-center gap-2 mt-1">
        <div className="w-16 h-1.5 rounded-full bg-[hsl(270,43%,92%)] overflow-hidden">
          <div className="h-full rounded-full bg-[hsl(270,40%,55%)]" style={{ width: `${value}%` }} />
        </div>
        <p className="text-xs text-[hsl(257,61%,32%)] font-mono font-bold">{value}%</p>
      </div>
    </div>
  );
}

function getStrengthColor(value: number): string {
  if (value >= 85) return 'bg-[hsl(145,50%,42%)]'; // green — dominant
  if (value >= 65) return 'bg-[hsl(263,70%,50%)]';   // amber — strong
  if (value >= 45) return 'bg-[hsl(220,10%,65%)]';  // gray — moderate
  return 'bg-[hsl(220,10%,80%)]';                   // light — low
}

function getStrengthLabel(value: number, lang: L): string {
  if (value >= 85) return labels.dominant[lang];
  if (value >= 65) return labels.strong[lang];
  if (value >= 45) return labels.moderate[lang];
  return labels.low[lang];
}

function getStrengthTextColor(value: number): string {
  if (value >= 85) return 'text-[hsl(145,50%,35%)]';
  if (value >= 65) return 'text-[hsl(257,61%,32%)]';
  return 'text-[hsl(220,10%,55%)]';
}

/** Build a short profile summary based on top dimensions */
function buildProfileSummary(data: { axis: string; value: number }[], lang: L): string {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, 2).map(d => d.axis);
  const bottom = sorted.slice(-1).map(d => d.axis);

  const templates: Record<L, (t: string[], b: string[]) => string> = {
    PT: (t, b) => `Mente com forte inclinação para ${t.join(' e ')}, com menor ênfase em ${b[0]}.`,
    EN: (t, b) => `Mind with strong inclination toward ${t.join(' and ')}, with lower emphasis on ${b[0]}.`,
    ES: (t, b) => `Mente con fuerte inclinación hacia ${t.join(' y ')}, con menor énfasis en ${b[0]}.`,
  };

  return templates[lang](top, bottom);
}

export function TheologyDNAChart({ data, lang }: Props) {
  const [animated, setAnimated] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const chartData = data.map(d => ({
    axis: d.axis[lang],
    short: shortLabel(d.axis[lang]),
    value: d.value,
  }));

  const sorted = [...chartData].sort((a, b) => b.value - a.value);
  const summary = buildProfileSummary(chartData, lang);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setAnimated(true); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="rounded-2xl border border-[hsl(270,43%,92%)] bg-white p-5 sm:p-7 md:p-10">
      <div className="flex items-center gap-3 mb-4 sm:mb-5">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[hsl(252,100%,99%)] flex items-center justify-center border border-[hsl(270,43%,92%)]">
          <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-[hsl(257,61%,32%)]" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[hsl(220,15%,20%)]">{labels.title[lang]}</h2>
          <p className="text-[11px] sm:text-xs text-[hsl(220,10%,55%)]">{labels.subtitle[lang]}</p>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="w-full flex justify-center -mx-2 sm:mx-0">
        <ResponsiveContainer width="100%" height={250} minWidth={260}>
          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData}>
            <PolarGrid stroke="hsl(270, 43%, 92%)" />
            <PolarAngleAxis
              dataKey="short"
              tick={{ fill: 'hsl(220,10%,35%)', fontSize: 10, fontWeight: 600 }}
            />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="DNA"
              dataKey="value"
              stroke="hsl(257, 61%, 32%)"
              fill="hsl(270,40%,55%)"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Profile summary */}
      <div className="mt-4 mx-auto max-w-md px-4 py-3 rounded-xl bg-[hsl(252,100%,99%)] border border-[hsl(252,100%,99%)] text-center">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(263,70%,50%)] mb-1">{labels.profileLabel[lang]}</p>
        <p className="text-[13px] text-[hsl(220,10%,30%)] leading-relaxed">{summary}</p>
      </div>

      {/* Ranked dimension bars */}
      <div className="mt-5 space-y-2.5">
        {sorted.map((d, i) => {
          const key = axisKeyMap[d.axis] || d.axis;
          const desc = axisDescriptions[key];
          return (
            <div key={i} className="flex items-center gap-3">
              {/* Label + desc */}
              <div className="w-[40%] sm:w-[35%] min-w-0">
                <p className="text-xs font-semibold text-[hsl(220,15%,20%)] truncate">{d.axis}</p>
                {desc && <p className="text-[10px] text-[hsl(220,10%,55%)] truncate">{desc[lang]}</p>}
              </div>
              {/* Bar */}
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-2.5 rounded-full bg-[hsl(252,100%,99%)] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${getStrengthColor(d.value)}`}
                    style={{
                      width: animated ? `${d.value}%` : '0%',
                      transitionDelay: `${i * 80}ms`,
                    }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-[hsl(220,10%,30%)] w-8 text-right">{d.value}</span>
              </div>
              {/* Strength tag */}
              <span className={`hidden sm:inline text-[10px] font-semibold ${getStrengthTextColor(d.value)} whitespace-nowrap`}>
                {getStrengthLabel(d.value, lang)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
