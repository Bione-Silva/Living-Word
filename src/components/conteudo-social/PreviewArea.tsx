import { Sparkles, Download } from "lucide-react";
import { PALETAS } from "./PainelVisual";

interface Art {
  id: string;
  platform: string;
  paleta: string;
}

interface Props {
  arts: Art[];
}

export function PreviewArea({ arts }: Props) {
  if (arts.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#c4b5fd] p-8 text-center">
        <Sparkles className="w-12 h-12 text-[#c4b5fd] mb-4" />
        <h3 className="text-base font-semibold text-[#1f172a]">Suas artes aparecerão aqui</h3>
        <p className="text-sm text-[#6b7280] mt-1">Selecione o conteúdo e gere as imagens</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {arts.map((art) => {
        const grad = PALETAS.find((p) => p.id === art.paleta)?.grad ?? "from-purple-500 to-violet-700";
        return (
          <div key={art.id} className="rounded-xl border border-[#e5e7eb] bg-white overflow-hidden">
            <div className={`aspect-[4/5] bg-gradient-to-br ${grad} flex items-center justify-center`}>
              <Sparkles className="w-10 h-10 text-white/70" />
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#7c3aed] bg-[#ede9fe] px-2 py-0.5 rounded-full">
                {art.platform}
              </span>
              <button className="text-[#6b7280] hover:text-[#7c3aed]">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
