import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import type { BiblicalStudyOutput } from '@/types/biblical-study';

export function TabAplicacao({ study }: { study: BiblicalStudyOutput }) {
  return (
    <div className="space-y-3">
      {study.application.map((item, i) => (
        <Card key={i}>
          <CardContent className="pt-4 space-y-3">
            <Badge variant="outline">{item.context}</Badge>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.application}</p>
            <div className="flex items-start gap-2 bg-primary/5 rounded-lg p-3">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Ação Prática</span>
                <p className="text-sm mt-0.5">{item.practical_action}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
