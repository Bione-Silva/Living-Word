import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Lock, Crown, BookOpen, FileText, Heart, Eye, Trash2, Copy } from 'lucide-react';

const mockMaterials = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  title: `Material pastoral #${i + 1}`,
  type: ['sermon', 'outline', 'devotional'][i % 3],
  passage: ['João 15:1-8', 'Mateus 5:13-16', 'Salmos 23'][i % 3],
  created_at: new Date(Date.now() - i * 86400000).toLocaleDateString(),
  favorite: i < 3,
}));

const typeIcons: Record<string, any> = {
  sermon: BookOpen,
  outline: FileText,
  devotional: Heart,
};

export default function Biblioteca() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const isFree = profile?.plan === 'free';

  const filtered = mockMaterials.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.passage.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">{t('library.title')}</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título, passagem..."
          className="pl-10"
        />
      </div>

      <div className="grid gap-3">
        {filtered.map((item, i) => {
          const Icon = typeIcons[item.type] || FileText;
          const isLocked = isFree && i >= 10;

          return (
            <Card key={item.id} className={`relative ${isLocked ? 'overflow-hidden' : ''}`}>
              {isLocked && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="text-center">
                    <Lock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium">{t('library.archived')}</p>
                    <Button size="sm" className="mt-2 gap-1 bg-primary text-primary-foreground" asChild>
                      <a href="/upgrade"><Crown className="h-3 w-3" /> {t('upgrade.cta')}</a>
                    </Button>
                  </div>
                </div>
              )}
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.passage} · {item.created_at}</p>
                </div>
                <Badge variant="secondary" className="text-[10px] capitalize">{item.type}</Badge>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8"><Eye className="h-3 w-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8"><Copy className="h-3 w-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
