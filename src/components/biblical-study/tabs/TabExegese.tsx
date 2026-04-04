import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ConfidenceBadge } from '../ConfidenceBadge';
import type { BiblicalStudyOutput } from '@/types/biblical-study';

export function TabExegese({ study }: { study: BiblicalStudyOutput }) {
  return (
    <Accordion type="multiple" className="space-y-2">
      {study.exegesis.map((item, i) => (
        <AccordionItem key={i} value={`exegesis-${i}`} className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            {item.focus}
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            {item.linguistic_note && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Nota Linguística</h4>
                <p className="text-sm leading-relaxed">{item.linguistic_note}</p>
              </div>
            )}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Contribuição Teológica</h4>
              <p className="text-sm leading-relaxed">{item.theological_insight}</p>
            </div>
            <ConfidenceBadge level={item.source_confidence} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
