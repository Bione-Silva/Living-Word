import { Ruler } from "lucide-react";

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
}

export function PainelFormato({ plataformas, togglePlataforma, qtdSlides, setQtdSlides, onNext }: Props) {
  const renderToggle = (label: string) => {
    const sel = plataformas.includes(label);
    return (
      <button
        key={label}
        type="button"
        onClick={() => togglePlataforma(label)}
        className={`text-[13px] px-3.5 py-1.5 rounded-lg border transition-colors ${
          sel
            ? "bg-[#ede9fe] border-[#c4b5fd] text-[#7c3aed] font-medium"
            : "bg-white border-[#e2deff] text-[#6b7280] hover:border-[#c4b5fd]"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="bg-[#f5f3ff] border border-[#e2deff] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3.5">
        <Ruler className="w-4 h-4 text-[#7c3aed]" />
        <h3 className="font-bold text-base text-[#1f172a]">Formato e plataforma</h3>
      </div>

      <div className="space-y-3.5">
        <div>
          <label className="text-[11px] uppercase tracking-wider font-semibold text-[#9ca3af] block mb-2">
            Instagram
          </label>
          <div className="flex flex-wrap gap-2">{INSTAGRAM.map(renderToggle)}</div>
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wider font-semibold text-[#9ca3af] block mb-2">
            LinkedIn · TikTok · Facebook
          </label>
          <div className="flex flex-wrap gap-2">{OUTRAS.map(renderToggle)}</div>
        </div>

        <div>
          <label className="text-[13px] font-medium text-[#1f172a] block mb-2">Quantidade de slides</label>
          <div className="flex gap-2">
            {SLIDES.map((s) => {
              const sel = qtdSlides === s.n;
              return (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => setQtdSlides(s.n)}
                  className={`w-[52px] h-[46px] rounded-[9px] flex flex-col items-center justify-center transition-colors ${
                    sel
                      ? "bg-[#7c3aed] text-white"
                      : "bg-white border border-[#e2deff] text-[#6b7280] hover:bg-[#f5f3ff]"
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
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full mt-4 py-2.5 rounded-[10px] bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-medium transition-colors"
      >
        Próximo: Publicar →
      </button>
    </div>
  );
}
