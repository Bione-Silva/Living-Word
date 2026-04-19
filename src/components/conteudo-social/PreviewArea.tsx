import { Sparkles, Download } from "lucide-react";
import { PALETAS } from "./PainelVisual";

interface Art {
  id: string;
  platform: string;
  paleta: string;
  imageUrl?: string;
}

interface Props {
  arts: Art[];
  isGenerating: boolean;
  selectedPlatform: string;
}

export function PreviewArea({ arts, isGenerating, selectedPlatform }: Props) {
  if (isGenerating) {
    return (
      <div className="mt-4 border border-dashed border-[#c4b5fd] bg-[#faf8ff] rounded-2xl min-h-[200px] flex flex-col items-center justify-center gap-3 p-8">
        <div className="w-7 h-7 rounded-full animate-spin border-2 border-[#7c3aed] border-t-transparent" />
        <p className="text-[13px] text-[#7c3aed] animate-pulse font-medium">Gerando imagens...</p>
        <p className="text-[11px] text-[#9ca3af]">Imagen 4 Fast · Google Vertex AI</p>
      </div>
    );
  }

  if (arts.length === 0) {
    return (
      <div className="mt-4 border border-dashed border-[#c4b5fd] bg-[#faf8ff] rounded-2xl min-h-[200px] flex flex-col items-center justify-center gap-3 p-8 text-center">
        <Sparkles className="w-10 h-10 text-[#c4b5fd]" />
        <p className="text-[15px] font-medium text-[#6b7280]">Suas artes aparecerão aqui</p>
        <p className="text-[13px] text-[#9ca3af]">Selecione o conteúdo e gere as imagens</p>
      </div>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {arts.map((art) => {
        const paletaInfo = PALETAS.find((p) => p.id === art.paleta);
        return (
          <div
            key={art.id}
            className="bg-white border border-[#e2deff] rounded-xl overflow-hidden transition-all hover:shadow-sm hover:-translate-y-0.5"
          >
            <div
              className="w-full aspect-[4/5] flex items-center justify-center"
              style={{ background: paletaInfo?.gradient }}
            >
              <Sparkles className="w-8 h-8 text-white/40" />
            </div>
            <div className="px-2.5 py-2 flex items-center justify-between bg-white">
              <span className="text-[9px] bg-[#ede9fe] text-[#7c3aed] px-1.5 py-0.5 rounded font-medium">
                {selectedPlatform}
              </span>
              <button
                type="button"
                className="text-[#7c3aed] hover:text-[#6d28d9] transition-colors"
                aria-label="Baixar"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
