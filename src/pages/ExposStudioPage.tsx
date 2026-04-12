// @ts-nocheck
import { useState, useRef, useCallback } from 'react';
import { BookOpen, Save, Copy, FileDown, Share2, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RichLoadingState } from '@/components/generation/RichLoadingState';
import { GenerationMetaFooter } from '@/components/generation/GenerationMetaFooter';
import { exposLoadingMessages, loadingHints } from '@/lib/generation-ui';
import type { GenerationMeta } from '@/types/generation-meta';

const formats = [
  {
    id: 'individual',
    label: 'Individual',
    desc: 'Devocional e Oração',
    emoji: '🙏',
  },
  {
    id: 'celula',
    label: 'Célula',
    desc: 'Estudo para Pequenos Grupos',
    emoji: '🤝',
  },
  {
    id: 'classe',
    label: 'Classe',
    desc: 'Escola Bíblica / Estudo Teológico',
    emoji: '📚',
  },
  {
    id: 'discipulado',
    label: 'Discipulado',
    desc: 'Aconselhamento 1-a-1',
    emoji: '💬',
  },
  {
    id: 'sermao',
    label: 'Sermão',
    desc: 'Esboço Homilético Profundo',
    emoji: '🎤',
  },
];

export default function ExposStudioPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const [passagem, setPassagem] = useState('');
  const [formato, setFormato] = useState('individual');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [markdown, setMarkdown] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [generationMeta, setGenerationMeta] = useState<GenerationMeta | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleGenerate = useCallback(async () => {
    if (!passagem.trim()) return;
    setIsLoading(true);
    setMarkdown('');
    setIsEditing(false);
    setGenerationMeta(null);

    try {
      const { data, error } = await supabase.functions.invoke('expos-generate', {
        body: { passagem: passagem.trim(), formato },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setMarkdown(data.markdown || '');
      setGenerationMeta((data?.generation_meta ?? null) as GenerationMeta | null);
      toast.success('Estudo gerado com sucesso!');
    } catch {
      toast.error('Erro ao gerar estudo. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [passagem, formato]);

  const handleSave = useCallback(async () => {
    if (!user || !markdown) return;
    setIsSaving(true);

    const content = isEditing && textareaRef.current
      ? textareaRef.current.value
      : markdown;

    // Extract title from first heading
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const titulo = titleMatch ? titleMatch[1] : `Estudo E.X.P.O.S. — ${passagem}`;

    try {
      const { error } = await (supabase as any).from('expos_studies' as any).insert({
        user_id: user.id,
        passagem,
        formato,
        conteudo_markdown: content,
        titulo,
      });

      if (error) throw error;
      toast.success('Estudo salvo no seu acervo!');
    } catch {
      toast.error('Erro ao salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  }, [user, markdown, isEditing, passagem, formato]);

  const handleCopy = useCallback(async () => {
    const content = isEditing && textareaRef.current
      ? textareaRef.current.value
      : markdown;
    await navigator.clipboard.writeText(content);
    toast.success('Copiado para a área de transferência!');
  }, [markdown, isEditing]);

  const handleExportPdf = useCallback(async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const { pdfBrandHeader, pdfBrandFooter } = await import('@/lib/export-branding');
    const el = editorRef.current;
    if (!el) return;

    toast.info('Gerando PDF...');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = pdfBrandHeader();
    wrapper.appendChild(el.cloneNode(true));
    wrapper.insertAdjacentHTML('beforeend', pdfBrandFooter());
    document.body.appendChild(wrapper);
    const opt = {
      margin: [15, 15, 15, 15],
      filename: `expos-${formato}-${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
    };
    await html2pdf().set(opt).from(wrapper).save();
    document.body.removeChild(wrapper);
    toast.success('PDF exportado!');
  }, [formato]);

  const handleShare = useCallback(async () => {
    const content = isEditing && textareaRef.current
      ? textareaRef.current.value
      : markdown;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Estudo E.X.P.O.S. — ${passagem}`,
          text: content.slice(0, 300) + '...',
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(content);
      toast.success('Conteúdo copiado! Cole onde desejar compartilhar.');
    }
  }, [markdown, isEditing, passagem]);

  const toggleEdit = useCallback(() => {
    setIsEditing(prev => !prev);
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              E.X.P.O.S. Studio
            </h1>
            <p className="text-sm text-muted-foreground">
              Crie estudos teológicos editáveis com inteligência artificial
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ─── Sidebar ─── */}
        <div className="w-full lg:w-[380px] shrink-0">
          <Card className="border-border/60 sticky top-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Configurar Estudo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Passagem */}
              <div className="space-y-1.5">
                <Label htmlFor="passagem">Passagem Bíblica ou Tópico *</Label>
                <Input
                  id="passagem"
                  placeholder="Ex: João 3:16-18 ou Romanos 8:1-11"
                  value={passagem}
                  onChange={e => setPassagem(e.target.value)}
                  className="min-h-[48px]"
                  required
                />
              </div>

              {/* Format Selection */}
              <div className="space-y-2">
                <Label>Formato do Estudo</Label>
                <div className="grid gap-2">
                  {formats.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFormato(f.id)}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all
                        ${formato === f.id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'border-border hover:border-primary/40 hover:bg-muted/50'
                        }`}
                    >
                      <span className="text-2xl">{f.emoji}</span>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${formato === f.id ? 'text-primary' : 'text-foreground'}`}>
                          {f.label}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{f.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                className="w-full gap-2 min-h-[48px]"
                disabled={isLoading || !passagem.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando documento E.X.P.O.S.
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Gerar Documento E.X.P.O.S.
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ─── Document Area ─── */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <RichLoadingState lang={lang} messages={exposLoadingMessages} hint={loadingHints} minHeightClassName="h-[500px]" />
          ) : !markdown ? (
            <div className="flex flex-col items-center justify-center h-[500px] rounded-xl border border-dashed border-border bg-card/50 text-muted-foreground">
              <BookOpen className="h-20 w-20 mb-6 opacity-20" />
              <p className="text-base font-medium">Seu documento aparecerá aqui</p>
              <p className="text-sm mt-1 opacity-70">
                Escolha o formato e gere seu estudo E.X.P.O.S.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="sticky top-0 z-10 flex items-center gap-2 flex-wrap rounded-t-xl border border-border bg-card px-4 py-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Salvar no Acervo
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopy}>
                  <Copy className="h-3.5 w-3.5" />
                  Copiar
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportPdf}>
                  <FileDown className="h-3.5 w-3.5" />
                  Exportar PDF
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
                  <Share2 className="h-3.5 w-3.5" />
                  Compartilhar
                </Button>

                <div className="ml-auto">
                  <Button
                    variant={isEditing ? 'default' : 'ghost'}
                    size="sm"
                    onClick={toggleEdit}
                  >
                    {isEditing ? 'Visualizar' : 'Editar'}
                  </Button>
                </div>
              </div>

              {/* Document */}
              {isEditing ? (
                <div className="rounded-b-xl border border-t-0 border-border bg-background">
                  <textarea
                    ref={textareaRef}
                    defaultValue={markdown}
                    className="w-full min-h-[600px] resize-y p-8 md:p-12 bg-transparent font-mono text-sm leading-relaxed text-foreground focus:outline-none"
                    spellCheck={false}
                  />
                </div>
              ) : (
                <div
                  ref={editorRef}
                  className="rounded-b-xl border border-t-0 border-border bg-background p-8 md:p-12"
                >
                  <article className="prose prose-stone dark:prose-invert max-w-none prose-headings:font-display prose-h1:text-2xl prose-h1:mb-6 prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-p:leading-relaxed prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-blockquote:border-primary/40 prose-blockquote:text-foreground/80">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {markdown}
                    </ReactMarkdown>
                  </article>
                </div>
              )}

              {generationMeta && <GenerationMetaFooter lang={lang} meta={generationMeta} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
