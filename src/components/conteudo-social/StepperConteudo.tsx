import { Check } from "lucide-react";

interface StepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const steps = ["Conteúdo", "Visual", "Formato", "Publicar"];

export function StepperConteudo({ currentStep, onStepClick }: StepperProps) {
  return (
    <div className="flex items-center justify-between w-full mb-6">
      {steps.map((label, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;
        const isLast = idx === steps.length - 1;

        return (
          <div key={label} className="flex items-center flex-1">
            <button
              type="button"
              onClick={() => onStepClick?.(stepNum)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-[#7c3aed] text-white"
                    : isDone
                    ? "bg-green-500 text-white"
                    : "bg-white border border-[#e5e7eb] text-[#6b7280]"
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : stepNum}
              </div>
              <span
                className={`text-[10px] font-medium ${
                  isActive ? "text-[#7c3aed]" : isDone ? "text-green-600" : "text-[#6b7280]"
                }`}
              >
                {label}
              </span>
            </button>
            {!isLast && (
              <div
                className={`flex-1 h-px mx-1 -mt-4 ${
                  isDone ? "bg-green-500" : "bg-[#e5e7eb]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
