import { Sparkles } from "lucide-react";

const VERSICULOS_SURPRESA = [
  "João 3:16", "Salmo 23", "Filipenses 4:13", "Jeremias 29:11",
  "Provérbios 3:5-6", "Isaías 40:31", "Romanos 8:28", "Mateus 5:16",
  "Gálatas 5:22-23", "Efésios 2:8-9",
];

export const TIPOS_CONTEUDO = [
  "Legenda Social", "Roteiro Reels", "Reflexão Devocional",
  "Sermão em Tópicos", "Poesia Cristã", "Aviso de Igreja",
];

interface Props {
  versiculo: string;
  setVersiculo: (v: string) => void;
  tipo: string;
  setTipo: (t: string) => void;
  onNext: () => void;
  collapsed?: boolean;
}

export function PainelConteudo({ versiculo, setVersiculo, tipo, setTipo, onNext, collapsed }: Props) {
  const surprise = () => {
    const v = VERSICULOS_SURPRESA[Math.floor(Math.random() * VERSICULOS_SURPRESA.length)];
    setVersiculo(v);
  };

  if (collapsed) {
    return (
      <div className="text-xs text-[#6b7280] flex items-center justify-between">
        <span>
          <span className="font-medium text-[#1f172a]">Conteúdo:</span>{" "}
          {versiculo || "—"} · {tipo}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f3ff] border border-[#e5e7eb] rounded-xl p-4 space-y-3">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#1f172a]">Versículo ou tema</label>
        <input
          type="text"
          value={versiculo}
          onChange={(e) => setVersiculo(e.target.value)}
          placeholder='Ex: "João 3:16", "Gratidão", "Salmo 23"'
          className="w-full h-10 px-3 rounded-lg border border-[#d1d5db] bg-white text-sm text-[#1f172a] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#ede9fe]"
        />
      </div>

      <button
        type="button"
        onClick={surprise}
        className="w-full h-9 rounded-lg border border-[#c4b5fd] bg-[#ede9fe] text-[#7c3aed] text-sm font-medium hover:bg-[#e0d9ff] transition-colors flex items-center justify-center gap-1.5"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Versículo Surpresa
      </button>

      <div className="space-y-1.5 pt-1">
        <label className="text-sm font-medium text-[#1f172a]">Tipo de conteúdo</label>
        <div className="flex flex-wrap gap-1.5">
          {TIPOS_CONTEUDO.map((t) => {
            const sel = tipo === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                  sel
                    ? "bg-[#ede9fe] border-[#c4b5fd] text-[#7c3aed] font-medium"
                    : "bg-white border-[#e5e7eb] text-[#6b7280] hover:border-[#c4b5fd]"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full h-10 rounded-lg bg-[#7c3aed] hover:bg-[#8b5cf6] text-white text-sm font-semibold transition-colors mt-2"
      >
        Próximo: Visual →
      </button>
    </div>
  );
}
