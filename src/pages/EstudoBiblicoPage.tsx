import { useState } from 'react';
import { BookOpen, ShieldAlert } from 'lucide-react';
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
import type { BiblicalStudyFormData, BiblicalStudyResponse } from '@/types/biblical-study';

export default function EstudoBiblicoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BiblicalStudyResponse | null>(null);

  const handleGenerate = async (formData: BiblicalStudyFormData) => {
    setIsLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-biblical-study', {
        body: formData,
      });

      if (error) throw error;

      if (data?.error === 'generation_limit_reached') {
        toast.warning('Você atingiu o limite do seu plano.');
        return;
      }
      if (data?.error === 'schema_validation_failed') {
        toast.error('Erro na geração. Tente novamente.');
        return;
      }
      if (!data?.success) {
        toast.error('Erro inesperado. Contate o suporte.');
        return;
      }

      setResult(data as BiblicalStudyResponse);
    } catch {
      toast.error('Erro inesperado. Contate o suporte.');
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
            <AlertTitle>Tópico Pastoral Sensível Detectado</AlertTitle>
            <AlertDescription>
              Este estudo aborda um tema delicado: '{result.sensitive_topic_detected}'.
              O conteúdo foi gerado com linguagem cuidadosa e acolhedora.
              Sempre consulte um pastor ou conselheiro cristão qualificado ao usar este material.
            </AlertDescription>
          </Alert>
        )}

        {!study ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
            <BookOpen className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-sm">Configure os parâmetros e gere seu estudo teológico</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="font-display text-lg font-semibold">Resultado do Estudo</h2>
              <StudyActions study={study} />
            </div>

            <Tabs defaultValue="resumo">
              <TabsList className="flex flex-wrap h-auto gap-1">
                <TabsTrigger value="resumo">Resumo</TabsTrigger>
                <TabsTrigger value="contexto">Contexto</TabsTrigger>
                <TabsTrigger value="exegese">Exegese</TabsTrigger>
                <TabsTrigger value="teologia">Teologia</TabsTrigger>
                <TabsTrigger value="aplicacao">Aplicação</TabsTrigger>
                <TabsTrigger value="perguntas">Perguntas</TabsTrigger>
                <TabsTrigger value="conclusao">Conclusão</TabsTrigger>
                <TabsTrigger value="avisos">Avisos</TabsTrigger>
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
