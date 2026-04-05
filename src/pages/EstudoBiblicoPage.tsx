import { useState } from 'react';
import { BookOpen, ShieldAlert, Zap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudyForm } from '@/components/biblical-study/StudyForm';
import { StudyActions } from '@/components/biblical-study/StudyActions';
import { TabResumo } from '@/components/biblical-study/tabs/TabResumo';
import { TabContexto } from '@/components/biblical-study/tabs/TabContexto';
import { TabExegese } from '@/components/biblical-study/tabs/TabExegese';
import { TabTeologia } from '@/components/biblical-study/tabs/TabTeologia';
import { TabAplicacao } from '@/components/biblical-study/tabs/TabAplicacao';
import { TabPerguntas } from '@/components/biblical-study/tabs/TabPerguntas';
import { TabConclusao } from '@/components/biblical-study/tabs/TabConclusao';
import { TabAvisos } from '@/components/biblical-study/tabs/TabAvisos';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { helpFullArticles, helpCategories } from '@/data/help-center-data';
import type { BiblicalStudyFormData, BiblicalStudyResponse } from '@/types/biblical-study';
import type { GenerationMeta } from '@/types/generation-meta';
import { GenerationMetaFooter } from '@/components/generation/GenerationMetaFooter';
import { RichLoadingState } from '@/components/generation/RichLoadingState';
import { loadingHints, studyLoadingMessages } from '@/lib/generation-ui';

export default function EstudoBiblicoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BiblicalStudyResponse | null>(null);
  const [generationMeta, setGenerationMeta] = useState<GenerationMeta | null>(null);
  const { profile } = useAuth();
  const { lang, t } = useLanguage();
  const isFree = profile?.plan === 'free';

  const handleGenerate = async (formData: BiblicalStudyFormData) => {
    setIsLoading(true);
    setResult(null);
    setGenerationMeta(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-biblical-study', {
        body: {
          ...formData,
          isFree,
        },
      });

      if (error) throw error;

      if (data?.error === 'generation_limit_reached') {
        toast.warning(t('study.limit_reached'));
        return;
      }
      if (data?.error === 'schema_validation_failed') {
        toast.error(t('study.schema_error'));
        return;
      }
      if (!data?.success) {
        toast.error(t('study.error'));
        return;
      }

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
              {article?.title?.[lang] || (lang === 'PT' ? 'Estudo Bíblico Completo' : lang === 'EN' ? 'Complete Bible Study' : 'Estudio Bíblico Completo')}
            </h1>
            {subtitle && (
              <p className="text-sm text-primary font-medium italic mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {summary && (
          <p className="text-sm text-foreground/70 leading-relaxed">{summary}</p>
        )}

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

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left sidebar - form */}
        <div className="w-full lg:w-[380px] shrink-0">
          <StudyForm onSubmit={handleGenerate} isLoading={isLoading} />
        </div>

        {/* Right main area */}
        <div className="flex-1 min-w-0">
          {result?.caution_mode && (
            <Alert className="mb-4 border-yellow-300 bg-yellow-50 text-yellow-900">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>{t('study.sensitive_title')}</AlertTitle>
              <AlertDescription>
                {t('study.sensitive_desc')}
              </AlertDescription>
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
            <div>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-semibold">{t('study.result_title')}</h2>
                </div>
                <StudyActions study={study} />
              </div>

              <Tabs defaultValue="resumo">
                <TabsList className="flex flex-wrap h-auto gap-1">
                  <TabsTrigger value="resumo">{t('study.tab.resumo')}</TabsTrigger>
                  <TabsTrigger value="contexto">{t('study.tab.contexto')}</TabsTrigger>
                  <TabsTrigger value="exegese">{t('study.tab.exegese')}</TabsTrigger>
                  <TabsTrigger value="teologia">{t('study.tab.teologia')}</TabsTrigger>
                  <TabsTrigger value="aplicacao">{t('study.tab.aplicacao')}</TabsTrigger>
                  <TabsTrigger value="perguntas">{t('study.tab.perguntas')}</TabsTrigger>
                  <TabsTrigger value="conclusao">{t('study.tab.conclusao')}</TabsTrigger>
                  <TabsTrigger value="avisos">{t('study.tab.avisos')}</TabsTrigger>
                </TabsList>

                <div className="mt-4">
                  <TabsContent value="resumo"><TabResumo study={study} /></TabsContent>
                  <TabsContent value="contexto"><TabContexto study={study} /></TabsContent>
                  <TabsContent value="exegese"><TabExegese study={study} /></TabsContent>
                  <TabsContent value="teologia"><TabTeologia study={study} /></TabsContent>
                  <TabsContent value="aplicacao"><TabAplicacao study={study} /></TabsContent>
                  <TabsContent value="perguntas"><TabPerguntas study={study} /></TabsContent>
                  <TabsContent value="conclusao"><TabConclusao study={study} /></TabsContent>
                  <TabsContent value="avisos"><TabAvisos study={study} /></TabsContent>
                </div>
              </Tabs>

              {generationMeta && (
                <div className="mt-4">
                  <GenerationMetaFooter lang={lang} meta={generationMeta} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
