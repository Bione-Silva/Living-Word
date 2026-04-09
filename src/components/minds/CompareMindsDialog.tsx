import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { type MindFullData } from '@/data/minds';
import { Brain, X, ArrowLeftRight } from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';

type L = 'PT' | 'EN' | 'ES';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  minds: MindFullData[];
  lang: L;
}

const labels = {
  title: { PT: 'Comparar Mentes', EN: 'Compare Minds', ES: 'Comparar Mentes' },
  subtitle: { PT: 'Selecione 2 mentores para comparar seus perfis teológicos', EN: 'Select 2 mentors to compare their theological profiles', ES: 'Selecciona 2 mentores para comparar sus perfiles teológicos' },
  select: { PT: 'Selecionar', EN: 'Select', ES: 'Seleccionar' },
  selected: { PT: 'Selecionado', EN: 'Selected', ES: 'Seleccionado' },
  clear: { PT: 'Limpar seleção', EN: 'Clear selection', ES: 'Limpiar selección' },
  vs: { PT: 'versus', EN: 'versus', ES: 'versus' },
};

function shortLabel(label: string): string {
  const map: Record<string, string> = {
    'Teologia Sistemática': 'Teol. Sist.', 'Systematic Theology': 'Syst. Theo.', 'Teología Sistemática': 'Teol. Sist.',
    'Apelo Emocional': 'Apelo Emoc.', 'Emotional Appeal': 'Emot. Appeal', 'Apelación Emocional': 'Apel. Emoc.',
    Aconselhamento: 'Aconselh.', Counseling: 'Counseling', Consejería: 'Consejería',
  };
  return map[label] || label;
}

function CompareTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[hsl(30,15%,85%)] rounded-lg px-3 py-2 shadow-md">
      <p className="text-xs font-semibold text-[hsl(220,15%,20%)] mb-1">{payload[0]?.payload?.axis}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-[11px] text-[hsl(220,10%,40%)]">{p.name}:</span>
          <span className="text-[11px] font-mono font-bold">{p.value}%</span>
        </div>
      ))}
    </div>
  );
}

export function CompareMindsDialog({ open, onOpenChange, minds, lang }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const mind1 = minds.find(m => m.id === selected[0]);
  const mind2 = minds.find(m => m.id === selected[1]);

  const chartData = mind1 && mind2
    ? mind1.theologyDNA.map((d, i) => ({
        axis: d.axis[lang],
        short: shortLabel(d.axis[lang]),
        [mind1.name]: d.value,
        [mind2.name]: mind2.theologyDNA[i]?.value ?? 0,
      }))
    : [];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setSelected([]); onOpenChange(v); }}>
      <DialogContent className="bg-white border-[hsl(30,15%,85%)] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="font-display text-xl flex items-center justify-center gap-2 text-[hsl(220,15%,15%)]">
            <ArrowLeftRight className="h-5 w-5 text-[hsl(35,45%,45%)]" />
            {labels.title[lang]}
          </DialogTitle>
          <DialogDescription className="text-[hsl(220,10%,50%)] text-sm">
            {labels.subtitle[lang]}
          </DialogDescription>
        </DialogHeader>

        {/* Mind selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
          {minds.map(m => {
            const isSelected = selected.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => toggle(m.id)}
                className={`flex items-center gap-2 p-2 rounded-xl border transition-all text-left ${
                  isSelected
                    ? 'border-[hsl(35,50%,50%)] bg-[hsl(35,40%,95%)] ring-1 ring-[hsl(35,50%,50%)]'
                    : 'border-[hsl(30,15%,90%)] bg-white hover:border-[hsl(35,30%,80%)]'
                }`}
              >
                <img src={m.image} alt={m.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[hsl(220,15%,20%)] truncate">{m.name}</p>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-[hsl(35,50%,45%)]">
                      {selected.indexOf(m.id) === 0 ? '① ' : '② '}
                      {labels.selected[lang]}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {selected.length > 0 && (
          <button onClick={() => setSelected([])} className="text-xs text-[hsl(220,10%,55%)] hover:text-[hsl(220,10%,35%)] underline mx-auto block mt-1">
            {labels.clear[lang]}
          </button>
        )}

        {/* Comparison radar */}
        {mind1 && mind2 && (
          <div className="mt-4 space-y-4">
            {/* VS Header */}
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <img src={mind1.image} alt={mind1.name} className="w-10 h-10 rounded-full object-cover border-2 border-[hsl(270,40%,55%)]" />
                <span className="text-sm font-bold text-[hsl(220,15%,20%)]">{mind1.name}</span>
              </div>
              <span className="text-xs font-mono text-[hsl(220,10%,60%)] uppercase">{labels.vs[lang]}</span>
              <div className="flex items-center gap-2">
                <img src={mind2.image} alt={mind2.name} className="w-10 h-10 rounded-full object-cover border-2 border-[hsl(145,50%,42%)]" />
                <span className="text-sm font-bold text-[hsl(220,15%,20%)]">{mind2.name}</span>
              </div>
            </div>

            {/* Radar */}
            <div className="w-full flex justify-center">
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData}>
                  <PolarGrid stroke="hsl(30,15%,85%)" />
                  <PolarAngleAxis dataKey="short" tick={{ fill: 'hsl(220,10%,35%)', fontSize: 10, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name={mind1.name} dataKey={mind1.name} stroke="hsl(270,40%,55%)" fill="hsl(270,40%,55%)" fillOpacity={0.25} strokeWidth={2} />
                  <Radar name={mind2.name} dataKey={mind2.name} stroke="hsl(145,50%,42%)" fill="hsl(145,50%,42%)" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip content={<CompareTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Dimension comparison bars */}
            <div className="space-y-2">
              {chartData.map((d, i) => {
                const v1 = d[mind1.name] as number;
                const v2 = d[mind2.name] as number;
                return (
                  <div key={i} className="space-y-0.5">
                    <p className="text-[11px] font-semibold text-[hsl(220,15%,25%)]">{d.axis}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono w-6 text-right text-[hsl(270,40%,55%)]">{v1}</span>
                      <div className="flex-1 flex h-2 rounded-full overflow-hidden bg-[hsl(30,15%,92%)]">
                        <div className="h-full bg-[hsl(270,40%,55%)] rounded-l-full" style={{ width: `${v1}%` }} />
                      </div>
                      <div className="flex-1 flex h-2 rounded-full overflow-hidden bg-[hsl(30,15%,92%)]">
                        <div className="h-full bg-[hsl(145,50%,42%)] rounded-l-full" style={{ width: `${v2}%` }} />
                      </div>
                      <span className="text-[10px] font-mono w-6 text-[hsl(145,50%,35%)]">{v2}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
