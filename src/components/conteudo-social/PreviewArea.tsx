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

function getAspect(plat: string) {
  if (plat.toLowerCase().includes("stories") || plat.toLowerCase().includes("reels") || plat.toLowerCase().includes("tiktok")) {
    return "aspect-[9/16]";
  }
  if (plat.toLowerCase().includes("quadrado")) return "aspect-square";
  return "aspect-[4/5]";
}

export function PreviewArea({ arts, isGenerating, selectedPlatform }: Props) {
  if (isGenerating) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center rounded-2xl border-[1.5px] border-dashed border-[#c4b5fd] bg-[#faf5ff] p-8 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#7c3aed] border-t-transparent animate-spin mb-4" />
        <p className="text-sm text-[#7c3aed] animate-pulse font-medium">Gerando imagens...</p>
        <p className="text-xs text-[#9ca3af] mt-1">IA preparando suas artes</p>
      </div>
    );
  }

  if (arts.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center rounded-2xl border-[1.5px] border-dashed border-[#c4b5fd] bg-[#faf5ff] p-8 text-center">
        <Sparkles className="w-12 h-12 text-[#c4b5fd] mb-4" />
        <h3 className="text-lg font-medium text-[#1f172a]">Suas artes aparecerão aqui</h3>
        <p className="text-sm text-[#6b7280] mt-1">Selecione o conteúdo e gere as imagens</p>
      </div>
    );
  }

  const aspect = getAspect(selectedPlatform);
  const isOne = arts.length === 1;

  return (
    <div className={isOne ? "max-w-sm mx-auto" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"}>
      {arts.map((art) => {
        const grad = PALETAS.find((p) => p.id === art.paleta)?.gradient ?? "linear-gradient(135deg,#7c3aed,#a78bfa)";
        return (
          <div key={art.id} className="rounded-xl overflow-hidden border border-[#e5e7eb] bg-white">
            <div
              className={`${aspect} flex items-center justify-center relative`}
              style={{ background: grad }}
            >
              {art.imageUrl ? (
                <img src={art.imageUrl} alt="Arte gerada" className="w-full h-full object-cover" />
              ) : (
                <Sparkles className="w-10 h-10 text-white/60" />
              )}
            </div>
            <div className="px-2.5 py-2 bg-white flex items-center justify-between">
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[#ede9fe] text-[#7c3aed]">
                {art.platform}
              </span>
              <button className="text-[#7c3aed] hover:opacity-70">
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
