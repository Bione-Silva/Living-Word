/**
 * Shared branding for all PDF and DOCX exports.
 * Every exported document must carry Living Word identity.
 */

export const BRAND = {
  name: 'Living Word',
  site: 'www.livingwordgo.com',
  logoPath: '/logo-livingword.png',
  colors: {
    gold: '#6D28D9',
    brown: '#1E1240',
    muted: '#999999',
  },
} as const;

/* ── PDF (html2pdf.js) helpers ── */

/** Returns an HTML header bar with logo + brand name for PDF exports */
export function pdfBrandHeader(): string {
  return `
    <div style="display:flex;align-items:center;gap:10px;padding-bottom:10px;margin-bottom:16px;border-bottom:2px solid ${BRAND.colors.gold};">
      <img src="${BRAND.logoPath}" style="height:36px;width:36px;object-fit:contain;" alt="Living Word" />
      <span style="font-family:Georgia,serif;font-size:14px;font-weight:bold;color:${BRAND.colors.brown};">
        ${BRAND.name}
      </span>
    </div>`;
}

/** Returns an HTML footer bar with site URL and Logo for PDF exports */
export function pdfBrandFooter(): string {
  return `
    <div style="margin-top:40px;padding-top:16px;border-top:1px solid #eee;text-align:center;font-size:12px;color:${BRAND.colors.muted};font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;gap:8px;">
      <img src="${BRAND.logoPath}" style="height:20px;opacity:0.8;" alt="Logo" />
      <span>${BRAND.name} &bull; <a href="https://${BRAND.site}" style="color:${BRAND.colors.muted};text-decoration:none;">${BRAND.site}</a></span>
    </div>`;
}

/**
 * Wraps arbitrary HTML content with Living Word branded header + footer.
 * Use before passing to html2pdf().from(container).
 */
export function wrapWithBrand(innerHtml: string): string {
  return `<div style="font-family:'Georgia',serif;padding:20px;color:#333;max-width:700px;margin:0 auto;">
    <style>
      h1, h2, h3, h4, .page-break-avoid { page-break-inside: avoid !important; break-inside: avoid !important; }
      h1, h2, h3 { page-break-after: avoid !important; break-after: avoid !important; padding-top: 10px; }
      img, figure { page-break-inside: avoid; }
    </style>
    ${pdfBrandHeader()}
    ${innerHtml}
    ${pdfBrandFooter()}
  </div>`;
}

/* ── DOCX helpers ── */

/**
 * Creates branded header + footer paragraphs for DOCX exports.
 * Call with the dynamically-imported docx module members.
 */
export function docxBrandElements(docx: {
  Paragraph: any;
  TextRun: any;
  AlignmentType: any;
  Header: any;
  Footer: any;
  ImageRun: any;
  BorderStyle: any;
}, logoBuffer?: ArrayBuffer | null) {
  const { Paragraph, TextRun, AlignmentType, Header, Footer, ImageRun, BorderStyle } = docx;

  const headerChildren: any[] = [];

  if (logoBuffer) {
    headerChildren.push(
      new ImageRun({
        type: 'png',
        data: logoBuffer,
        transformation: { width: 28, height: 28 },
        altText: { title: 'Living Word', description: 'Living Word logo', name: 'logo' },
      })
    );
  }

  headerChildren.push(
    new TextRun({ text: logoBuffer ? '  Living Word' : 'Living Word', font: 'Georgia', size: 20, bold: true, color: '6B4F3A' })
  );

  const headerParagraph = new Paragraph({
    alignment: AlignmentType.LEFT,
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D4A853', space: 4 } },
    spacing: { after: 200 },
    children: headerChildren,
  });

  const footerParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: `Living Word • ${BRAND.site}`, font: 'Arial', size: 16, color: '999999', italics: true }),
    ],
  });

  return {
    headers: { default: new Header({ children: [headerParagraph] }) },
    footers: { default: new Footer({ children: [footerParagraph] }) },
  };
}

/** Fetches the Living Word logo as ArrayBuffer (for DOCX ImageRun). */
export async function fetchLogoBuffer(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(BRAND.logoPath);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}
