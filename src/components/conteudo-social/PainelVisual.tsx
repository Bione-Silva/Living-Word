const MODOS = [
  { id: "biblica", label: "Época Bíblica", desc: "Oriente Médio antigo, cinematográfico", grad: "from-amber-900 via-yellow-800 to-stone-900" },
  { id: "moderna", label: "Moderna", desc: "Fotografia editorial contemporânea", grad: "from-blue-900 via-indigo-900 to-slate-900" },
  { id: "simbolica", label: "Simbólica", desc: "Elementos limpos: cruz, luz, trigo", grad: "from-emerald-900 via-green-800 to-teal-900" },
];

export const PALETAS = [
  { id: "dourado", label: "Dourado", grad: "from-yellow-400 to-amber-600" },
  { id: "noturno", label: "Noturno", grad: "from-slate-800 to-indigo-900" },
  { id: "natureza", label: "Natureza", grad: "from-green-500 to-emerald-700" },
  { id: "rosa", label: "Rosa", grad: "from-pink-400 to-rose-600" },
  { id: "deserto", label: "Deserto", grad: "from-orange-300 to-amber-700" },
  { id: "oceano", label: "Oceano", grad: "from-cyan-400 to-blue-700" },
  { id: "real", label: "Real", grad: "from-purple-500 to-violet-800" },
  { id: "sereno", label: "Sereno", grad: "from-sky-300 to-blue-500" },
];

interface Props {
  modo: string;
  setModo: (m: string) => void;
  paleta: string;
  setPaleta: (p: string) => void;
  variacoes: boolean;
  setVariacoes: (v: boolean) => void;
  onGenerate: () => void;
  collapsed?: boolean;
}

export function PainelVisual({ modo, setModo, paleta, setPaleta, variacoes, setVariacoes, onGenerate, collapsed }: Props) {
  if (collapsed) {
    return (
      <div className="text-xs text-[#6b7280]">
        <span className="font-medium text-[#1f172a]">Visual:</span>{" "}
        {MODOS.find((m) => m.id === modo)?.label} · {PALETAS.find((p) => p.id === paleta)?.label}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#1f172a]">Modo de imagem</label>
        <div className="grid grid-cols-3 gap-2">
          {MODOS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setModo(m.id)}
              className={`text-left rounded-lg overflow-hidden bg-white transition-all ${
                modo === m.id ? "border-2 border-[#7c3aed]" : "border border-[#e5e7eb]"
              }`}
            >
              <div className={`h-[72px] bg-gradient-to-br ${m.grad}`} />
              <div className="p-1.5">
                <div className="text-[11px] font-bold text-[#1f172a]">{m.label}</div>
                <div className="text-[9px] text-[#6b7280] leading-tight mt-0.5">{m.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#1f172a]">Paleta de cor</label>
        <div className="grid grid-cols-4 gap-1.5">
          {PALETAS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPaleta(p.id)}
              className={`h-9 rounded-md overflow-hidden relative transition-all ${
                paleta === p.id ? "border-2 border-[#7c3aed]" : "border border-[#e5e7eb]"
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${p.grad}`} />
              <span className="relative text-[10px] font-semibold text-white drop-shadow flex items-center justify-center h-full">
                {p.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-[#1f172a] cursor-pointer">
        <input
          type="checkbox"
          checked={variacoes}
          onChange={(e) => setVariacoes(e.target.checked)}
          className="w-4 h-4 accent-[#7c3aed]"
        />
        Gerar 3 variações automáticas
      </label>

      <button
        type="button"
        onClick={onGenerate}
        className="w-full h-10 rounded-md bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-semibold transition-colors"
      >
        Gerar Imagens
      </button>
    </div>
  );
}
