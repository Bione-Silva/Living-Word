import { Check } from "lucide-react";

interface Props {
  currentStep: number;
  onStepClick?: (n: number) => void;
}

const STEPS = ["Conteúdo", "Visual", "Formato", "Publicar"];

export function StepperConteudo({ currentStep, onStepClick }: Props) {
  return (
    <div className="flex items-stretch w-full bg-[#f5f3ff] border border-[#e2deff] rounded-xl p-1.5">
      {STEPS.map((label, idx) => {
        const n = idx + 1;
        const active = n === currentStep;
        const done = n < currentStep;
        const isLast = idx === STEPS.length - 1;

        return (
          <div key={label} className="flex items-stretch flex-1 min-w-0">
            <button
              type="button"
              onClick={() => onStepClick?.(n)}
              className={`flex items-center gap-2 flex-1 px-3 py-2.5 rounded-[9px] transition-colors ${
                active ? "bg-white shadow-sm" : "hover:bg-white/50"
              }`}
            >
              <div
                className={`w-[26px] h-[26px] shrink-0 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  active
                    ? "bg-[#7c3aed] text-white"
                    : done
                    ? "bg-[#ede9fe] text-[#7c3aed]"
                    : "bg-[#f5f3ff] border border-[#e2deff] text-[#9ca3af]"
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : n}
              </div>
              <span
                className={`text-[13px] truncate ${
                  active
                    ? "text-[#7c3aed] font-medium"
                    : done
                    ? "text-[#7c3aed]"
                    : "text-[#9ca3af]"
                }`}
              >
                {label}
              </span>
            </button>
            {!isLast && <div className="w-px bg-[#e2deff] my-2" />}
          </div>
        );
      })}
    </div>
  );
}
