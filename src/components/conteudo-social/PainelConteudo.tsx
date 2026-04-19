import { Sparkles } from "lucide-react";

const TIPOS = [
  "Legenda Social",
  "Roteiro Reels",
  "Reflexão Devocional",
  "Sermão em Tópicos",
  "Poesia Cristã",
  "Aviso de Igreja",
];

interface Props {
  versiculo: string;
  setVersiculo: (v: string) => void;
  tipos: string[];
  toggleTipo: (t: string) => void;
  onNext: () => void;
  collapsed?: boolean;
}

export function PainelConteudo({ versiculo, setVersiculo, tipos, toggleTipo, onNext, collapsed }: Props) {
  if (collapsed) {
    return (
      <div className="text-xs text-[#6b7280]">
        <span className="font-medium text-[#1f172a]">Conteúdo:</span>{" "}
        {versiculo || "—"} · {tipos.length} tipo(s)
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#1f172a]">Versículo ou tema</label>
        <input
          type="text"
          value={versiculo}
          onChange={(e) => setVersiculo(e.target.value)}
          placeholder='Ex: "João 3:16", "Gratidão", "Salmo 23"'
          className="w-full h-10 px-3 rounded-md border border-[#e5e7eb] bg-white text-sm text-[#1f172a] placeholder:text-[#6b7280] focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]"
        />
        <button
          type="button"
          className="w-full mt-2 h-9 rounded-md border border-[#e5e7eb] text-sm font-medium text-[#1f172a] bg-white hover:bg-[#f9f8ff] transition-colors flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#7c3aed]" />
          Versículo Surpresa
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#1f172a]">Tipo de conteúdo</label>
        <div className="flex flex-wrap gap-1.5">
          {TIPOS.map((t) => {
            const sel = tipos.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTipo(t)}
                className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                  sel
                    ? "bg-[#ede9fe] border-[#c4b5fd] text-[#7c3aed]"
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
        className="w-full h-10 rounded-md bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-semibold transition-colors"
      >
        Próximo: Visual →
      </button>
    </div>
  );
}
