import { useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

const PLATAFORMAS = [
  { id: "instagram", label: "Instagram", dot: "#ec4899", chipBg: "#fce7f3", chipText: "#be185d" },
  { id: "linkedin", label: "LinkedIn", dot: "#3b82f6", chipBg: "#dbeafe", chipText: "#1d4ed8" },
  { id: "tiktok", label: "TikTok", dot: "#ef4444", chipBg: "#fee2e2", chipText: "#b91c1c" },
  { id: "facebook", label: "Facebook", dot: "#6366f1", chipBg: "#e0e7ff", chipText: "#4338ca" },
];

const EVENTOS_MOCK = [
  { dia: 1,  plataforma: "instagram", texto: "Gál 5:22-23" },
  { dia: 2,  plataforma: "linkedin",  texto: "Liderança Cristã" },
  { dia: 4,  plataforma: "facebook",  texto: "Devocional Manhã" },
  { dia: 5,  plataforma: "instagram", texto: "Carrossel Fé" },
  { dia: 5,  plataforma: "tiktok",    texto: "Reel Salmo 23" },
  { dia: 8,  plataforma: "instagram", texto: "João 3:16" },
  { dia: 9,  plataforma: "linkedin",  texto: "Propósito de Vida" },
  { dia: 11, plataforma: "facebook",  texto: "Aviso: Culto" },
  { dia: 12, plataforma: "tiktok",    texto: "Reel Gratidão" },
  { dia: 15, plataforma: "instagram", texto: "Filipenses 4:13" },
  { dia: 16, plataforma: "linkedin",  texto: "Sermão: Fé" },
  { dia: 18, plataforma: "instagram", texto: "Poesia: Amor" },
  { dia: 19, plataforma: "facebook",  texto: "Aviso: EBD" },
  { dia: 22, plataforma: "instagram", texto: "Prov 3:5-6" },
  { dia: 23, plataforma: "tiktok",    texto: "Reel Adoração" },
  { dia: 25, plataforma: "linkedin",  texto: "Missão e Chamado" },
  { dia: 26, plataforma: "instagram", texto: "Carrossel Final" },
  { dia: 29, plataforma: "facebook",  texto: "Reflexão Mensal" },
];

const WEEK_DAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

export function CalendarioEditorial() {
  const [filtros, setFiltros] = useState<string[]>(["instagram", "linkedin"]);

  const toggleFiltro = (id: string) =>
    setFiltros((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));

  // Abril 2025 começa em terça (offset 2)
  const firstDayOffset = 2;
  const daysInMonth = 30;
  const cells: Array<{ day: number; current: boolean }> = [];
  for (let i = firstDayOffset - 1; i >= 0; i--) cells.push({ day: 31 - i, current: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true });
  let next = 1;
  while (cells.length % 7 !== 0) cells.push({ day: next++, current: false });

  const today = 15;
  const visiveis = EVENTOS_MOCK.filter((e) => filtros.includes(e.plataforma));

  const stats = [
    { label: "Agendados", value: visiveis.length, sub: "esta semana" },
    { label: "Publicados", value: 23, sub: "este mês" },
    { label: "Plataformas", value: filtros.length, sub: "ativas" },
    { label: "Créditos", value: "142", sub: "disponíveis" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-xl text-[#1f172a]">Calendário Editorial</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <button className="p-1 hover:bg-[#f5f3ff] rounded">
              <ChevronLeft className="w-4 h-4 text-[#6b7280]" />
            </button>
            <span className="text-sm font-medium text-[#1f172a]">Abril 2025</span>
            <button className="p-1 hover:bg-[#f5f3ff] rounded">
              <ChevronRight className="w-4 h-4 text-[#6b7280]" />
            </button>
          </div>
        </div>
        <button className="h-9 px-3 rounded-lg border border-[#c4b5fd] bg-[#ede9fe] text-[#7c3aed] text-sm font-medium hover:bg-[#e0d9ff] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Gerar calendário
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#f5f3ff] border border-[#e5e7eb] rounded-[10px] py-3 px-3.5">
            <div className="text-[10px] uppercase tracking-wider font-medium text-[#9ca3af]">{s.label}</div>
            <div className="text-2xl font-semibold text-[#1f172a] mt-0.5 leading-tight">{s.value}</div>
            <div className="text-[10px] text-[#16a34a] mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {PLATAFORMAS.map((p) => {
          const active = filtros.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggleFiltro(p.id)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                active
                  ? "bg-[#ede9fe] border-[#c4b5fd] text-[#7c3aed] font-medium"
                  : "bg-white border-[#e5e7eb] text-[#6b7280]"
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: p.dot }} />
              {p.label}
            </button>
          );
        })}
      </div>

      <div>
        <div className="grid grid-cols-7 mb-2">
          {WEEK_DAYS.map((d) => (
            <div key={d} className="text-[10px] uppercase tracking-wider text-[#9ca3af] text-center pb-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, idx) => {
            const isToday = cell.current && cell.day === today;
            const dayEvents = cell.current ? visiveis.filter((e) => e.dia === cell.day) : [];
            return (
              <div
                key={idx}
                className={`min-h-[80px] p-1.5 rounded-lg bg-white transition-colors hover:bg-[#faf5ff] hover:border-[#c4b5fd] ${
                  isToday ? "border-[1.5px] border-[#7c3aed] bg-[#faf5ff]" : "border border-[#f3f4f6]"
                } ${!cell.current ? "opacity-40" : ""}`}
              >
                <div className={`text-xs font-medium ${isToday ? "text-[#7c3aed] font-semibold" : "text-[#6b7280]"}`}>
                  {cell.day}
                </div>
                <div className="space-y-0.5 mt-1">
                  {dayEvents.map((e, i) => {
                    const plat = PLATAFORMAS.find((p) => p.id === e.plataforma)!;
                    return (
                      <div
                        key={i}
                        className="rounded px-1.5 py-0.5 text-[9px] font-medium overflow-hidden text-ellipsis whitespace-nowrap"
                        style={{ background: plat.chipBg, color: plat.chipText }}
                      >
                        {e.texto}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
