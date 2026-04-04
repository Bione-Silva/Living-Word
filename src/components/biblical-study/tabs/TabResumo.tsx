import { Badge } from '@/components/ui/badge';
import type { BiblicalStudyOutput } from '@/types/biblical-study';

export function TabResumo({ study }: { study: BiblicalStudyOutput }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">{study.title}</h1>
        <div className="mt-2">
          <Badge className="bg-primary/10 text-primary border-primary/20">{study.bible_passage}</Badge>
        </div>
      </div>

      <blockquote className="border-l-4 border-primary/40 pl-4 italic text-muted-foreground text-lg leading-relaxed">
        {study.central_idea}
      </blockquote>

      <div className="prose prose-sm max-w-none text-foreground">
        <p className="leading-relaxed">{study.summary}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{study.depth_level}</Badge>
        <Badge variant="secondary">{study.doctrine_line}</Badge>
        <Badge variant="secondary">{study.language}</Badge>
      </div>
    </div>
  );
}
