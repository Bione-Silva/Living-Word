import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileDown, FileText, ChevronDown, Wand2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { BiblicalStudyOutput } from '@/types/biblical-study';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';

interface StudyActionsProps {
  study: BiblicalStudyOutput;
}

export function StudyActions({ study }: StudyActionsProps) {
  const { user, profile } = useAuth();
  const { lang } = useLanguage();
  const [exporting, setExporting] = useState<'pdf' | 'docx' | null>(null);

  const studyTitle = study.verdade_central.frase_central || study.passagem.referencia;
  const studyPassage = study.passagem.referencia;
  const studyLanguage = study.metadata.tipo_uso || 'PT';

  const handleExportPDF = async () => {
    if (exporting) return;
    setExporting('pdf');
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const content = buildHTMLContent(study);
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
      toast.success('PDF exportado com sucesso!');
    } catch {
      toast.error('Erro ao exportar PDF.');
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
      children.push(new Paragraph({ children: [new TextRun({ text: studyPassage, bold: true, color: '6B4F3A' })] }));
      children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

      // Verdade Central
      children.push(new Paragraph({
        border: { left: { style: BorderStyle.SINGLE, size: 6, color: 'C4956A', space: 8 } },
        children: [new TextRun({ text: study.verdade_central.frase_central, italics: true, bold: true })],
      }));
      if (study.verdade_central.proposicao_expandida) {
        children.push(new Paragraph({ children: [new TextRun(study.verdade_central.proposicao_expandida)] }));
      }
      children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

      // Passagem text
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Texto Bíblico')] }));
      children.push(new Paragraph({
        border: { left: { style: BorderStyle.SINGLE, size: 4, color: 'C4956A', space: 8 } },
        children: [
          new TextRun({ text: study.passagem.referencia, bold: true }),
          new TextRun({ text: ' — ' }),
          new TextRun({ text: study.passagem.texto, italics: true }),
          new TextRun({ text: ` (${study.passagem.versao})`, color: '999999', size: 18 }),
        ],
      }));

      // Contexto
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Contexto Histórico')] }));
      children.push(new Paragraph({ children: [new TextRun(study.contexto.historico)] }));
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Contexto Literário')] }));
      children.push(new Paragraph({ children: [new TextRun(study.contexto.literario)] }));

      // Observação
      if (study.observacao.perguntas_5wh?.length) {
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Observação — Perguntas 5W+H')] }));
        study.observacao.perguntas_5wh.forEach(q => {
          children.push(new Paragraph({ children: [new TextRun({ text: q.pergunta, bold: true })] }));
          children.push(new Paragraph({ children: [new TextRun(q.resposta)] }));
          children.push(new Paragraph({ spacing: { after: 100 }, children: [] }));
        });
      }

      // Interpretação
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Interpretação')] }));
      children.push(new Paragraph({ children: [new TextRun(study.interpretacao.significado_original)] }));

      // Aplicação
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Aplicação')] }));
      children.push(new Paragraph({ children: [new TextRun({ text: 'Crer: ', bold: true }), new TextRun(study.aplicacao.crer)] }));
      children.push(new Paragraph({ children: [new TextRun({ text: 'Mudar: ', bold: true }), new TextRun(study.aplicacao.mudar)] }));
      children.push(new Paragraph({ children: [new TextRun({ text: 'Agir: ', bold: true }), new TextRun(study.aplicacao.agir)] }));

      // Perguntas
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Perguntas para Discussão')] }));
      ['observacao', 'interpretacao', 'aplicacao'].forEach(cat => {
        const label = cat === 'observacao' ? 'Observação' : cat === 'interpretacao' ? 'Interpretação' : 'Aplicação';
        const items = study.perguntas_discussao[cat as keyof typeof study.perguntas_discussao] as string[];
        if (items?.length) {
          children.push(new Paragraph({ children: [new TextRun({ text: label, bold: true })] }));
          items.forEach((q, i) => {
            children.push(new Paragraph({ children: [new TextRun(`${i + 1}. ${q}`)] }));
          });
        }
      });

      // Encerramento
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Encerramento')] }));
      children.push(new Paragraph({ children: [new TextRun({ text: 'Oração: ', bold: true }), new TextRun({ text: study.encerramento.oracao_sugerida, italics: true })] }));

      // RAG sources
      if (study.rag_sources_used?.length) {
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Fontes Históricas (RAG)')] }));
        children.push(new Paragraph({ children: [new TextRun(study.rag_sources_used.join(' • '))] }));
      }

      const doc = new Document({
        styles: { default: { document: { run: { font: 'Arial', size: 24 } } } },
        sections: [{
          properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
          children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${studyTitle}.docx`);
      toast.success(lang === 'PT' ? 'DOCX exportado com sucesso!' : lang === 'EN' ? 'DOCX exported successfully!' : '¡DOCX exportado con éxito!');
    } catch (err) {
      console.error('DOCX export error:', err);
      toast.error(lang === 'PT' ? 'Erro ao exportar DOCX.' : lang === 'EN' ? 'Error exporting DOCX.' : 'Error al exportar DOCX.');
    } finally {
      setExporting(null);
    }
  };

  const handleTransform = async (mode: 'sermon' | 'devotional' | 'lesson' | 'blog') => {
    try {
      toast.info(lang === 'PT' ? 'Transformando conteúdo...' : lang === 'EN' ? 'Transforming content...' : 'Transformando contenido...');
      if (mode === 'blog') {
        const { error } = await supabase.functions.invoke('generate-blog-article', {
          body: {
            passage: studyPassage,
            language: studyLanguage,
            title: studyTitle,
          },
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
      toast.success(lang === 'PT' ? 'Conteúdo transformado com sucesso!' : lang === 'EN' ? 'Content transformed successfully!' : '¡Contenido transformado con éxito!');
    } catch {
      toast.error(lang === 'PT' ? 'Erro ao transformar conteúdo.' : lang === 'EN' ? 'Error transforming content.' : 'Error al transformar el contenido.');
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportPDF} disabled={!!exporting}>
        {exporting === 'pdf' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
        Exportar PDF
      </Button>
      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportDOCX} disabled={!!exporting}>
        {exporting === 'docx' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
        Exportar DOCX
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Wand2 className="h-3.5 w-3.5" />
            Transformar em...
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleTransform('sermon')}>Transformar em Sermão</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleTransform('devotional')}>Transformar em Devocional</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleTransform('lesson')}>Transformar em Aula</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleTransform('blog')}>Transformar em Post</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function buildHTMLContent(study: BiblicalStudyOutput): string {
  let html = `<h1 style="font-size:24px;margin-bottom:8px;">${study.verdade_central.frase_central}</h1>`;
  html += `<p style="color:#6B4F3A;font-weight:bold;">${study.passagem.referencia}</p>`;
  html += `<blockquote style="border-left:3px solid #C4956A;padding-left:12px;font-style:italic;margin:16px 0;">${study.passagem.texto}</blockquote>`;

  html += `<h2 style="margin-top:20px;">Contexto Histórico</h2><p>${study.contexto.historico}</p>`;
  html += `<h2>Contexto Literário</h2><p>${study.contexto.literario}</p>`;

  html += `<h2>Interpretação</h2><p>${study.interpretacao.significado_original}</p>`;

  html += `<h2>Aplicação</h2>`;
  html += `<p><strong>Crer:</strong> ${study.aplicacao.crer}</p>`;
  html += `<p><strong>Mudar:</strong> ${study.aplicacao.mudar}</p>`;
  html += `<p><strong>Agir:</strong> ${study.aplicacao.agir}</p>`;

  html += `<h2>Encerramento</h2><p>${study.encerramento.oracao_sugerida}</p>`;
  return html;
}
