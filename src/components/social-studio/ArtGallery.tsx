import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Download, Trash2, Image, X } from 'lucide-react';
import { toast } from 'sonner';

type L = 'PT' | 'EN' | 'ES';

const labels: Record<L, { title: string; empty: string; delete: string; download: string; deleteConfirm: string; deleted: string }> = {
  PT: { title: '🖼️ Minhas Artes', empty: 'Nenhuma arte salva ainda. Exporte uma imagem no Estúdio para começar!', delete: 'Excluir', download: 'Baixar', deleteConfirm: 'Tem certeza?', deleted: 'Arte excluída' },
  EN: { title: '🖼️ My Arts', empty: 'No saved art yet. Export an image in the Studio to get started!', delete: 'Delete', download: 'Download', deleteConfirm: 'Are you sure?', deleted: 'Art deleted' },
  ES: { title: '🖼️ Mis Artes', empty: 'Aún no hay arte guardado. ¡Exporta una imagen en el Estudio para comenzar!', delete: 'Eliminar', download: 'Descargar', deleteConfirm: '¿Estás seguro?', deleted: 'Arte eliminado' },
};

interface ArtItem {
  id: string;
  file_url: string;
  title: string | null;
  aspect_ratio: string;
  created_at: string;
  file_path: string;
}

interface Props {
  lang: L;
  refreshTrigger?: number;
}

export function ArtGallery({ lang, refreshTrigger }: Props) {
  const { user } = useAuth();
  const l = labels[lang];
  const [arts, setArts] = useState<ArtItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<ArtItem | null>(null);

  const fetchArts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('social_arts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setArts((data as ArtItem[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchArts(); }, [fetchArts, refreshTrigger]);

  const handleDelete = async (art: ArtItem) => {
    await supabase.storage.from('social_arts').remove([art.file_path]);
    await (supabase as any).from('social_arts').delete().eq('id', art.id);
    setArts(prev => prev.filter(a => a.id !== art.id));
    setPreview(null);
    toast.success(l.deleted);
  };

  const handleDownload = (art: ArtItem) => {
    const a = document.createElement('a');
    a.href = art.file_url;
    a.download = art.title || 'arte.png';
    a.target = '_blank';
    a.click();
  };

  if (!user) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">{l.title}</h3>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : arts.length === 0 ? (
        <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/10 p-6 text-center">
          <Image className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-xs text-muted-foreground">{l.empty}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {arts.map(art => (
            <button
              key={art.id}
              onClick={() => setPreview(art)}
              className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all bg-card"
            >
              <img src={art.file_url} alt={art.title || ''} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">{preview?.title || 'Arte'}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-3">
              <img src={preview.file_url} alt="" className="w-full rounded-lg" />
              <p className="text-xs text-muted-foreground">
                {new Date(preview.created_at).toLocaleDateString(lang === 'PT' ? 'pt-BR' : lang === 'ES' ? 'es-ES' : 'en-US')} · {preview.aspect_ratio}
              </p>
              <div className="flex gap-2">
                <Button size="sm" className="gap-1.5 flex-1" onClick={() => handleDownload(preview)}>
                  <Download className="h-3.5 w-3.5" /> {l.download}
                </Button>
                <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => handleDelete(preview)}>
                  <Trash2 className="h-3.5 w-3.5" /> {l.delete}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
