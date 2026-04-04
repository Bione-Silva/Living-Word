import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfidenceBadge } from '../ConfidenceBadge';
import type { BiblicalStudyOutput } from '@/types/biblical-study';

export function TabContexto({ study }: { study: BiblicalStudyOutput }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            Contexto Histórico
            <ConfidenceBadge level={study.historical_context.source_confidence} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">{study.historical_context.text}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            Contexto Literário
            <ConfidenceBadge level={study.literary_context.source_confidence} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Gênero:</span>
            <Badge variant="outline">{study.literary_context.genre}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{study.literary_context.position_in_book}</p>
        </CardContent>
      </Card>

      {study.text_structure?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Estrutura do Texto</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seção</TableHead>
                  <TableHead>Versículos</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {study.text_structure.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{s.section}</TableCell>
                    <TableCell>{s.verses}</TableCell>
                    <TableCell className="text-muted-foreground">{s.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {study.bible_text?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Texto Bíblico Base</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {study.bible_text.map((bt, i) => (
              <blockquote key={i} className="border-l-2 border-primary/30 pl-3">
                <p className="text-sm">
                  <strong>{bt.reference}</strong>{' '}
                  <em className="text-muted-foreground">{bt.text}</em>
                </p>
                <Badge variant="secondary" className="mt-1 text-[10px]">{bt.version}</Badge>
              </blockquote>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
