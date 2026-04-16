import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BookOpen, ShieldAlert, Zap, Moon, Sun, PenLine, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StudyForm } from '@/components/biblical-study/StudyForm';
import { StudyActions } from '@/components/biblical-study/StudyActions';
import { StudyViewer } from '@/components/biblical-study/StudyViewer';
import { StudyTypePicker, STUDY_TYPE_OPTIONS } from '@/components/biblical-study/StudyTypePicker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { helpFullArticles, helpCategories } from '@/data/help-center-data';
import type { BiblicalStudyFormData, BiblicalStudyResponse, StudyType } from '@/types/biblical-study';
import type { GenerationMeta } from '@/types/generation-meta';
import { GenerationMetaFooter } from '@/components/generation/GenerationMetaFooter';
import { RichLoadingState } from '@/components/generation/RichLoadingState';
import { loadingHints, studyLoadingMessages } from '@/lib/generation-ui';
import { Button } from '@/components/ui/button';
import { BibleDrawer } from '@/components/BibleDrawer';
import { PreacherNotes } from '@/components/sermon/PreacherNotes';

export default function EstudoBiblicoPage() {
  const location = useLocation();
  const prefillPassage = (location.state as { prefillPassage?: string })?.prefillPassage || '';
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BiblicalStudyResponse | null>(null);
  const [generationMeta, setGenerationMeta] = useState<GenerationMeta | null>(null);
  const { profile } = useAuth();
  const { lang, t } = useLanguage();
  const isFree = profile?.plan === 'free';
  const [darkStudy, setDarkStudy] = useState(false);
  const [bibleOpen, setBibleOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [studyType, setStudyType] = useState<StudyType>('complete');

  const handleGenerate = async (formData: BiblicalStudyFormData) => {
    setIsLoading(true);
    setResult(null);
    setGenerationMeta(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-biblical-study', {
        body: { ...formData, isFree },
      });

      if (error) throw error;

      if (data?.error === 'generation_limit_reached') { toast.warning(t('study.limit_reached')); return; }
      if (data?.error === 'schema_validation_failed') { toast.error(t('study.schema_error')); return; }
      if (!data?.success) { toast.error(t('study.error')); return; }

      setResult(data as BiblicalStudyResponse);
      setGenerationMeta((data?.generation_meta ?? null) as GenerationMeta | null);
    } catch {
      toast.error(t('study.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const study = result?.study;

  // Help header data
  const article = helpFullArticles.find(a => a.toolId === 'bible-study');
  const toolCard = helpCategories.flatMap(c => c.tools).find(t => t.id === 'bible-study');
  const IconComp = article?.icon || toolCard?.icon;
  const subtitle = article?.subtitle?.[lang] || toolCard?.description?.[lang] || '';
  const summary = article?.heroSummary?.[lang] || '';
  const bullets = article?.heroBullets || [];

  return (
    <div className="max-w-7xl space-y-4">
      {/* ── Help hero header ── */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-start gap-3">
          {IconComp && (
            <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
              <IconComp className="h-6 w-6 text-primary" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-display text-xl font-bold leading-tight text-foreground">
              {article?.title?.[lang] || (lang === 'PT' ? 'Estudo Bíblico E.X.P.O.S.' : lang === 'EN' ? 'E.X.P.O.S. Bible Study' : 'Estudio Bíblico E.X.P.O.S.')}
            </h1>
            {subtitle && <p className="text-sm text-primary font-medium italic mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {summary && <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>}

        {bullets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {bullets.map((b, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground/80">
                <Zap className="h-3 w-3 text-primary shrink-0" />
                <span className="leading-snug">{b[lang]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Study type picker ── */}
      <StudyTypePicker value={studyType} onChange={setStudyType} />

      {/* Bible quick-access button */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-xs text-muted-foreground">
          {(() => {
            const opt = STUDY_TYPE_OPTIONS.find(o => o.id === studyType);
            if (!opt) return null;
            const label = opt.label[lang as 'PT' | 'EN' | 'ES'];
            const prefix = lang === 'PT' ? 'Modo selecionado:' : lang === 'EN' ? 'Selected mode:' : 'Modo seleccionado:';
            return (
              <span>
                {prefix} <span className="font-semibold text-primary">{label}</span>
              </span>
            );
          })()}
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setBibleOpen(true)}>
          <BookOpen className="h-3.5 w-3.5" />
          {lang === 'PT' ? 'Abrir Bíblia' : lang === 'EN' ? 'Open Bible' : 'Abrir Biblia'}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left sidebar - form */}
        <div className="w-full lg:w-[380px] shrink-0">
          <StudyForm onSubmit={handleGenerate} isLoading={isLoading} prefillPassage={prefillPassage} studyType={studyType} />
        </div>

        {/* Right main area */}
        <div className="flex-1 min-w-0">
          {(result?.caution_mode || result?.study?.caution_mode) && (
            <Alert className="mb-4 border-primary/30 bg-primary/5 text-foreground">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>{t('study.sensitive_title')}</AlertTitle>
              <AlertDescription>{t('study.sensitive_desc')}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <RichLoadingState lang={lang} messages={studyLoadingMessages} hint={loadingHints} minHeightClassName="h-[400px]" />
          ) : !study ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
              <BookOpen className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-sm">{t('study.empty')}</p>
            </div>
          ) : (
            <div className={darkStudy ? 'dark rounded-xl' : ''}>
              <div className={darkStudy ? 'bg-background text-foreground rounded-xl p-4' : ''}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="font-display text-lg font-semibold">{t('study.result_title')}</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => setDarkStudy(!darkStudy)}
                  >
                    {darkStudy ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                    {darkStudy ? (lang === 'EN' ? 'Light' : 'Claro') : (lang === 'EN' ? 'Dark' : 'Escuro')}
                  </Button>
                  <StudyActions
                    study={study}
                    materialId={result?.material_id}
                    onImagesGenerated={(imgs) => toast.success(`${imgs.length} ilustrações adicionadas!`)}
                  />
                </div>
              </div>

              <StudyViewer study={study} />

              {/* ── Notes section ── */}
              {result?.material_id && (
                <div className="mt-4 border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setNotesOpen(!notesOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <PenLine className="h-4 w-4 text-primary" />
                      {lang === 'PT' ? 'Minhas Anotações' : lang === 'EN' ? 'My Notes' : 'Mis Notas'}
                    </span>
                    {notesOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {notesOpen && (
                    <div className="h-[300px]">
                      <PreacherNotes materialId={result.material_id} />
                    </div>
                  )}
                </div>
              )}

              {generationMeta && (
                <div className="mt-4">
                  <GenerationMetaFooter lang={lang} meta={generationMeta} />
                </div>
              )}
              </div>
            </div>
          )}
        </div>
      </div>

      <BibleDrawer open={bibleOpen} onOpenChange={setBibleOpen} />
    </div>
  );
}
