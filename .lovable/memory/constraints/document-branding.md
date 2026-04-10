---
name: Document branding rule
description: All exported documents (PDF/DOCX) must carry Living Word header (logo + name) and footer (site URL)
type: constraint
---
Every PDF and DOCX export must include:
- **Header**: Living Word logo + "Living Word" text, gold (#D4A853) bottom border
- **Footer**: "Living Word • www.livingwordgo.com" centered, muted gray

Use the shared utility at `src/lib/export-branding.ts`:
- PDF: `pdfBrandHeader()`, `pdfBrandFooter()`, or `wrapWithBrand(html)`
- DOCX: `docxBrandElements(docxModules, logoBuffer)` for header/footer sections

Logo file: `public/logo-livingword.png`
Website: `www.livingwordgo.com`
