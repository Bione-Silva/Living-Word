// @ts-nocheck
import { useState } from 'react';
import { FileText, FileDown, PenLine, Link2, Loader2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type L = 'PT' | 'EN' | 'ES';

interface ArtifactActionsProps {
  content: string;
  lang: L;
  userId: string;
  modalidade: string;
  mindName: string;
  blogHandle?: string | null;
}

const labels = {
  pdf: { PT: 'Salvar em PDF', EN: 'Save as PDF', ES: 'Guardar en PDF' },
  docx: { PT: 'Baixar Documento', EN: 'Download Document', ES: 'Descargar Documento' },
  outline: { PT: 'Esboço para Pregação', EN: 'Preaching Outline', ES: 'Esquema para Predicación' },
  link: { PT: 'Gerar Link Público', EN: 'Generate Public Link', ES: 'Generar Enlace Público' },
  linkCopied: { PT: 'Link copiado!', EN: 'Link copied!', ES: '¡Enlace copiado!' },
  saved: { PT: 'Esboço salvo na Biblioteca!', EN: 'Outline saved to Library!', ES: '¡Esquema guardado en Biblioteca!' },
  error: { PT: 'Erro ao processar', EN: 'Processing error', ES: 'Error al procesar' },
};

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)/m) || content.match(/^##\s+(.+)/m);
  return match?.[1]?.replace(/[*_#]/g, '').trim() || 'Material';
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^(.+)$/gm, (line) => {
      if (line.startsWith('<h') || line.startsWith('<ul') || line.startsWith('<li') || line.startsWith('<p') || line.startsWith('</')) return line;
      return line;
    });
}

export function ArtifactActions({ content, lang, userId, modalidade, mindName, blogHandle }: ArtifactActionsProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [outlineSaved, setOutlineSaved] = useState(false);
  const [publicLink, setPublicLink] = useState<string | null>(null);

  const title = extractTitle(content);

  const handlePdf = async () => {
    setLoadingAction('pdf');
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const { wrapWithBrand } = await import('@/lib/export-branding');
      const container = document.createElement('div');
      container.innerHTML = wrapWithBrand(`
          <h1 style="font-size: 22px; color: #4a3728; padding-bottom: 8px; margin-bottom: 16px;">${title}</h1>
          <div style="font-size: 13px; line-height: 1.8; color: #444;">
            ${markdownToHtml(content)}
          </div>
          <div style="margin-top: 16px; font-size: 10px; color: #999; text-align: center;">
            ${mindName}
          </div>`);
      
      await html2pdf().set({
        margin: [15, 15, 15, 15],
        filename: `${title.slice(0, 50).replace(/[^a-zA-Z0-9À-ú ]/g, '')}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(container).save();
      
      toast.success(lang === 'PT' ? 'PDF gerado!' : lang === 'EN' ? 'PDF generated!' : '¡PDF generado!');
    } catch {
      toast.error(labels.error[lang]);
    }
    setLoadingAction(null);
  };

  const handleDocx = async () => {
    setLoadingAction('docx');
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');
      const { saveAs } = await import('file-saver');

      const children: any[] = [];
      const lines = content.split('\n');

      for (const line of lines) {
        const h1 = line.match(/^# (.+)/);
        const h2 = line.match(/^## (.+)/);
        const h3 = line.match(/^### (.+)/);
        const bullet = line.match(/^[-*] (.+)/);
        const bold = line.replace(/\*\*(.+?)\*\*/g, '$1');

        if (h1) {
          children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: h1[1].replace(/[*_]/g, ''), bold: true, font: 'Georgia', size: 32 })] }));
        } else if (h2) {
          children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: h2[1].replace(/[*_]/g, ''), bold: true, font: 'Georgia', size: 28 })] }));
        } else if (h3) {
          children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: h3[1].replace(/[*_]/g, ''), bold: true, font: 'Georgia', size: 24 })] }));
        } else if (bullet) {
          children.push(new Paragraph({ children: [new TextRun({ text: `• ${bullet[1].replace(/[*_]/g, '')}`, font: 'Georgia', size: 22 })] }));
        } else if (line.trim()) {
          // Parse bold segments
          const segments: any[] = [];
          const parts = line.split(/(\*\*.+?\*\*)/g);
          for (const part of parts) {
            const bMatch = part.match(/^\*\*(.+)\*\*$/);
            if (bMatch) {
              segments.push(new TextRun({ text: bMatch[1], bold: true, font: 'Georgia', size: 22 }));
            } else if (part) {
              segments.push(new TextRun({ text: part.replace(/\*(.+?)\*/g, '$1'), font: 'Georgia', size: 22 }));
            }
          }
          children.push(new Paragraph({ children: segments, spacing: { after: 120 } }));
        } else {
          children.push(new Paragraph({ children: [] }));
        }
      }

      // Branded header/footer
      const { docxBrandElements, fetchLogoBuffer } = await import('@/lib/export-branding');
      const logoBuffer = await fetchLogoBuffer();
      const brand = docxBrandElements({ Paragraph, TextRun, AlignmentType, Header: (await import('docx')).Header, Footer: (await import('docx')).Footer, ImageRun: (await import('docx')).ImageRun, BorderStyle: (await import('docx')).BorderStyle }, logoBuffer);

      const doc = new Document({
        sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }, ...brand }, children }],
      });

      const buffer = await Packer.toBlob(doc);
      saveAs(buffer, `${title.slice(0, 50).replace(/[^a-zA-Z0-9À-ú ]/g, '')}.docx`);
      toast.success(lang === 'PT' ? 'Documento gerado!' : lang === 'EN' ? 'Document generated!' : '¡Documento generado!');
    } catch {
      toast.error(labels.error[lang]);
    }
    setLoadingAction(null);
  };

  const handleOutline = async () => {
    setLoadingAction('outline');
    try {
      const typeMap: Record<string, string> = { sermao: 'outline', estudo: 'outline', devocional: 'outline', aconselhamento: 'outline' };
      const { error } = await (supabase as any).from('materials').insert({
        user_id: userId,
        type: typeMap[modalidade] || 'outline',
        title: `📝 ${title}`,
        content,
        language: lang,
      });
      if (error) throw error;
      setOutlineSaved(true);
      toast.success(labels.saved[lang]);
    } catch {
      toast.error(labels.error[lang]);
    }
    setLoadingAction(null);
  };

  const handlePublicLink = async () => {
    setLoadingAction('link');
    try {
      // Save as published material
      const { data: material, error: matErr } = await (supabase as any).from('materials').insert({
        user_id: userId,
        type: 'blog_article',
        title,
        content,
        language: lang,
      }).select('id').single();
      if (matErr || !material) throw matErr;

      // Add to editorial queue as published
      const { error: qErr } = await (supabase as any).from('editorial_queue').insert({
        user_id: userId,
        material_id: material.id,
        status: 'published',
        published_at: new Date().toISOString(),
      });
      if (qErr) throw qErr;

      const handle = blogHandle || userId.slice(0, 8);
      const link = `${window.location.origin}/blog/${handle}/${material.id}`;
      setPublicLink(link);

      await navigator.clipboard.writeText(link);
      toast.success(labels.linkCopied[lang]);
    } catch {
      toast.error(labels.error[lang]);
    }
    setLoadingAction(null);
  };

  const actionBtnClass = "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border/40";

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2 ml-1">
      <button onClick={handlePdf} disabled={!!loadingAction} className={actionBtnClass}>
        {loadingAction === 'pdf' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
        {labels.pdf[lang]}
      </button>

      <button onClick={handleDocx} disabled={!!loadingAction} className={actionBtnClass}>
        {loadingAction === 'docx' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
        {labels.docx[lang]}
      </button>

      <button onClick={handleOutline} disabled={!!loadingAction || outlineSaved} className={`${actionBtnClass} ${outlineSaved ? 'text-emerald-500 border-emerald-500/30' : ''}`}>
        {loadingAction === 'outline' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : outlineSaved ? <Check className="h-3.5 w-3.5" /> : <PenLine className="h-3.5 w-3.5" />}
        {outlineSaved ? (lang === 'PT' ? 'Esboço salvo!' : lang === 'EN' ? 'Outline saved!' : '¡Esquema guardado!') : labels.outline[lang]}
      </button>

      <button onClick={publicLink ? () => { navigator.clipboard.writeText(publicLink); toast.success(labels.linkCopied[lang]); } : handlePublicLink} disabled={!!loadingAction && loadingAction !== 'link'} className={`${actionBtnClass} ${publicLink ? 'text-blue-500 border-blue-500/30' : ''}`}>
        {loadingAction === 'link' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
        {publicLink ? (lang === 'PT' ? 'Copiar Link' : lang === 'EN' ? 'Copy Link' : 'Copiar Enlace') : labels.link[lang]}
      </button>
    </div>
  );
}
