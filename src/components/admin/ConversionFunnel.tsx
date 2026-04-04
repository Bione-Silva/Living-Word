import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const steps = [
  { label: 'Visitantes Landing', value: 7400, color: 'bg-violet-500' },
  { label: 'Cadastros (Leads)', value: 1280, color: 'bg-blue-500' },
  { label: 'Trial Ativado', value: 840, color: 'bg-cyan-500' },
  { label: 'Conversão Paga', value: 320, color: 'bg-emerald-500' },
];

export function ConversionFunnel() {
  const max = steps[0].value;

  return (
    <Card className="admin-card border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold admin-text">Funil de Conversão</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((s, i) => {
            const pct = Math.round((s.value / max) * 100);
            const convRate = i > 0 ? ((s.value / steps[i - 1].value) * 100).toFixed(1) : null;
            return (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm admin-text">{s.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold admin-text">{s.value.toLocaleString('pt-BR')}</span>
                    {convRate && (
                      <span className="text-[10px] admin-muted">({convRate}%)</span>
                    )}
                  </div>
                </div>
                <div className="h-8 rounded-lg bg-muted/20 overflow-hidden">
                  <div
                    className={`h-full rounded-lg ${s.color} transition-all duration-1000 flex items-center justify-end pr-3`}
                    style={{ width: `${pct}%` }}
                  >
                    <span className="text-[10px] font-bold text-white">{pct}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
