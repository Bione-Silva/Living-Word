import { Download, Calendar, Send } from "lucide-react";
import { PALETAS } from "./PainelVisual";

interface Props {
  versiculo: string;
  tipo: string;
  paleta: string;
  plataformas: string[];
  qtdSlides: number;
  caption?: string;
  onAgendar: () => void;
  onDownload?: () => void;
  onPublicar?: () => void;
}

export function PainelPublicar({
  versiculo, tipo, paleta, plataformas, qtdSlides, caption, onAgendar, onDownload, onPublicar,
}: Props) {
  const paletaInfo = PALETAS.find((p) => p.id === paleta);

  return (
    <div className="bg-[#f5f3ff] border border-[#e5e7eb] rounded-xl p-4 space-y-3">
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-3.5 flex gap-3">
        <div
          className="w-16 h-16 rounded-[10px] shrink-0"
          style={{ background: paletaInfo?.gradient }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[#1f172a] line-clamp-2 leading-snug">
            {caption || `${tipo} sobre "${versiculo || "seu tema"}". Conteúdo será gerado pela IA.`}
          </p>
          <div className="text-xs text-[#7c3aed] mt-1.5">
            {plataformas.length || 0} plataforma(s) · {qtdSlides} {qtdSlides === 1 ? "arte" : "slides"} · Paleta {paletaInfo?.label}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={onDownload}
          className="h-10 rounded-lg bg-[#f9fafb] border border-[#e5e7eb] text-[#6b7280] text-xs font-medium hover:bg-[#f3f4f6] transition-colors flex items-center justify-center gap-1"
        >
          <Download className="w-3.5 h-3.5" />
          ZIP
        </button>
        <button
          type="button"
          onClick={onAgendar}
          className="h-10 rounded-lg bg-[#f0fdf4] border border-[#86efac] text-[#16a34a] text-xs font-medium hover:bg-green-100 transition-colors flex items-center justify-center gap-1"
        >
          <Calendar className="w-3.5 h-3.5" />
          Agendar
        </button>
        <button
          type="button"
          onClick={onPublicar}
          className="h-10 rounded-lg bg-[#7c3aed] hover:bg-[#8b5cf6] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1"
        >
          <Send className="w-3.5 h-3.5" />
          Publicar
        </button>
      </div>
    </div>
  );
}
