import { Check } from "lucide-react";

interface Props {
  currentStep: number;
  onStepClick?: (n: number) => void;
}

const STEPS = ["Conteúdo", "Visual", "Formato", "Publicar"];

export function StepperConteudo({ currentStep, onStepClick }: Props) {
  return (
    <div className="flex items-start justify-between w-full mb-5">
      {STEPS.map((label, idx) => {
        const n = idx + 1;
        const active = n === currentStep;
        const done = n < currentStep;
        const isLast = idx === STEPS.length - 1;
        return (
          <div key={label} className="flex items-start flex-1 min-w-0">
            <button
              type="button"
              onClick={() => onStepClick?.(n)}
              className="flex flex-col items-center gap-1 shrink-0"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  active
                    ? "bg-[#7c3aed] text-white"
                    : done
                    ? "bg-[#ede9fe] text-[#7c3aed]"
                    : "bg-white border border-[#e5e7eb] text-[#9ca3af]"
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : n}
              </div>
              <span
                className={`text-[10px] ${
                  active ? "text-[#7c3aed] font-medium" : "text-[#9ca3af]"
                }`}
              >
                {label}
              </span>
            </button>
            {!isLast && (
              <div
                className={`flex-1 h-px mt-3.5 mx-1 ${done ? "bg-[#c4b5fd]" : "bg-[#e5e7eb]"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
