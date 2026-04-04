import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfidenceBadge } from '../ConfidenceBadge';
import type { BiblicalStudyOutput } from '@/types/biblical-study';

const relationshipLabels: Record<string, string> = {
  typology: 'Tipologia',
  fulfillment: 'Cumprimento',
  parallel: 'Paralelo',
  contrast: 'Contraste',
  echo: 'Eco',
};

export function TabTeologia({ study }: { study: BiblicalStudyOutput }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-semibold mb-3">Interpretações Teológicas</h3>
        <div className="space-y-3">
          {study.theological_interpretation.map((item, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                  {item.perspective}
                  {item.is_debated && (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Interpretação Debatida</Badge>
                  )}
                  <ConfidenceBadge level={item.source_confidence} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm leading-relaxed text-muted-foreground">{item.interpretation}</p>
                {item.sources && item.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.sources.map((src, j) => (
                      <Badge key={j} variant="secondary" className="text-[10px]">{src}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {study.biblical_connections?.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-semibold mb-3">Conexões Bíblicas</h3>
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Passagem</TableHead>
                    <TableHead>Tipo de Relação</TableHead>
                    <TableHead>Nota</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {study.biblical_connections.map((conn, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{conn.passage}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{relationshipLabels[conn.relationship] || conn.relationship}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{conn.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
