import { Sparkles, BookOpen, Search } from "lucide-react";

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
}

export function PainelConteudo({ versiculo, setVersiculo, tipo, setTipo, onNext }: Props) {
  const surprise = () => {
    const v = VERSICULOS_SURPRESA[Math.floor(Math.random() * VERSICULOS_SURPRESA.length)];
    setVersiculo(v);
  };

  return (
    <div className="bg-[#f5f3ff] border border-[#e2deff] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3.5">
        <BookOpen className="w-4 h-4 text-[#7c3aed]" />
        <h3 className="font-bold text-base text-[#1f172a]">Qual é o tema ou versículo?</h3>
      </div>

      <input
        type="text"
        value={versiculo}
        onChange={(e) => setVersiculo(e.target.value)}
        placeholder='Ex: "Gálatas 5:22-23", "Fé que move montanhas", "Gratidão"'
        className="w-full px-3.5 py-3 rounded-[10px] border border-[#c4b5fd] bg-white text-sm text-[#1f172a] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/15 mb-2.5"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={surprise}
          className="flex-1 py-2.5 rounded-[9px] border border-[#c4b5fd] bg-[#f0edff] text-[#7c3aed] text-[13px] font-medium hover:bg-[#ede9fe] transition-colors flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Versículo Surpresa
        </button>
        <button
          type="button"
          className="flex-1 py-2.5 rounded-[9px] border border-[#e2deff] bg-white text-[#6b7280] text-[13px] hover:bg-[#f5f3ff] transition-colors flex items-center justify-center gap-1.5"
        >
          <Search className="w-3.5 h-3.5" />
          Buscar na Bíblia
        </button>
      </div>

      <div className="mt-4">
        <label className="text-[11px] uppercase tracking-wider font-semibold text-[#9ca3af] block mb-2">
          Tipo de conteúdo
        </label>
        <div className="flex flex-wrap gap-2">
          {TIPOS_CONTEUDO.map((t) => {
            const sel = tipo === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`text-[13px] px-3.5 py-1.5 rounded-full border transition-colors ${
                  sel
                    ? "bg-[#ede9fe] border-[#c4b5fd] text-[#7c3aed] font-medium"
                    : "bg-[#f5f3ff] border-[#e2deff] text-[#6b7280] hover:border-[#c4b5fd]"
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
        className="w-full mt-4 py-2.5 rounded-[10px] bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-medium transition-colors"
      >
        Próximo: Visual →
      </button>
    </div>
  );
}
