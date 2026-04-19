import { ImageIcon, Palette } from "lucide-react";

const MODOS = [
  {
    id: "biblica" as const,
    label: "Época Bíblica",
    desc: "Oriente Médio antigo, cinematográfico",
    gradient: "linear-gradient(135deg,#3d2006,#7a4010,#5c3000)",
    emoji: "🏺",
  },
  {
    id: "moderna" as const,
    label: "Moderna",
    desc: "Editorial contemporânea",
    gradient: "linear-gradient(135deg,#0f1f3d,#1a3a6e,#0d2d52)",
    emoji: "✦",
  },
  {
    id: "simbolica" as const,
    label: "Simbólica",
    desc: "Cruz, luz, trigo",
    gradient: "linear-gradient(135deg,#0e2010,#1a3d1e,#0d2814)",
    emoji: "🕊",
  },
];

export const PALETAS = [
  { id: "dourado", label: "Dourado", gradient: "linear-gradient(135deg,#3d2006,#7a5010)" },
  { id: "noturno", label: "Noturno", gradient: "linear-gradient(135deg,#0e1a2e,#1e3a5e)" },
  { id: "natureza", label: "Natureza", gradient: "linear-gradient(135deg,#0e1f10,#1e401e)" },
  { id: "rosa", label: "Rosa", gradient: "linear-gradient(135deg,#3d1020,#7a2040)" },
  { id: "deserto", label: "Deserto", gradient: "linear-gradient(135deg,#2a1a08,#5c3818)" },
  { id: "oceano", label: "Oceano", gradient: "linear-gradient(135deg,#0a1428,#162a50)" },
  { id: "real", label: "Real", gradient: "linear-gradient(135deg,#1a0f2e,#3a1f5e)" },
  { id: "sereno", label: "Sereno", gradient: "linear-gradient(135deg,#1a1a1a,#303030)" },
];

export type ImageMode = "biblica" | "moderna" | "simbolica";

interface Props {
  modo: ImageMode;
  setModo: (m: ImageMode) => void;
  paleta: string;
  setPaleta: (p: string) => void;
  variacoes: boolean;
  setVariacoes: (v: boolean) => void;
  onGenerate: () => void;
}

export function PainelVisual({ modo, setModo, paleta, setPaleta, variacoes, setVariacoes, onGenerate }: Props) {
  return (
    <div className="bg-[#f5f3ff] border border-[#e2deff] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3.5">
        <Palette className="w-4 h-4 text-[#7c3aed]" />
        <h3 className="font-bold text-base text-[#1f172a]">Estilo da imagem</h3>
      </div>

      {/* Modos */}
      <div className="grid grid-cols-3 gap-3">
        {MODOS.map((m) => {
          const sel = modo === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setModo(m.id)}
              className={`text-left rounded-xl overflow-hidden bg-white transition-all hover:-translate-y-0.5 ${
                sel ? "border-2 border-[#7c3aed] bg-[#faf8ff]" : "border border-[#e2deff] hover:border-[#c4b5fd]"
              }`}
            >
              <div
                className="h-20 flex items-center justify-center text-[28px]"
                style={{ background: m.gradient }}
              >
                <span style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))", color: "#fff" }}>{m.emoji}</span>
              </div>
              <div className="p-2.5">
                <div className="text-[13px] font-medium text-[#1f172a] leading-tight">{m.label}</div>
                <div className="text-[11px] text-[#6b7280] leading-tight mt-1">{m.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Paleta */}
      <label className="text-[11px] uppercase tracking-wider font-semibold text-[#9ca3af] block mt-4 mb-2">
        Paleta de cor
      </label>
      <div className="grid grid-cols-4 gap-2">
        {PALETAS.map((p) => {
          const sel = paleta === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPaleta(p.id)}
              className={`h-[38px] rounded-lg overflow-hidden relative transition-all ${
                sel
                  ? "border-2 border-[#7c3aed] ring-2 ring-[#7c3aed]/20"
                  : "border border-transparent hover:border-[#c4b5fd]"
              }`}
              style={{ background: p.gradient }}
            >
              <span className="text-[11px] font-medium flex items-center justify-center h-full text-white/85">
                {p.label}
              </span>
            </button>
          );
        })}
      </div>

      <label className="flex items-center gap-2 text-[13px] text-[#6b7280] cursor-pointer mt-3">
        <input
          type="checkbox"
          checked={variacoes}
          onChange={(e) => setVariacoes(e.target.checked)}
          className="w-4 h-4 accent-[#7c3aed] cursor-pointer"
        />
        Gerar 3 variações automáticas
      </label>

      <button
        type="button"
        onClick={onGenerate}
        className="w-full mt-2.5 py-3 rounded-[10px] text-white text-sm font-medium flex items-center justify-center gap-2 transition-all hover:opacity-95 hover:-translate-y-px"
        style={{ background: "linear-gradient(135deg, #7c3aed, #9b6cff)" }}
      >
        <ImageIcon className="w-3.5 h-3.5" />
        Gerar Imagens com IA
      </button>
    </div>
  );
}
