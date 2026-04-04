import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileDown, FileText, ChevronDown, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import type { BiblicalStudyOutput } from '@/types/biblical-study';
import { supabase } from '@/integrations/supabase/client';

interface StudyActionsProps {
  study: BiblicalStudyOutput;
}

export function StudyActions({ study }: StudyActionsProps) {
  const handleExportPDF = async () => {
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
    }
  };

  const handleExportDOCX = () => {
    toast.info('Exportação DOCX em breve!');
  };

  const handleTransform = async (mode: string, voice?: string) => {
    try {
      toast.info('Transformando conteúdo...');
      if (mode === 'blog') {
        await supabase.functions.invoke('generate-blog-article', {
          body: { title: study.title, content: study.summary },
        });
      } else {
        await supabase.functions.invoke('generate-pastoral-material', {
          body: {
            mode,
            passage: study.bible_passage,
            pastoral_voice: voice || 'welcoming',
          },
        });
      }
      toast.success('Conteúdo transformado! Verifique sua Biblioteca.');
    } catch {
      toast.error('Erro ao transformar conteúdo.');
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportPDF}>
        <FileDown className="h-3.5 w-3.5" />
        Exportar PDF
      </Button>
      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportDOCX}>
        <FileText className="h-3.5 w-3.5" />
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
          <DropdownMenuItem onClick={() => handleTransform('pastoral')}>
            Transformar em Sermão
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleTransform('devotional')}>
            Transformar em Devocional
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleTransform('pastoral', 'didactic')}>
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
