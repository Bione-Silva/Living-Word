const INSTAGRAM = ["Feed / Carrossel", "Stories / Reels", "Quadrado"];
const OUTRAS = ["LinkedIn Post", "TikTok / Shorts", "Facebook"];
const SLIDES = [
  { n: 1, sub: "arte" },
  { n: 3, sub: "slides" },
  { n: 5, sub: "slides" },
  { n: 7, sub: "slides" },
];

interface Props {
  plataformas: string[];
  togglePlataforma: (p: string) => void;
  qtdSlides: number;
  setQtdSlides: (n: number) => void;
  onNext: () => void;
  collapsed?: boolean;
}

export function PainelFormato({ plataformas, togglePlataforma, qtdSlides, setQtdSlides, onNext, collapsed }: Props) {
  if (collapsed) {
    return (
      <div className="text-xs text-[#6b7280]">
        <span className="font-medium text-[#1f172a]">Formato:</span>{" "}
        {plataformas.length} plataforma(s) · {qtdSlides} {qtdSlides === 1 ? "arte" : "slides"}
      </div>
    );
  }

  const renderToggle = (label: string) => {
    const sel = plataformas.includes(label);
    return (
      <button
        key={label}
        type="button"
        onClick={() => togglePlataforma(label)}
        className={`text-xs px-3 py-1.5 rounded-[7px] border transition-colors ${
          sel
            ? "bg-[#ede9fe] border-[#c4b5fd] text-[#7c3aed] font-medium"
            : "bg-white border-[#e5e7eb] text-[#6b7280] hover:border-[#c4b5fd]"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="bg-[#f5f3ff] border border-[#e5e7eb] rounded-xl p-4 space-y-4">
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9ca3af]">Instagram</label>
        <div className="flex flex-wrap gap-1.5">{INSTAGRAM.map(renderToggle)}</div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9ca3af]">
          LinkedIn · TikTok · Facebook
        </label>
        <div className="flex flex-wrap gap-1.5">{OUTRAS.map(renderToggle)}</div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#1f172a]">Quantidade de slides</label>
        <div className="flex gap-2">
          {SLIDES.map((s) => {
            const sel = qtdSlides === s.n;
            return (
              <button
                key={s.n}
                type="button"
                onClick={() => setQtdSlides(s.n)}
                className={`flex-1 h-11 rounded-lg flex flex-col items-center justify-center transition-colors ${
                  sel
                    ? "bg-[#7c3aed] text-white"
                    : "bg-white border border-[#e5e7eb] text-[#6b7280] hover:border-[#c4b5fd]"
                }`}
              >
                <span className="text-base font-semibold leading-none">{s.n}</span>
                <span className={`text-[9px] leading-none mt-0.5 ${sel ? "text-white/80" : "text-[#9ca3af]"}`}>
                  {s.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full h-10 rounded-lg bg-[#7c3aed] hover:bg-[#8b5cf6] text-white text-sm font-semibold transition-colors"
      >
        Próximo: Publicar →
      </button>
    </div>
  );
}
