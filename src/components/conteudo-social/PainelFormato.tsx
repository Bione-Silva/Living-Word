const INSTAGRAM = ["Feed / Carrossel", "Stories / Reels", "Quadrado"];
const OUTRAS = ["LinkedIn Post", "TikTok / Shorts", "Facebook"];
const SLIDES = [1, 3, 5, 7];

interface Props {
  plataformas: string[];
  togglePlataforma: (p: string) => void;
  slides: number;
  setSlides: (n: number) => void;
  onNext: () => void;
  collapsed?: boolean;
}

export function PainelFormato({ plataformas, togglePlataforma, slides, setSlides, onNext, collapsed }: Props) {
  if (collapsed) {
    return (
      <div className="text-xs text-[#6b7280]">
        <span className="font-medium text-[#1f172a]">Formato:</span>{" "}
        {plataformas.length} plataforma(s) · {slides} {slides === 1 ? "arte" : "slides"}
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
        className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
          sel
            ? "bg-[#ede9fe] border-[#7c3aed] text-[#7c3aed]"
            : "bg-white border-[#e5e7eb] text-[#6b7280] hover:border-[#c4b5fd]"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-[#6b7280] tracking-wider uppercase">Instagram</label>
        <div className="flex flex-wrap gap-1.5">{INSTAGRAM.map(renderToggle)}</div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-[#6b7280] tracking-wider uppercase">
          LinkedIn · TikTok · Facebook
        </label>
        <div className="flex flex-wrap gap-1.5">{OUTRAS.map(renderToggle)}</div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#1f172a]">Quantidade de slides</label>
        <div className="grid grid-cols-4 gap-1.5">
          {SLIDES.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setSlides(n)}
              className={`h-9 rounded-md text-xs font-semibold transition-colors ${
                slides === n
                  ? "bg-[#7c3aed] text-white"
                  : "bg-white border border-[#e5e7eb] text-[#6b7280] hover:border-[#c4b5fd]"
              }`}
            >
              {n === 1 ? "1 Arte" : `${n} Slides`}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full h-10 rounded-md bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-semibold transition-colors"
      >
        Próximo: Publicar →
      </button>
    </div>
  );
}
