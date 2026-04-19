import { useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

const PLATAFORMAS = [
  { id: "instagram", label: "Instagram", dot: "#ec4899", chipBg: "bg-pink-100", chipText: "text-pink-700" },
  { id: "linkedin", label: "LinkedIn", dot: "#3b82f6", chipBg: "bg-blue-100", chipText: "text-blue-700" },
  { id: "tiktok", label: "TikTok", dot: "#ef4444", chipBg: "bg-red-100", chipText: "text-red-700" },
  { id: "facebook", label: "Facebook", dot: "#6366f1", chipBg: "bg-indigo-100", chipText: "text-indigo-700" },
];

const MOCK_EVENTS: Array<{ day: number; platform: string; title: string }> = [
  { day: 2, platform: "instagram", title: "João 3:16" },
  { day: 3, platform: "linkedin", title: "Liderança" },
  { day: 5, platform: "instagram", title: "Salmo 23" },
  { day: 7, platform: "facebook", title: "Aviso culto" },
  { day: 9, platform: "instagram", title: "Reels Fé" },
  { day: 10, platform: "linkedin", title: "Devocional" },
  { day: 12, platform: "tiktok", title: "Versículo" },
  { day: 14, platform: "instagram", title: "Carrossel" },
  { day: 16, platform: "linkedin", title: "Reflexão" },
  { day: 18, platform: "instagram", title: "Stories" },
  { day: 20, platform: "facebook", title: "Evento" },
  { day: 22, platform: "tiktok", title: "Short Fé" },
  { day: 24, platform: "instagram", title: "Romanos 8" },
  { day: 27, platform: "linkedin", title: "Liderança" },
  { day: 29, platform: "instagram", title: "Devocional" },
];

const WEEK_DAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

export function CalendarioEditorial() {
  const [filtros, setFiltros] = useState<string[]>(["instagram", "linkedin"]);

  const toggleFiltro = (id: string) => {
    setFiltros((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  // Abril 2025: começa numa terça (idx 2)
  const firstDayOffset = 2;
  const daysInMonth = 30;
  const cells: Array<{ day: number; current: boolean }> = [];
  // Dias do mês anterior (março)
  for (let i = firstDayOffset - 1; i >= 0; i--) cells.push({ day: 31 - i, current: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true });
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - firstDayOffset + 1, current: false });

  const today = 15;
  const visibleEvents = MOCK_EVENTS.filter((e) => filtros.includes(e.platform));

  const stats = [
    { label: "Agendados", value: 8, sub: "esta semana" },
    { label: "Publicados", value: 23, sub: "este mês" },
    { label: "Plataformas", value: filtros.length, sub: "ativas" },
    { label: "Créditos", value: 142, sub: "disponíveis" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#1f172a]">Calendário Editorial</h2>
          <div className="flex items-center gap-2 mt-1">
            <button className="p-1 hover:bg-[#f9f8ff] rounded">
              <ChevronLeft className="w-4 h-4 text-[#6b7280]" />
            </button>
            <span className="text-sm font-medium text-[#1f172a]">Abril 2025</span>
            <button className="p-1 hover:bg-[#f9f8ff] rounded">
              <ChevronRight className="w-4 h-4 text-[#6b7280]" />
            </button>
          </div>
        </div>
        <button className="h-9 px-3 rounded-md border border-[#7c3aed] text-[#7c3aed] text-sm font-medium hover:bg-[#ede9fe] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Gerar calendário
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-[#e5e7eb] bg-[#f9f8ff] p-3">
            <div className="text-[10px] font-medium text-[#6b7280] uppercase tracking-wider">{s.label}</div>
            <div className="text-2xl font-bold text-[#1f172a] mt-0.5">{s.value}</div>
            <div className="text-[10px] text-[#6b7280] mt-0.5">{s.sub}</div>
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
                  ? "bg-[#ede9fe] border-[#c4b5fd] text-[#7c3aed]"
                  : "bg-white border-[#e5e7eb] text-[#6b7280]"
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: p.dot }} />
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-[#e5e7eb] bg-white overflow-hidden">
        <div className="grid grid-cols-7 border-b border-[#e5e7eb]">
          {WEEK_DAYS.map((d) => (
            <div key={d} className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider py-2 text-center">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            const isToday = cell.current && cell.day === today;
            const dayEvents = cell.current ? visibleEvents.filter((e) => e.day === cell.day) : [];
            return (
              <div
                key={idx}
                className={`min-h-[80px] p-1.5 border-r border-b border-[#f3f4f6] hover:bg-[#faf5ff] transition-colors ${
                  !cell.current ? "opacity-40" : ""
                } ${isToday ? "border-[1.5px] border-[#7c3aed] bg-[#faf5ff]" : ""}`}
              >
                <div className="text-sm font-medium text-[#1f172a]">{cell.day}</div>
                <div className="space-y-0.5 mt-1">
                  {dayEvents.map((e, i) => {
                    const plat = PLATAFORMAS.find((p) => p.id === e.platform)!;
                    return (
                      <div
                        key={i}
                        className={`${plat.chipBg} ${plat.chipText} rounded text-[9px] px-1.5 py-0.5 truncate font-medium`}
                      >
                        {e.title}
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
