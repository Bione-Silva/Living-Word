import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Eye, Lightbulb, Heart, Cross, MessageCircleQuestion, NotebookPen, Sparkles, Scroll, HelpCircle } from 'lucide-react';
import type { BiblicalStudyOutput } from '@/types/biblical-study';
import { useLanguage } from '@/contexts/LanguageContext';
import { sl } from '@/lib/study-i18n';

interface StudyViewerProps {
  study: BiblicalStudyOutput;
}

export function StudyViewer({ study }: StudyViewerProps) {
  const { lang } = useLanguage();
  const t = (k: string) => sl(k, lang);

  return (
    <div className="space-y-6">
      {/* ── Passagem Hero ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-primary/10 text-primary border-primary/20">{study.passagem.referencia}</Badge>
          <Badge variant="secondary">{study.passagem.versao}</Badge>
          <Badge variant="secondary">{study.passagem.genero}</Badge>
          {study.metadata.duracao_estimada_min && (
            <Badge variant="outline" className="text-xs">~{study.metadata.duracao_estimada_min} min</Badge>
          )}
        </div>
        <blockquote className="border-l-4 border-primary/40 pl-4 italic text-stone-700 text-base leading-relaxed">
          {study.passagem.texto}
        </blockquote>
      </div>

      {/* ── VERDADE CENTRAL — Destaque Premium ── */}
      <Card className="border-2 border-primary/30 bg-primary/5 shadow-md">
        <CardContent className="pt-5 pb-5 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">{t('centralTruth')}</span>
          </div>
          <p className="font-display text-xl md:text-2xl font-bold leading-snug text-foreground">
            {study.verdade_central.frase_central}
          </p>
          {study.verdade_central.proposicao_expandida && (
            <p className="text-sm text-stone-700 leading-relaxed">{study.verdade_central.proposicao_expandida}</p>
          )}
        </CardContent>
      </Card>

      {/* ── Âncora Espiritual ── */}
      {study.ancora_espiritual?.oracao_abertura && (
        <Card className="border-border/50 bg-muted/30">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('openingPrayer')}</p>
            <p className="text-sm italic leading-relaxed text-stone-800">{study.ancora_espiritual.oracao_abertura}</p>
          </CardContent>
        </Card>
      )}

      {/* ── Accordion Sections ── */}
      <Accordion type="multiple" defaultValue={['contexto', 'observacao']} className="space-y-2">

        {/* Contexto */}
        <AccordionItem value="contexto" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline gap-2">
            <span className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> {t('context')}</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('historical')}</h4>
              <p className="text-sm leading-relaxed text-stone-800">{study.contexto.historico}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('literary')}</h4>
              <p className="text-sm leading-relaxed text-stone-800">{study.contexto.literario}</p>
            </div>
            {study.contexto.canonico && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('canonical')}</h4>
                <p className="text-sm leading-relaxed text-stone-800">{study.contexto.canonico}</p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Observação */}
        <AccordionItem value="observacao" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline gap-2">
            <span className="flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> {t('observation')}</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            {study.observacao.perguntas_5wh?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{t('questions5wh')}</h4>
                <div className="space-y-2">
                  {study.observacao.perguntas_5wh.map((q, i) => (
                    <div key={i} className="rounded-lg border border-border bg-background p-3">
                      <p className="text-sm font-semibold text-stone-900">{q.pergunta}</p>
                      <p className="text-sm text-stone-700 mt-1">{q.resposta}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {study.observacao.palavras_chave?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{t('keywords')}</h4>
                <div className="flex flex-wrap gap-2">
                  {study.observacao.palavras_chave.map((kw, i) => (
                    <div key={i} className="rounded-lg border border-border bg-background px-3 py-2">
                      <span className="text-sm font-semibold text-stone-900">{kw.palavra}</span>
                      <span className="text-xs text-stone-700 ml-1.5">— {kw.explicacao}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {study.observacao.elementos_notaveis && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('notableElements')}</h4>
                <p className="text-sm leading-relaxed text-stone-800">{study.observacao.elementos_notaveis}</p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Interpretação */}
        <AccordionItem value="interpretacao" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline gap-2">
            <span className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" /> {t('interpretation')}</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('originalMeaning')}</h4>
              <p className="text-sm leading-relaxed text-stone-800">{study.interpretacao.significado_original}</p>
            </div>
            {study.interpretacao.estudo_palavras && study.interpretacao.estudo_palavras.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{t('wordStudy')}</h4>
                <div className="space-y-2">
                  {study.interpretacao.estudo_palavras.map((w, i) => (
                    <div key={i} className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-stone-900">{w.palavra}</span>
                        {w.original && <Badge variant="outline" className="text-[10px]">{w.original}</Badge>}
                      </div>
                      <p className="text-sm text-stone-700 mt-1">{w.significado}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {study.interpretacao.cruzamento_escrituras && study.interpretacao.cruzamento_escrituras.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('crossReferences')}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {study.interpretacao.cruzamento_escrituras.map((ref, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{ref}</Badge>
                  ))}
                </div>
              </div>
            )}
            {study.interpretacao.logica_interna && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('internalLogic')}</h4>
                <p className="text-sm leading-relaxed text-stone-800">{study.interpretacao.logica_interna}</p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Conexão Cristológica */}
        {study.conexao_cristologica && (
          <AccordionItem value="cristologica" className="border rounded-lg px-4">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline gap-2">
              <span className="flex items-center gap-2"><Cross className="h-4 w-4 text-primary" /> {t('christologicalConnection')}</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              <div>
                <Badge variant="outline" className="mb-2">{study.conexao_cristologica.tipo_conexao}</Badge>
                <p className="text-sm leading-relaxed text-stone-800">{study.conexao_cristologica.como_aponta_para_cristo}</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Aplicação */}
        <AccordionItem value="aplicacao" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline gap-2">
            <span className="flex items-center gap-2"><Heart className="h-4 w-4 text-primary" /> {t('application')}</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            {[
              { label: t('believe'), value: study.aplicacao.crer, color: 'bg-blue-500' },
              { label: t('change'), value: study.aplicacao.mudar, color: 'bg-amber-500' },
              { label: t('act'), value: study.aplicacao.agir, color: 'bg-green-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <Badge className={`${item.color} text-white shrink-0 mt-0.5`}>{item.label}</Badge>
                <p className="text-sm leading-relaxed text-stone-800">{item.value}</p>
              </div>
            ))}
            {study.aplicacao.reflexao_pessoal && (
              <div className="rounded-lg bg-muted/50 p-3 mt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('personalReflection')}</p>
                <p className="text-sm italic leading-relaxed text-stone-800">{study.aplicacao.reflexao_pessoal}</p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Perguntas para Discussão */}
        <AccordionItem value="perguntas" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline gap-2">
            <span className="flex items-center gap-2"><MessageCircleQuestion className="h-4 w-4 text-primary" /> {t('discussionQuestions')}</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            {[
              { label: t('observation'), items: study.perguntas_discussao.observacao, color: 'bg-sky-100 text-sky-800 border-sky-200' },
              { label: t('interpretation'), items: study.perguntas_discussao.interpretacao, color: 'bg-violet-100 text-violet-800 border-violet-200' },
              { label: t('application'), items: study.perguntas_discussao.aplicacao, color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
            ].map((group) => (
              <div key={group.label}>
                <Badge variant="outline" className={`${group.color} mb-2`}>{group.label}</Badge>
                <ul className="space-y-1.5 ml-1">
                  {group.items.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                      <span className="leading-relaxed text-stone-800">{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {study.perguntas_discussao.bonus && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('bonus')}</p>
                <p className="text-sm leading-relaxed text-stone-800">{study.perguntas_discussao.bonus}</p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Encerramento */}
        <AccordionItem value="encerramento" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline gap-2">
            <span className="flex items-center gap-2"><Scroll className="h-4 w-4 text-primary" /> {t('closing')}</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('suggestedPrayer')}</h4>
              <p className="text-sm italic leading-relaxed text-stone-800">{study.encerramento.oracao_sugerida}</p>
            </div>
            {study.encerramento.instrucao_lider && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('leaderInstruction')}</h4>
                <p className="text-sm leading-relaxed text-stone-800">{study.encerramento.instrucao_lider}</p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Notas do Líder */}
        {study.notas_lider && (
          <AccordionItem value="notas_lider" className="border border-dashed border-muted-foreground/30 rounded-lg px-4 bg-muted/20">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline gap-2">
              <span className="flex items-center gap-2"><NotebookPen className="h-4 w-4 text-muted-foreground" /> {t('leaderTips')}</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              {study.notas_lider.como_introduzir && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('howToIntroduce')}</h4>
                  <p className="text-sm leading-relaxed">{study.notas_lider.como_introduzir}</p>
                </div>
              )}
              {study.notas_lider.pontos_atencao && study.notas_lider.pontos_atencao.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('pointsOfAttention')}</h4>
                  <ul className="space-y-1 ml-1">
                    {study.notas_lider.pontos_atencao.map((p, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {study.notas_lider.erros_comuns && study.notas_lider.erros_comuns.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('commonMistakes')}</h4>
                  <ul className="space-y-1 ml-1">
                    {study.notas_lider.erros_comuns.map((e, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>{e}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {study.notas_lider.recursos_adicionais && study.notas_lider.recursos_adicionais.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('additionalResources')}</h4>
                  <ul className="space-y-1 ml-1">
                    {study.notas_lider.recursos_adicionais.map((r, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {/* ── RAG Sources ── */}
      {study.rag_sources_used && study.rag_sources_used.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
          <HelpCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{t('historicalSources')}: {study.rag_sources_used.join(' • ')}</span>
        </div>
      )}
    </div>
  );
}
