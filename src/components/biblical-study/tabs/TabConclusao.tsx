import type { BiblicalStudyOutput } from '@/types/biblical-study';

export function TabConclusao({ study }: { study: BiblicalStudyOutput }) {
  return (
    <div className="prose prose-lg max-w-none">
      <p className="text-foreground leading-loose text-base">{study.conclusion}</p>
    </div>
  );
}
