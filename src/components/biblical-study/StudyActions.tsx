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
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [exporting, setExporting] = useState<'pdf' | 'docx' | null>(null);

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
        filename: `${study.title}.pdf`,
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
      const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType } = await import('docx');
      const { saveAs } = await import('file-saver');

      const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
      const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

      const children: any[] = [];

      // Title
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: study.title, bold: true })] }));
      children.push(new Paragraph({ children: [new TextRun({ text: study.bible_passage, bold: true, color: '6B4F3A' })] }));
      children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

      // Central idea
      children.push(new Paragraph({
        border: { left: { style: BorderStyle.SINGLE, size: 6, color: 'C4956A', space: 8 } },
        children: [new TextRun({ text: study.central_idea, italics: true })],
      }));
      children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

      // Summary
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Resumo')] }));
      children.push(new Paragraph({ children: [new TextRun(study.summary)] }));

      // Historical context
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Contexto Histórico')] }));
      children.push(new Paragraph({ children: [new TextRun(study.historical_context.text)] }));

      // Literary context
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Contexto Literário')] }));
      children.push(new Paragraph({ children: [new TextRun({ text: 'Gênero: ', bold: true }), new TextRun(study.literary_context.genre)] }));
      children.push(new Paragraph({ children: [new TextRun(study.literary_context.position_in_book)] }));

      // Text structure table
      if (study.text_structure?.length) {
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Estrutura do Texto')] }));
        children.push(new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2500, 2000, 4860],
          rows: [
            new TableRow({
              children: ['Seção', 'Versículos', 'Descrição'].map(h =>
                new TableCell({
                  borders: cellBorders,
                  width: { size: h === 'Descrição' ? 4860 : h === 'Seção' ? 2500 : 2000, type: WidthType.DXA },
                  shading: { fill: 'F5F0E8', type: ShadingType.CLEAR },
                  children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
                })
              ),
            }),
            ...study.text_structure.map(s =>
              new TableRow({
                children: [
                  new TableCell({ borders: cellBorders, width: { size: 2500, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: s.section, bold: true })] })] }),
                  new TableCell({ borders: cellBorders, width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun(s.verses)] })] }),
                  new TableCell({ borders: cellBorders, width: { size: 4860, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun(s.description)] })] }),
                ],
              })
            ),
          ],
        }));
      }

      // Bible text
      if (study.bible_text?.length) {
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Texto Bíblico Base')] }));
        study.bible_text.forEach(bt => {
          children.push(new Paragraph({
            border: { left: { style: BorderStyle.SINGLE, size: 4, color: 'C4956A', space: 8 } },
            children: [
              new TextRun({ text: bt.reference, bold: true }),
              new TextRun({ text: ' ' }),
              new TextRun({ text: bt.text, italics: true }),
              new TextRun({ text: ` (${bt.version})`, color: '999999', size: 18 }),
            ],
          }));
        });
      }

      // Exegesis
      if (study.exegesis?.length) {
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Exegese')] }));
        study.exegesis.forEach(e => {
          children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(e.focus)] }));
          if (e.linguistic_note) {
            children.push(new Paragraph({ children: [new TextRun({ text: 'Nota Linguística: ', bold: true }), new TextRun(e.linguistic_note)] }));
          }
          children.push(new Paragraph({ children: [new TextRun({ text: 'Contribuição Teológica: ', bold: true }), new TextRun(e.theological_insight)] }));
        });
      }

      // Theological interpretation
      if (study.theological_interpretation?.length) {
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Interpretações Teológicas')] }));
        study.theological_interpretation.forEach(t => {
          const runs: any[] = [new TextRun({ text: t.perspective, bold: true })];
          if (t.is_debated) runs.push(new TextRun({ text: ' [Interpretação Debatida]', color: 'B45309', italics: true }));
          children.push(new Paragraph({ children: runs }));
          children.push(new Paragraph({ children: [new TextRun(t.interpretation)] }));
          if (t.sources?.length) {
            children.push(new Paragraph({ children: [new TextRun({ text: 'Fontes: ', bold: true }), new TextRun(t.sources.join(', '))] }));
          }
        });
      }

      // Biblical connections table
      if (study.biblical_connections?.length) {
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Conexões Bíblicas')] }));
        const relLabels: Record<string, string> = { typology: 'Tipologia', fulfillment: 'Cumprimento', parallel: 'Paralelo', contrast: 'Contraste', echo: 'Eco' };
        children.push(new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2500, 2500, 4360],
          rows: [
            new TableRow({
              children: ['Passagem', 'Relação', 'Nota'].map((h, idx) =>
                new TableCell({
                  borders: cellBorders,
                  width: { size: [2500, 2500, 4360][idx], type: WidthType.DXA },
                  shading: { fill: 'F5F0E8', type: ShadingType.CLEAR },
                  children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
                })
              ),
            }),
            ...study.biblical_connections.map(c =>
              new TableRow({
                children: [
                  new TableCell({ borders: cellBorders, width: { size: 2500, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: c.passage, bold: true })] })] }),
                  new TableCell({ borders: cellBorders, width: { size: 2500, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun(relLabels[c.relationship] || c.relationship)] })] }),
                  new TableCell({ borders: cellBorders, width: { size: 4360, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun(c.note)] })] }),
                ],
              })
            ),
          ],
        }));
      }

      // Application
      if (study.application?.length) {
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Aplicação')] }));
        study.application.forEach(a => {
          children.push(new Paragraph({ children: [new TextRun({ text: `${a.context}: `, bold: true }), new TextRun(a.application)] }));
          children.push(new Paragraph({ children: [new TextRun({ text: '✅ Ação Prática: ', bold: true }), new TextRun(a.practical_action)] }));
          children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
        });
      }

      // Reflection questions
      if (study.reflection_questions?.length) {
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Perguntas para Reflexão')] }));
        study.reflection_questions.forEach((q, i) => {
          const runs: any[] = [new TextRun({ text: `${i + 1}. `, bold: true }), new TextRun({ text: q.question, bold: true })];
          if (q.target_audience) runs.push(new TextRun({ text: ` (${q.target_audience})`, color: '999999', size: 18 }));
          children.push(new Paragraph({ children: runs }));
        });
      }

      // Conclusion
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Conclusão')] }));
      children.push(new Paragraph({ children: [new TextRun(study.conclusion)] }));

      // Pastoral warning
      if (study.pastoral_warning) {
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Aviso Pastoral')] }));
        children.push(new Paragraph({ children: [new TextRun(study.pastoral_warning)] }));
      }

      // RAG sources
      if (study.rag_sources_used?.length) {
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Fontes Históricas (RAG)')] }));
        children.push(new Paragraph({ children: [new TextRun(study.rag_sources_used.join(' • '))] }));
      }

      const doc = new Document({
        styles: {
          default: { document: { run: { font: 'Arial', size: 24 } } },
        },
        sections: [{
          properties: {
            page: {
              size: { width: 12240, height: 15840 },
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
          },
          children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${study.title}.docx`);
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
            passage: study.bible_passage,
            language: study.language,
            title: study.title,
          },
        });
        if (error) throw error;
      } else {
        const outputMode = mode === 'lesson' ? 'outline' : mode;
        const { data, error } = await supabase.functions.invoke('generate-pastoral-material', {
          body: {
            bible_passage: study.bible_passage,
            pain_point: study.central_idea,
            language: study.language,
            bible_version: study.bible_text?.[0]?.version || 'ARA',
            output_modes: [outputMode],
          },
        });

        if (error) throw error;

        const content = data?.outputs?.[outputMode];
        if (!content || !user) {
          throw new Error('missing_generated_content');
        }

        const materialType = mode === 'lesson' ? 'outline' : outputMode;
        const label = mode === 'sermon' ? 'Sermão' : mode === 'devotional' ? 'Devocional' : 'Aula';

        const { error: saveError } = await supabase.from('materials').insert({
          user_id: user.id,
          title: `${label} — ${study.title}`,
          type: materialType,
          content,
          language: study.language,
          passage: study.bible_passage,
          bible_version: study.bible_text?.[0]?.version || 'ARA',
        });

        if (saveError) throw saveError;
      }
      toast.success(
        lang === 'PT'
          ? 'Conteúdo transformado com sucesso!'
          : lang === 'EN'
            ? 'Content transformed successfully!'
            : '¡Contenido transformado con éxito!'
      );
    } catch {
      toast.error(
        lang === 'PT'
          ? 'Erro ao transformar conteúdo.'
          : lang === 'EN'
            ? 'Error transforming content.'
            : 'Error al transformar el contenido.'
      );
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
          <DropdownMenuItem onClick={() => handleTransform('sermon')}>
            Transformar em Sermão
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleTransform('devotional')}>
            Transformar em Devocional
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleTransform('lesson')}>
            Transformar em Aula
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleTransform('blog')}>
            Transformar em Post
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function buildHTMLContent(study: BiblicalStudyOutput): string {
  let html = `<h1 style="font-size:24px;margin-bottom:8px;">${study.title}</h1>`;
  html += `<p style="color:#6B4F3A;font-weight:bold;">${study.bible_passage}</p>`;
  html += `<blockquote style="border-left:3px solid #C4956A;padding-left:12px;font-style:italic;margin:16px 0;">${study.central_idea}</blockquote>`;
  html += `<p>${study.summary}</p>`;
  html += `<h2 style="margin-top:20px;">Contexto Histórico</h2><p>${study.historical_context.text}</p>`;
  html += `<h2>Contexto Literário</h2><p>Gênero: ${study.literary_context.genre}</p><p>${study.literary_context.position_in_book}</p>`;

  if (study.exegesis?.length) {
    html += `<h2>Exegese</h2>`;
    study.exegesis.forEach(e => {
      html += `<h3>${e.focus}</h3>`;
      if (e.linguistic_note) html += `<p><strong>Nota Linguística:</strong> ${e.linguistic_note}</p>`;
      html += `<p><strong>Contribuição Teológica:</strong> ${e.theological_insight}</p>`;
    });
  }

  if (study.application?.length) {
    html += `<h2>Aplicação</h2>`;
    study.application.forEach(a => {
      html += `<p><strong>${a.context}:</strong> ${a.application}</p>`;
      html += `<p>✅ ${a.practical_action}</p>`;
    });
  }

  html += `<h2>Conclusão</h2><p>${study.conclusion}</p>`;
  return html;
}
