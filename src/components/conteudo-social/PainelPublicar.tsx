import { Download, Calendar, Send, Rocket } from "lucide-react";
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
    <div className="bg-[#f5f3ff] border border-[#e2deff] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3.5">
        <Rocket className="w-4 h-4 text-[#7c3aed]" />
        <h3 className="font-bold text-base text-[#1f172a]">Pronto para publicar</h3>
      </div>

      <div className="bg-white border border-[#e2deff] rounded-xl p-3.5 flex gap-3">
        <div
          className="w-16 h-16 rounded-[10px] shrink-0"
          style={{ background: paletaInfo?.gradient }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-[#1f172a] line-clamp-2 leading-snug">
            {caption || `${tipo} sobre "${versiculo || "seu tema"}"`}
          </p>
          <div className="text-[11px] text-[#7c3aed] mt-1">
            {plataformas.length || 0} plataforma(s) · {qtdSlides} {qtdSlides === 1 ? "arte" : "slides"} · Paleta {paletaInfo?.label}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-3.5">
        <button
          type="button"
          onClick={onDownload}
          className="flex-1 py-2.5 rounded-[9px] bg-[#f5f3ff] border border-[#e2deff] text-[#6b7280] text-[13px] font-medium hover:bg-white transition-colors flex items-center justify-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          ZIP
        </button>
        <button
          type="button"
          onClick={onAgendar}
          className="flex-1 py-2.5 rounded-[9px] bg-[#f0fdf4] border border-[#86efac] text-[#16a34a] text-[13px] font-medium hover:bg-green-100 transition-colors flex items-center justify-center gap-1.5"
        >
          <Calendar className="w-3.5 h-3.5" />
          Agendar
        </button>
        <button
          type="button"
          onClick={onPublicar}
          className="flex-1 py-2.5 rounded-[9px] bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[13px] font-semibold transition-colors flex items-center justify-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          Publicar Agora
        </button>
      </div>
    </div>
  );
}
