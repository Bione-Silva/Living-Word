import { useState } from 'react';
import { BookOpen, ShieldAlert, Zap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
import type { BiblicalStudyFormData, BiblicalStudyResponse } from '@/types/biblical-study';

export default function EstudoBiblicoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BiblicalStudyResponse | null>(null);
  const { profile } = useAuth();
  const { t } = useLanguage();
  const isFree = profile?.plan === 'free';

  const handleGenerate = async (formData: BiblicalStudyFormData) => {
    setIsLoading(true);
    setResult(null);
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
    } catch {
      toast.error(t('study.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const study = result?.study;

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl">
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

        {!study ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
            <BookOpen className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-sm">{t('study.empty')}</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-semibold">{t('study.result_title')}</h2>
                {!isFree && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Zap className="h-3 w-3" />
                    GPT-4o
                  </Badge>
                )}
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
          </div>
        )}
      </div>
    </div>
  );
}
