import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Loader2, Copy, Save, BookOpen, Wand2, FileText, Minimize2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, BookA } from 'lucide-react';
import type { Language } from '@/lib/i18n';

interface OriginalTextModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolTitle: string;
}

export function OriginalTextModal({ open, onOpenChange, toolTitle }: OriginalTextModalProps) {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generationLang, setGenerationLang] = useState<Language>(lang);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    setGenerationLang(lang);
  }, [lang]);

  const resetForm = () => {
    setResult(null);
    setInput('');
    setGenerationLang(lang);
  };

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const handleGenerate = async () => {
    if (!input.trim() || !user) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-original-text', {
        body: {
          bible_passage: input,
          language: generationLang,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Unknown error');
      
      setResult(data.study);
    } catch (err: any) {
      toast.error(err.message || 'Error generating original text');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const textToCopy = `[${result.bible_passage}] ${result.original_text}\n\n${result.exegetical_summary}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success(lang === 'PT' ? 'Copiado!' : lang === 'EN' ? 'Copied!' : '¡Copiado!');
  };

  const handleSave = async () => {
    // Edge function already saves it to the materials table!
    toast.success(lang === 'PT' ? 'Salvo na Biblioteca!' : lang === 'EN' ? 'Saved to Library!' : '¡Guardado en Biblioteca!');
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="theme-app max-w-4xl w-[95vw] h-[90vh] overflow-hidden flex flex-col bg-background text-foreground min-h-0 max-md:w-full max-md:h-[100dvh] max-md:max-h-full max-md:rounded-none max-md:m-0 break-words p-0">
        
        {/* Header */}
        <div className="space-y-2 p-6 pb-4 border-b border-border shrink-0 bg-muted/20">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center">
              <BookA className="h-6 w-6 text-purple-600" />
            </div>
            <div className="min-w-0">
              <DialogHeader className="p-0 space-y-1 text-left">
                <DialogTitle className="font-display text-xl leading-tight text-foreground">
                  {toolTitle}
                </DialogTitle>
                <DialogDescription className="text-sm text-purple-600 font-medium italic">
                  {lang === 'PT' ? 'Grego e Hebraico ao seu alcance' : lang === 'EN' ? 'Greek & Hebrew at your fingertips' : 'Griego y Hebreo a tu alcance'}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            {lang === 'PT' 
              ? 'Acesse o texto bíblico nas línguas originais com análise palavra por palavra, sem precisar de anos de seminário.'
              : 'Access the biblical text in original languages with word-by-word analysis, without seminary degrees.'}
          </p>
        </div>

        {/* Input Form area */}
        {!result && !loading && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm text-foreground/80">
                <Wand2 className="h-5 w-5 text-purple-500 shrink-0" />
                <span className="leading-snug">Resultados em segundos, prontos para uso</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm text-foreground/80">
                <FileText className="h-5 w-5 text-purple-500 shrink-0" />
                <span className="leading-snug">Interface simples e intuitiva</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm text-foreground/80">
                <Globe className="h-5 w-5 text-purple-500 shrink-0" />
                <span className="leading-snug">Disponível em português, inglês e espanhol</span>
              </div>
            </div>

            <div className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label className="font-semibold text-base">Passagem bíblica</Label>
                <Input
                  className="h-12 text-base border-purple-500 focus-visible:ring-purple-500"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ex: João 3:16 ou Gênesis 1:1"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
              </div>

              <div className="flex items-center gap-3 bg-muted/30 p-4 rounded-xl">
                <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
                <Label className="text-sm font-medium text-foreground shrink-0">
                  {lang === 'PT' ? 'Gerar em:' : 'Generate in:'}
                </Label>
                <Select value={generationLang} onValueChange={(v) => setGenerationLang(v as Language)}>
                  <SelectTrigger className="w-[180px] border bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PT">Português</SelectItem>
                    <SelectItem value="EN">English</SelectItem>
                    <SelectItem value="ES">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                size="lg"
                onClick={handleGenerate}
                disabled={loading || !input.trim() || input.length < 3}
                className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white h-14 text-lg"
              >
                <Wand2 className="h-5 w-5" />
                {lang === 'PT' ? 'Gerar Análise Original' : 'Generate Original Analysis'}
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="flex flex-col items-center justify-center space-y-6 max-w-sm text-center">
              <div className="relative">
                <BookA className="h-12 w-12 text-purple-400 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-semibold text-xl text-purple-700">Traduzindo originais...</h3>
                <p className="text-sm text-muted-foreground">O texto milenar está sendo traduzido palavra por palavra diretamente para você.</p>
              </div>
            </div>
          </div>
        )}

        {/* Result Area */}
        {result && !loading && (
          <div className="flex-1 min-h-0 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
            <ScrollArea className="flex-1 px-6">
              <div className="py-6 max-w-3xl mx-auto space-y-10">
                {/* Ancient Text Header */}
                <div className="text-center space-y-4">
                  <h3 className="text-sm uppercase tracking-[0.2em] font-semibold text-purple-600">
                    {result.bible_passage}
                  </h3>
                  <div className="bg-card border shadow-sm rounded-2xl p-8">
                    <p className="text-2xl sm:text-3xl lg:text-4xl leading-relaxed text-right font-serif text-slate-800 dark:text-slate-100" style={{ direction: result.original_text.match(/[א-ת]/) ? 'rtl' : 'ltr' }}>
                      {result.original_text}
                    </p>
                  </div>
                </div>

                {/* Exegetical Summary */}
                <div className="space-y-3 prose prose-purple dark:prose-invert max-w-none">
                  <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap font-serif">
                    {result.exegetical_summary}
                  </p>
                </div>

                {/* Word by Word Table */}
                <div className="space-y-4">
                  <h4 className="text-sm uppercase tracking-wider font-semibold text-foreground/50 border-b pb-2">
                    Análise Palavra-por-Palavra
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {result.word_by_word.map((word: any, i: number) => (
                      <div key={i} className="bg-card border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="sm:w-32 shrink-0">
                          <p className="text-2xl font-serif mb-1" style={{ direction: word.original_word.match(/[א-ת]/) ? 'rtl' : 'ltr', textAlign: word.original_word.match(/[א-ת]/) ? 'right' : 'left' }}>
                            {word.original_word}
                          </p>
                          <p className="text-xs font-mono text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded inline-block">
                            {word.transliteration}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <h5 className="font-bold text-lg text-foreground">{word.translation}</h5>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              ({word.morphology})
                            </span>
                            {word.strong_number && (
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                                {word.strong_number}
                              </span>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed text-foreground/80">
                            {word.deeper_meaning}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Actions Footer */}
            <div className="px-6 py-4 border-t bg-background flex flex-wrap items-center gap-3 shrink-0">
              <Button size="sm" variant="outline" className="gap-2 border-purple-200 hover:bg-purple-50 hover:text-purple-700 dark:border-purple-900/50 dark:hover:bg-purple-900/20" onClick={handleCopy}>
                <Copy className="h-4 w-4" /> {lang === 'PT' ? 'Copiar' : 'Copy'}
              </Button>
              <Button size="sm" variant="ghost" className="gap-2 ml-auto" onClick={() => setResult(null)}>
                Nova Análise
              </Button>
              <Button size="sm" variant="default" className="gap-1 bg-purple-600 hover:bg-purple-700" onClick={() => onOpenChange(false)}>
                <Minimize2 className="h-3.5 w-3.5" /> Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
