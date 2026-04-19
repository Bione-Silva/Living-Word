import { Download, Calendar, Send } from "lucide-react";
import { PALETAS } from "./PainelVisual";

interface Props {
  versiculo: string;
  tipos: string[];
  paleta: string;
  plataformas: string[];
  slides: number;
}

export function PainelPublicar({ versiculo, tipos, paleta, plataformas, slides }: Props) {
  const paletaInfo = PALETAS.find((p) => p.id === paleta);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#e5e7eb] p-3 flex gap-3 bg-white">
        <div className={`w-[60px] h-[60px] rounded-lg shrink-0 bg-gradient-to-br ${paletaInfo?.grad ?? "from-purple-500 to-violet-700"}`} />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-[#1f172a] truncate">
            {versiculo || "Sua arte"} — {tipos[0] ?? "Conteúdo"}
          </div>
          <div className="text-[10px] text-[#6b7280] mt-1 leading-snug">
            {plataformas.length || 0} plataforma(s) · {slides} {slides === 1 ? "arte" : "slides"} · paleta {paletaInfo?.label ?? "—"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          className="h-10 rounded-md border border-[#e5e7eb] bg-white text-[11px] font-medium text-[#1f172a] hover:bg-[#f9f8ff] flex items-center justify-center gap-1"
        >
          <Download className="w-3.5 h-3.5" />
          ZIP
        </button>
        <button
          type="button"
          className="h-10 rounded-md border border-[#86efac] bg-[#f0fdf4] text-[11px] font-medium text-[#16a34a] hover:bg-green-100 flex items-center justify-center gap-1"
        >
          <Calendar className="w-3.5 h-3.5" />
          Agendar
        </button>
        <button
          type="button"
          className="h-10 rounded-md bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[11px] font-semibold flex items-center justify-center gap-1"
        >
          <Send className="w-3.5 h-3.5" />
          Publicar
        </button>
      </div>
    </div>
  );
}
