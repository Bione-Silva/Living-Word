import { useState } from "react";
import { Share2, Sparkles, Calendar as CalendarIcon } from "lucide-react";
import { StepperConteudo } from "@/components/conteudo-social/StepperConteudo";
import { PainelConteudo } from "@/components/conteudo-social/PainelConteudo";
import { PainelVisual, type ImageMode } from "@/components/conteudo-social/PainelVisual";
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
  const [tipo, setTipo] = useState("Legenda Social");

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
    // Mock — IA será conectada em passo seguinte
    setIsGenerating(true);
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
    }, 900);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <header className="mb-4">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-5 h-5 text-[#7c3aed]" />
            <h1 className="font-semibold text-xl text-[#1f172a]">Conteúdo Social</h1>
          </div>
          <p className="text-sm text-[#6b7280] mt-1">Crie artes para suas redes em quatro passos</p>
          <hr className="border-[#e5e7eb] mt-4" />
        </header>

        {/* Tabs pill */}
        <div className="flex gap-1 mb-6">
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
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-colors ${
                  active
                    ? "bg-[#ede9fe] text-[#7c3aed] font-medium"
                    : "bg-transparent text-[#6b7280] hover:text-[#7c3aed]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {activeTab === "studio" ? (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Painel esquerdo */}
            <aside className="w-full md:w-80 shrink-0 space-y-3 md:max-h-[calc(100vh-200px)] md:overflow-y-auto md:pr-1">
              <StepperConteudo currentStep={currentStep} onStepClick={setCurrentStep} />

              {/* Passo 1 */}
              <PainelConteudo
                versiculo={versiculo}
                setVersiculo={setVersiculo}
                tipo={tipo}
                setTipo={setTipo}
                onNext={() => setCurrentStep(2)}
                collapsed={currentStep > 1}
              />

              {/* Passo 2 */}
              {currentStep >= 2 && (
                <PainelVisual
                  modo={imageMode}
                  setModo={setImageMode}
                  paleta={paleta}
                  setPaleta={setPaleta}
                  variacoes={variacoes}
                  setVariacoes={setVariacoes}
                  onGenerate={handleGerarImagens}
                  collapsed={currentStep > 2}
                />
              )}

              {/* Passo 3 */}
              {currentStep >= 3 && (
                <PainelFormato
                  plataformas={plataformas}
                  togglePlataforma={togglePlataforma}
                  qtdSlides={qtdSlides}
                  setQtdSlides={setQtdSlides}
                  onNext={() => setCurrentStep(4)}
                  collapsed={currentStep > 3}
                />
              )}

              {/* Passo 4 */}
              {currentStep >= 4 && (
                <PainelPublicar
                  versiculo={versiculo}
                  tipo={tipo}
                  paleta={paleta}
                  plataformas={plataformas}
                  qtdSlides={qtdSlides}
                  onAgendar={() => setActiveTab("calendar")}
                />
              )}
            </aside>

            {/* Preview area */}
            <main className="hidden md:block flex-1">
              <PreviewArea
                arts={arts}
                isGenerating={isGenerating}
                selectedPlatform={plataformas[0] ?? "Feed / Carrossel"}
              />
            </main>
          </div>
        ) : (
          <CalendarioEditorial />
        )}
      </div>
    </div>
  );
}
