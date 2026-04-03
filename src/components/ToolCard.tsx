import { Card, CardContent } from '@/components/ui/card';
import { Crown } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface ToolCardData {
  id: string;
  icon: React.ElementType;
  title: { PT: string; EN: string; ES: string };
  description: { PT: string; EN: string; ES: string };
  path?: string;
  locked?: boolean;
  hasModal?: boolean;
}

interface ToolCardProps {
  tool: ToolCardData;
  lang: 'PT' | 'EN' | 'ES';
  isFree: boolean;
  onClick: (tool: ToolCardData) => void;
}

export function ToolCard({ tool, lang, isFree, onClick }: ToolCardProps) {
  const isLocked = tool.locked && isFree;
  const Icon = tool.icon;

  const card = (
    <Card
      className={`group relative cursor-pointer transition-all duration-200 border-border/60 bg-card hover:shadow-lg hover:-translate-y-0.5 ${
        isLocked
          ? 'opacity-60 hover:opacity-80'
          : 'hover:border-accent/50 hover:shadow-[0_0_20px_-5px_hsl(44,65%,58%,0.25)]'
      }`}
    >
      {isLocked && (
        <div className="absolute top-2.5 right-2.5 z-10">
          <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
            <Crown className="h-3 w-3 text-accent" />
          </div>
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center gap-2.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isLocked
                ? 'bg-muted/50'
                : 'bg-primary/10 group-hover:bg-primary/15'
            }`}
          >
            <Icon
              className={`h-5.5 w-5.5 ${
                isLocked ? 'text-muted-foreground' : 'text-primary'
              }`}
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm leading-tight">
              {tool.title[lang]}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
              {tool.description[lang]}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLocked) return <Link to="/upgrade">{card}</Link>;
  if (tool.path) return <Link to={tool.path}>{card}</Link>;
  return <div onClick={() => onClick(tool)}>{card}</div>;
}
