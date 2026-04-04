import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import type { BiblicalStudyOutput } from '@/types/biblical-study';

export function TabAvisos({ study }: { study: BiblicalStudyOutput }) {
  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Aviso Pastoral</AlertTitle>
        <AlertDescription className="mt-2 text-sm leading-relaxed">
          {study.pastoral_warning}
        </AlertDescription>
      </Alert>

      {study.rag_sources_used?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Fontes históricas utilizadas (RAG):</h4>
          <div className="flex flex-wrap gap-1.5">
            {study.rag_sources_used.map((src, i) => (
              <Badge key={i} variant="secondary">{src}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
