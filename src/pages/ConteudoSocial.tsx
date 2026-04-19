import { useState } from "react";
import { Share2, Sparkles } from "lucide-react";
import { StepperConteudo } from "@/components/conteudo-social/StepperConteudo";
import { PainelConteudo } from "@/components/conteudo-social/PainelConteudo";
import { PainelVisual } from "@/components/conteudo-social/PainelVisual";
import { PainelFormato } from "@/components/conteudo-social/PainelFormato";
import { PainelPublicar } from "@/components/conteudo-social/PainelPublicar";
import { PreviewArea } from "@/components/conteudo-social/PreviewArea";
import { CalendarioEditorial } from "@/components/conteudo-social/CalendarioEditorial";

type Tab = "estudio" | "calendario";

export default function ConteudoSocial() {
  const [tab, setTab] = useState<Tab>("estudio");
  const [step, setStep] = useState(1);

  // Passo 1
  const [versiculo, setVersiculo] = useState("");
  const [tipos, setTipos] = useState<string[]>(["Legenda Social"]);

  // Passo 2
  const [modo, setModo] = useState("biblica");
  const [paleta, setPaleta] = useState("dourado");
  const [variacoes, setVariacoes] = useState(true);

  // Passo 3
  const [plataformas, setPlataformas] = useState<string[]>(["Feed / Carrossel"]);
  const [slides, setSlides] = useState(3);

  // Preview
  const [arts, setArts] = useState<Array<{ id: string; platform: string; paleta: string }>>([]);

  const toggleTipo = (t: string) =>
    setTipos((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  const togglePlataforma = (p: string) =>
    setPlataformas((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const handleGenerate = () => {
    const generated = Array.from({ length: variacoes ? 3 : 1 }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      platform: plataformas[0] ?? "Instagram Feed",
      paleta,
    }));
    setArts(generated);
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-[#f9f8ff]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <header className="mb-5">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-6 h-6 text-[#7c3aed]" />
            <h1 className="font-semibold text-xl text-[#1f172a]">Conteúdo Social</h1>
          </div>
          <p className="text-sm text-[#6b7280] mt-1">Crie artes para suas redes em quatro passos</p>
          <div className="h-px bg-[#e5e7eb] mt-4" />
        </header>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-[#e5e7eb]">
          {[
            { id: "estudio" as Tab, label: "Estúdio" },
            { id: "calendario" as Tab, label: "Calendário" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t.id
                  ? "border-[#7c3aed] text-[#7c3aed]"
                  : "border-transparent text-[#6b7280] hover:text-[#1f172a]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "estudio" ? (
          <div className="flex gap-6">
            {/* Coluna esquerda */}
            <aside className="w-full md:w-80 shrink-0 space-y-4">
              <div className="rounded-xl border border-[#e5e7eb] bg-white p-4">
                <StepperConteudo currentStep={step} onStepClick={setStep} />

                <div className="space-y-4">
                  {/* Passo 1 */}
                  <div className={step === 1 ? "" : "border border-[#e5e7eb] rounded-lg p-2.5 bg-[#f9f8ff]"}>
                    <PainelConteudo
                      versiculo={versiculo}
                      setVersiculo={setVersiculo}
                      tipos={tipos}
                      toggleTipo={toggleTipo}
                      onNext={() => setStep(2)}
                      collapsed={step !== 1}
                    />
                  </div>

                  {/* Passo 2 */}
                  {step >= 2 && (
                    <div className={step === 2 ? "" : "border border-[#e5e7eb] rounded-lg p-2.5 bg-[#f9f8ff]"}>
                      <PainelVisual
                        modo={modo}
                        setModo={setModo}
                        paleta={paleta}
                        setPaleta={setPaleta}
                        variacoes={variacoes}
                        setVariacoes={setVariacoes}
                        onGenerate={handleGenerate}
                        collapsed={step !== 2}
                      />
                    </div>
                  )}

                  {/* Passo 3 */}
                  {step >= 3 && (
                    <div className={step === 3 ? "" : "border border-[#e5e7eb] rounded-lg p-2.5 bg-[#f9f8ff]"}>
                      <PainelFormato
                        plataformas={plataformas}
                        togglePlataforma={togglePlataforma}
                        slides={slides}
                        setSlides={setSlides}
                        onNext={() => setStep(4)}
                        collapsed={step !== 3}
                      />
                    </div>
                  )}

                  {/* Passo 4 */}
                  {step >= 4 && (
                    <PainelPublicar
                      versiculo={versiculo}
                      tipos={tipos}
                      paleta={paleta}
                      plataformas={plataformas}
                      slides={slides}
                    />
                  )}
                </div>
              </div>
            </aside>

            {/* Coluna direita — preview (só em md+) */}
            <main className="hidden md:block flex-1">
              <PreviewArea arts={arts} />
            </main>
          </div>
        ) : (
          <CalendarioEditorial />
        )}
      </div>
    </div>
  );
}
