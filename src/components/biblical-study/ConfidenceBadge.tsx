import { Badge } from '@/components/ui/badge';

interface ConfidenceBadgeProps {
  level: 'high' | 'medium' | 'low';
}

const config = {
  high: { label: 'Alta Confiança', className: 'bg-green-100 text-green-800 border-green-200' },
  medium: { label: 'Confiança Média', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  low: { label: 'Fonte Incerta', className: 'bg-orange-100 text-orange-800 border-orange-200' },
};

export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  const c = config[level];
  return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
}
