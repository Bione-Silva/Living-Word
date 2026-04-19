import { useState } from "react";
import { Share2, Sparkles, Calendar as CalendarIcon } from "lucide-react";
import { StepperConteudo } from "@/components/conteudo-social/StepperConteudo";
import { PainelConteudo } from "@/components/conteudo-social/PainelConteudo";
import { PainelVisual, type ImageMode, PALETAS } from "@/components/conteudo-social/PainelVisual";
import { PainelFormato } from "@/components/conteudo-social/PainelFormato";
import { PainelPublicar } from "@/components/conteudo-social/PainelPublicar";
import { PreviewArea } from "@/components/conteudo-social/PreviewArea";
import { CalendarioEditorial } from "@/components/conteudo-social/CalendarioEditorial";

type Tab = "studio" | "calendar";

export default function ConteudoSocial() {
  const [activeTab, setActiveTab] = useState<Tab>("studio");
  const [currentStep, setCurrentStep] = useState(1);

  // Passo 1
  const [versiculo, setVersiculo] = useState("");
  const [tipo, setTipo] = useState("Reflexão Devocional");

  // Passo 2
  const [imageMode, setImageMode] = useState<ImageMode>("biblica");
  const [paleta, setPaleta] = useState("dourado");
  const [variacoes, setVariacoes] = useState(true);

  // Passo 3
  const [plataformas, setPlataformas] = useState<string[]>(["Feed / Carrossel"]);
  const [qtdSlides, setQtdSlides] = useState<number>(5);

  // Preview
  const [arts, setArts] = useState<Array<{ id: string; platform: string; paleta: string }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const togglePlataforma = (p: string) =>
    setPlataformas((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const handleGerarImagens = () => {
    setIsGenerating(true);
    setArts([]);
    setTimeout(() => {
      const n = variacoes ? 3 : 1;
      const platLabel = plataformas[0] ?? "Feed / Carrossel";
      const generated = Array.from({ length: n }, (_, i) => ({
        id: `${Date.now()}-${i}`,
        platform: platLabel,
        paleta,
      }));
      setArts(generated);
      setIsGenerating(false);
      setCurrentStep(3);
    }, 1200);
  };

  const paletaLabel = PALETAS.find((p) => p.id === paleta)?.label ?? "";

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <header className="mb-4">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-5 h-5 text-[#7c3aed]" />
            <h1 className="font-bold text-2xl text-[#1f172a]">Conteúdo Social</h1>
          </div>
          <p className="text-sm text-[#6b7280] mt-1">
            Crie artes para suas redes em quatro passos. Gere, personalize e publique.
          </p>
          <hr className="border-[#e2deff] mt-3 mb-4" />
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { id: "studio" as Tab, label: "Estúdio", icon: Sparkles },
            { id: "calendar" as Tab, label: "Calendário", icon: CalendarIcon },
          ].map((t) => {
            const active = activeTab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm transition-colors border ${
                  active
                    ? "bg-[#ede9fe] border-[#c4b5fd] text-[#7c3aed] font-medium"
                    : "bg-[#f5f3ff] border-[#e2deff] text-[#6b7280] hover:text-[#7c3aed]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {activeTab === "studio" ? (
          <div className="space-y-4">
            <StepperConteudo currentStep={currentStep} onStepClick={setCurrentStep} />

            {/* Resumo colapsado */}
            {currentStep > 1 && (
              <div className="text-xs text-[#6b7280] pl-1 -mt-2 space-y-0.5">
                <div>
                  <span className="text-[#9ca3af]">Conteúdo:</span>{" "}
                  <span className="text-[#7c3aed] font-medium">{versiculo || "—"}</span>
                  <span className="text-[#9ca3af]"> · </span>
                  <span className="text-[#7c3aed] font-medium">{tipo}</span>
                </div>
                {currentStep > 2 && (
                  <div>
                    <span className="text-[#9ca3af]">Visual:</span>{" "}
                    <span className="text-[#7c3aed] font-medium">
                      {imageMode === "biblica" ? "Época Bíblica" : imageMode === "moderna" ? "Moderna" : "Simbólica"}
                    </span>
                    <span className="text-[#9ca3af]"> · paleta </span>
                    <span className="text-[#7c3aed] font-medium">{paletaLabel}</span>
                  </div>
                )}
                {currentStep > 3 && (
                  <div>
                    <span className="text-[#9ca3af]">Formato:</span>{" "}
                    <span className="text-[#7c3aed] font-medium">{plataformas[0] ?? "—"}</span>
                    <span className="text-[#9ca3af]"> · </span>
                    <span className="text-[#7c3aed] font-medium">
                      {qtdSlides} {qtdSlides === 1 ? "arte" : "slides"}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Painel ativo (apenas um por vez) */}
            {currentStep === 1 && (
              <PainelConteudo
                versiculo={versiculo}
                setVersiculo={setVersiculo}
                tipo={tipo}
                setTipo={setTipo}
                onNext={() => setCurrentStep(2)}
              />
            )}

            {currentStep === 2 && (
              <PainelVisual
                modo={imageMode}
                setModo={setImageMode}
                paleta={paleta}
                setPaleta={setPaleta}
                variacoes={variacoes}
                setVariacoes={setVariacoes}
                onGenerate={handleGerarImagens}
              />
            )}

            {currentStep === 3 && (
              <PainelFormato
                plataformas={plataformas}
                togglePlataforma={togglePlataforma}
                qtdSlides={qtdSlides}
                setQtdSlides={setQtdSlides}
                onNext={() => setCurrentStep(4)}
              />
            )}

            {currentStep === 4 && (
              <PainelPublicar
                versiculo={versiculo}
                tipo={tipo}
                paleta={paleta}
                plataformas={plataformas}
                qtdSlides={qtdSlides}
                onAgendar={() => setActiveTab("calendar")}
              />
            )}

            {/* Área de preview SEMPRE visível abaixo */}
            <PreviewArea
              arts={arts}
              isGenerating={isGenerating}
              selectedPlatform={plataformas[0] ?? "Feed / Carrossel"}
            />
          </div>
        ) : (
          <CalendarioEditorial />
        )}
      </div>
    </div>
  );
}
