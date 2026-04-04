import { Badge } from '@/components/ui/badge';
import type { BiblicalStudyOutput } from '@/types/biblical-study';

export function TabPerguntas({ study }: { study: BiblicalStudyOutput }) {
  return (
    <ol className="space-y-3">
      {study.reflection_questions.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
            {i + 1}
          </span>
          <div className="flex items-start gap-2 flex-wrap pt-1">
            <span className="font-semibold text-sm">{item.question}</span>
            {item.target_audience && (
              <Badge variant="secondary" className="text-[10px]">{item.target_audience}</Badge>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
