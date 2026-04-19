import { ImageIcon } from "lucide-react";

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
    desc: "Fotografia editorial contemporânea",
    gradient: "linear-gradient(135deg,#0f1f3d,#1a3a6e,#0d2d52)",
    emoji: "✦",
  },
  {
    id: "simbolica" as const,
    label: "Simbólica",
    desc: "Elementos limpos: cruz, luz, trigo",
    gradient: "linear-gradient(135deg,#0e2010,#1a3d1e,#0d2814)",
    emoji: "🕊",
  },
];

export const PALETAS = [
  { id: "dourado", label: "Dourado", gradient: "linear-gradient(135deg,#3d2006,#7a5010)", texto: "rgba(255,210,140,0.9)" },
  { id: "noturno", label: "Noturno", gradient: "linear-gradient(135deg,#0e1a2e,#1e3a5e)", texto: "rgba(150,190,255,0.9)" },
  { id: "natureza", label: "Natureza", gradient: "linear-gradient(135deg,#0e1f10,#1e401e)", texto: "rgba(140,220,150,0.9)" },
  { id: "rosa", label: "Rosa", gradient: "linear-gradient(135deg,#3d1020,#7a2040)", texto: "rgba(255,160,200,0.9)" },
  { id: "deserto", label: "Deserto", gradient: "linear-gradient(135deg,#2a1a08,#5c3818)", texto: "rgba(240,200,150,0.9)" },
  { id: "oceano", label: "Oceano", gradient: "linear-gradient(135deg,#0a1428,#162a50)", texto: "rgba(150,200,255,0.9)" },
  { id: "real", label: "Real", gradient: "linear-gradient(135deg,#1a0f2e,#3a1f5e)", texto: "rgba(200,170,255,0.9)" },
  { id: "sereno", label: "Sereno", gradient: "linear-gradient(135deg,#1a1a1a,#303030)", texto: "rgba(220,220,220,0.9)" },
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
  collapsed?: boolean;
}

export function PainelVisual({ modo, setModo, paleta, setPaleta, variacoes, setVariacoes, onGenerate, collapsed }: Props) {
  if (collapsed) {
    return (
      <div className="text-xs text-[#6b7280]">
        <span className="font-medium text-[#1f172a]">Visual:</span>{" "}
        {MODOS.find((m) => m.id === modo)?.label} · paleta {PALETAS.find((p) => p.id === paleta)?.label}
      </div>
    );
  }

  return (
    <div className="bg-[#f5f3ff] border border-[#e5e7eb] rounded-xl p-4 space-y-3">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#1f172a]">Modo de imagem</label>
        <div className="grid grid-cols-3 gap-2">
          {MODOS.map((m) => {
            const sel = modo === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setModo(m.id)}
                className={`text-left rounded-[10px] overflow-hidden bg-white transition-all ${
                  sel ? "border-2 border-[#7c3aed] bg-[#faf5ff]" : "border border-[#e5e7eb] hover:border-[#c4b5fd]"
                }`}
              >
                <div
                  className="h-[72px] flex items-center justify-center text-2xl"
                  style={{ background: m.gradient }}
                >
                  <span style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" }}>{m.emoji}</span>
                </div>
                <div className="p-1.5">
                  <div className="text-[11px] font-medium text-[#1f172a] leading-tight">{m.label}</div>
                  <div className="text-[9px] text-[#6b7280] leading-tight mt-0.5">{m.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5 pt-1">
        <label className="text-[10px] uppercase tracking-wider font-semibold text-[#9ca3af]">Paleta de cor</label>
        <div className="grid grid-cols-4 gap-1.5">
          {PALETAS.map((p) => {
            const sel = paleta === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPaleta(p.id)}
                className={`h-9 rounded-lg overflow-hidden relative transition-all ${
                  sel ? "border-2 border-[#7c3aed]" : "border border-[#e5e7eb]"
                }`}
                style={{ background: p.gradient }}
              >
                <span
                  className="text-[10px] font-medium flex items-center justify-center h-full"
                  style={{ color: p.texto }}
                >
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-[#6b7280] cursor-pointer pt-1">
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
        className="w-full h-11 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
        style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}
      >
        <ImageIcon className="w-3.5 h-3.5" />
        Gerar Imagens com IA
      </button>
    </div>
  );
}
