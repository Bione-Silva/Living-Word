import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileDown, FileText, ChevronDown, Wand2, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { BiblicalStudyOutput } from '@/types/biblical-study';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { sl } from '@/lib/study-i18n';

interface StudyActionsProps {
  study: BiblicalStudyOutput;
  materialId?: string;
  onImagesGenerated?: (images: string[]) => void;
}

export function StudyActions({ study, materialId, onImagesGenerated }: StudyActionsProps) {
  const { user, profile } = useAuth();
  const { lang } = useLanguage();
  const [exporting, setExporting] = useState<'pdf' | 'docx' | null>(null);
  const [enriching, setEnriching] = useState(false);
  const t = (k: string) => sl(k, lang);

  const studyTitle = study.verdade_central.frase_central || study.passagem.referencia;
  const studyPassage = study.passagem.referencia;
  const studyLanguage = study.metadata.tipo_uso || 'PT';

  const handleExportPDF = async () => {
    if (exporting) return;
    setExporting('pdf');
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const content = buildHTMLContent(study, lang);
      const container = document.createElement('div');
      container.innerHTML = content;
      container.style.padding = '20px';
      document.body.appendChild(container);

      await html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: `${studyTitle}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(container).save();

      document.body.removeChild(container);
      toast.success(t('pdfSuccess'));
    } catch {
      toast.error(t('pdfError'));
    } finally {
      setExporting(null);
    }
  };

  const handleExportDOCX = async () => {
    if (exporting) return;
    setExporting('docx');
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } = await import('docx');
      const { saveAs } = await import('file-saver');

      const children: any[] = [];

      // Title & passage
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: studyTitle, bold: true })] }));
      children.push(new Paragraph({ children: [new TextRun({ text: studyPassage, bold: true, color: '3D2E1F' })] }));
      children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

      // Verdade Central
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t('centralTruth'))] }));
      children.push(new Paragraph({
        border: { left: { style: BorderStyle.SINGLE, size: 6, color: 'C4956A', space: 8 } },
        children: [new TextRun({ text: study.verdade_central.frase_central, italics: true, bold: true })],
      }));
      if (study.verdade_central.proposicao_expandida) {
        children.push(new Paragraph({ children: [new TextRun(study.verdade_central.proposicao_expandida)] }));
      }
      children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

      // Passagem text
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t('bibleText'))] }));
      children.push(new Paragraph({
        border: { left: { style: BorderStyle.SINGLE, size: 4, color: 'C4956A', space: 8 } },
        children: [
          new TextRun({ text: study.passagem.referencia, bold: true }),
          new TextRun({ text: ' — ' }),
          new TextRun({ text: study.passagem.texto, italics: true }),
          new TextRun({ text: ` (${study.passagem.versao})`, color: '555555', size: 18 }),
        ],
      }));

      // Contexto
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t('historicalContext'))] }));
      children.push(new Paragraph({ children: [new TextRun(study.contexto.historico)] }));
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t('literaryContext'))] }));
      children.push(new Paragraph({ children: [new TextRun(study.contexto.literario)] }));

      // Observação
      if (study.observacao.perguntas_5wh?.length) {
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t('observation5wh'))] }));
        study.observacao.perguntas_5wh.forEach(q => {
          children.push(new Paragraph({ children: [new TextRun({ text: q.pergunta, bold: true })] }));
          children.push(new Paragraph({ children: [new TextRun(q.resposta)] }));
          children.push(new Paragraph({ spacing: { after: 100 }, children: [] }));
        });
      }

      // Interpretação
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t('interpretation'))] }));
      children.push(new Paragraph({ children: [new TextRun(study.interpretacao.significado_original)] }));

      // Aplicação
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t('application'))] }));
      children.push(new Paragraph({ children: [new TextRun({ text: `${t('believe')}: `, bold: true }), new TextRun(study.aplicacao.crer)] }));
      children.push(new Paragraph({ children: [new TextRun({ text: `${t('change')}: `, bold: true }), new TextRun(study.aplicacao.mudar)] }));
      children.push(new Paragraph({ children: [new TextRun({ text: `${t('act')}: `, bold: true }), new TextRun(study.aplicacao.agir)] }));

      // Perguntas
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t('discussionQuestionsExport'))] }));
      const qCategories = [
        { label: t('observation'), items: study.perguntas_discussao.observacao },
        { label: t('interpretation'), items: study.perguntas_discussao.interpretacao },
        { label: t('application'), items: study.perguntas_discussao.aplicacao },
      ];
      qCategories.forEach(cat => {
        if (cat.items?.length) {
          children.push(new Paragraph({ children: [new TextRun({ text: cat.label, bold: true })] }));
          cat.items.forEach((q, i) => {
            children.push(new Paragraph({ children: [new TextRun(`${i + 1}. ${q}`)] }));
          });
        }
      });

      // Encerramento
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t('closing'))] }));
      children.push(new Paragraph({ children: [new TextRun({ text: `${t('prayer')}: `, bold: true }), new TextRun({ text: study.encerramento.oracao_sugerida, italics: true })] }));

      // RAG sources
      if (study.rag_sources_used?.length) {
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t('ragSources'))] }));
        children.push(new Paragraph({ children: [new TextRun(study.rag_sources_used.join(' • '))] }));
      }

      const doc = new Document({
        styles: { default: { document: { run: { font: 'Arial', size: 24, color: '1A1A1A' } } } },
        sections: [{
          properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
          children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${studyTitle}.docx`);
      toast.success(t('docxSuccess'));
    } catch (err) {
      console.error('DOCX export error:', err);
      toast.error(t('docxError'));
    } finally {
      setExporting(null);
    }
  };

  const handleTransform = async (mode: 'sermon' | 'devotional' | 'lesson' | 'blog') => {
    // ... keep existing code
    try {
      toast.info(t('transforming'));
      if (mode === 'blog') {
        const { error } = await supabase.functions.invoke('generate-blog-article', {
          body: { passage: studyPassage, language: studyLanguage, title: studyTitle },
        });
        if (error) throw error;
      } else {
        const outputMode = mode === 'lesson' ? 'outline' : mode;
        const { data, error } = await supabase.functions.invoke('generate-pastoral-material', {
          body: {
            bible_passage: studyPassage,
            pain_point: study.verdade_central.frase_central,
            language: studyLanguage,
            bible_version: study.passagem.versao || 'ARA',
            output_modes: [outputMode],
            pastoral_voice: profile?.pastoral_voice || '',
          },
        });

        if (error) throw error;

        const content = data?.outputs?.[outputMode];
        if (!content || !user) throw new Error('missing_generated_content');

        const materialType = mode === 'lesson' ? 'outline' : outputMode;
        const label = mode === 'sermon' ? 'Sermão' : mode === 'devotional' ? 'Devocional' : 'Aula';

        const { error: saveError } = await supabase.from('materials').insert({
          user_id: user.id,
          title: `${label} — ${studyTitle}`,
          type: materialType,
          content,
          language: studyLanguage,
          passage: studyPassage,
          bible_version: study.passagem.versao || 'ARA',
        });

        if (saveError) throw saveError;
      }
      toast.success(t('transformSuccess'));
    } catch {
      toast.error(t('transformError'));
    }
  };

  const handleEnrichIllustrations = async () => {
    if (!materialId || enriching) return;
    setEnriching(true);
    try {
      toast.info(lang === 'PT' ? 'Gerando ilustrações em aquarela...' : lang === 'EN' ? 'Generating watercolor illustrations...' : 'Generando ilustraciones en acuarela...');
      const { data, error } = await supabase.functions.invoke('enrich-illustrations', {
        body: { material_id: materialId },
      });
      if (error) throw error;
      if (data?.images?.length) {
        onImagesGenerated?.(data.images);
        toast.success(lang === 'PT' ? `${data.images.length} ilustrações geradas!` : lang === 'EN' ? `${data.images.length} illustrations generated!` : `¡${data.images.length} ilustraciones generadas!`);
      } else {
        toast.error(lang === 'PT' ? 'Nenhuma imagem gerada' : 'No images generated');
      }
    } catch {
      toast.error(lang === 'PT' ? 'Erro ao gerar ilustrações' : 'Error generating illustrations');
    } finally {
      setEnriching(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {materialId && (
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleEnrichIllustrations} disabled={enriching}>
          {enriching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
          {lang === 'PT' ? 'Ilustrações' : lang === 'EN' ? 'Illustrations' : 'Ilustraciones'}
        </Button>
      )}
      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportPDF} disabled={!!exporting}>
        {exporting === 'pdf' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
        {lang === 'EN' ? 'Export PDF' : 'Exportar PDF'}
      </Button>
      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportDOCX} disabled={!!exporting}>
        {exporting === 'docx' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
        {lang === 'EN' ? 'Export DOCX' : 'Exportar DOCX'}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Wand2 className="h-3.5 w-3.5" />
            {lang === 'PT' ? 'Transformar em...' : lang === 'EN' ? 'Transform into...' : 'Transformar en...'}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleTransform('sermon')}>
            {lang === 'PT' ? 'Transformar em Sermão' : lang === 'EN' ? 'Transform into Sermon' : 'Transformar en Sermón'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleTransform('devotional')}>
            {lang === 'PT' ? 'Transformar em Devocional' : lang === 'EN' ? 'Transform into Devotional' : 'Transformar en Devocional'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleTransform('lesson')}>
            {lang === 'PT' ? 'Transformar em Aula' : lang === 'EN' ? 'Transform into Lesson' : 'Transformar en Lección'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleTransform('blog')}>
            {lang === 'PT' ? 'Transformar em Post' : lang === 'EN' ? 'Transform into Post' : 'Transformar en Post'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function buildHTMLContent(study: BiblicalStudyOutput, lang: 'PT' | 'EN' | 'ES'): string {
  const t = (k: string) => sl(k, lang);
  const baseStyle = 'color:#1a1a1a;';
  let html = `<div style="${baseStyle}font-family:Arial,sans-serif;">`;
  html += `<h1 style="font-size:24px;margin-bottom:8px;color:#000;">${study.verdade_central.frase_central}</h1>`;
  html += `<p style="color:#3D2E1F;font-weight:bold;">${study.passagem.referencia}</p>`;
  html += `<blockquote style="border-left:3px solid #8B7355;padding-left:12px;font-style:italic;margin:16px 0;color:#1a1a1a;">${study.passagem.texto}</blockquote>`;

  html += `<h2 style="margin-top:20px;color:#000;">${t('historicalContext')}</h2><p style="${baseStyle}">${study.contexto.historico}</p>`;
  html += `<h2 style="color:#000;">${t('literaryContext')}</h2><p style="${baseStyle}">${study.contexto.literario}</p>`;

  html += `<h2 style="color:#000;">${t('interpretation')}</h2><p style="${baseStyle}">${study.interpretacao.significado_original}</p>`;

  html += `<h2 style="color:#000;">${t('application')}</h2>`;
  html += `<p style="${baseStyle}"><strong>${t('believe')}:</strong> ${study.aplicacao.crer}</p>`;
  html += `<p style="${baseStyle}"><strong>${t('change')}:</strong> ${study.aplicacao.mudar}</p>`;
  html += `<p style="${baseStyle}"><strong>${t('act')}:</strong> ${study.aplicacao.agir}</p>`;

  html += `<h2 style="color:#000;">${t('closing')}</h2><p style="${baseStyle}">${study.encerramento.oracao_sugerida}</p>`;
  html += `</div>`;
  return html;
}
