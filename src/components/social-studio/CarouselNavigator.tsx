import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export function CarouselNavigator({ current, total, onPrev, onNext }: Props) {
  if (total <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-4">
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-full border-border"
        onClick={onPrev}
        disabled={current === 0}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i === current ? 'bg-primary scale-125' : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>

      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-full border-border"
        onClick={onNext}
        disabled={current === total - 1}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
