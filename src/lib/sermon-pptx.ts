/**
 * Exportação de Sermão para PowerPoint (.pptx).
 * Mapeia blocos do Studio para slides projetáveis no datashow,
 * com tipografia GIGANTE (40pt+) para leitura à distância.
 *
 * Branding: rodapé discreto "Living Word" em cada slide.
 */
import pptxgen from 'pptxgenjs';
import {
  SERMON_BLOCK_META,
  type SermonBlockData,
} from '@/components/sermon/sermon-block-types';

type Lang = 'PT' | 'EN' | 'ES';

/**
 * Mapeamento 1:1 — TODO bloco ativo do Studio vira um slide do PPTX,
 * na mesma ordem cronológica. Nenhum tipo é filtrado.
 */

/** Paleta neutra premium — fundo escuro elegante, alto contraste para datashow. */
const COLORS = {
  bgDark: '0F172A',       // slate-900
  bgCard: '1E293B',       // slate-800
  bgLight: 'F8FAFC',      // slate-50
  textLight: 'F1F5F9',    // slate-100
  textMuted: '94A3B8',    // slate-400
  textDark: '0F172A',
  accent: 'D4A853',       // gold (Living Word)
  accentSoft: 'EAB308',
};

const FONTS = {
  display: 'Georgia',
  body: 'Calibri',
};

const T = {
  cover: { PT: 'PREGAÇÃO', EN: 'SERMON', ES: 'PREDICACIÓN' },
  passage: { PT: 'PASSAGEM', EN: 'PASSAGE', ES: 'PASAJE' },
  bigIdea: { PT: 'GRANDE IDEIA', EN: 'BIG IDEA', ES: 'GRAN IDEA' },
  mainPoint: { PT: 'PONTO', EN: 'POINT', ES: 'PUNTO' },
  illustration: { PT: 'ILUSTRAÇÃO', EN: 'ILLUSTRATION', ES: 'ILUSTRACIÓN' },
  application: { PT: 'APLICAÇÃO', EN: 'APPLICATION', ES: 'APLICACIÓN' },
  quote: { PT: 'CITAÇÃO', EN: 'QUOTE', ES: 'CITA' },
  conclusion: { PT: 'CONCLUSÃO', EN: 'CONCLUSION', ES: 'CONCLUSIÓN' },
};

function labelFor(type: string, lang: Lang): string {
  switch (type) {
    case 'passage': return T.passage[lang];
    case 'big_idea': return T.bigIdea[lang];
    case 'main_point': return T.mainPoint[lang];
    case 'illustration': return T.illustration[lang];
    case 'application': return T.application[lang];
    case 'quote': return T.quote[lang];
    case 'conclusion': return T.conclusion[lang];
    default: return SERMON_BLOCK_META[type as keyof typeof SERMON_BLOCK_META]?.label[lang] || '';
  }
}

/** Limita texto longo para caber bem no slide. */
function trimForProjection(text: string, max = 320): string {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trimEnd() + '…';
}

/** Adiciona rodapé de marca em qualquer slide. */
function addBrandFooter(slide: pptxgen.Slide) {
  slide.addText('† LIVING WORD', {
    x: 0,
    y: 7.0,
    w: 13.333,
    h: 0.4,
    align: 'center',
    fontFace: FONTS.body,
    fontSize: 10,
    color: COLORS.accent,
    bold: true,
    charSpacing: 4,
  });
}

/** Slide de capa — Título + Grande Ideia. */
function addCoverSlide(
  pres: pptxgen,
  title: string,
  bigIdea: string,
  lang: Lang,
) {
  const slide = pres.addSlide();
  slide.background = { color: COLORS.bgDark };

  // Tag superior
  slide.addText(T.cover[lang], {
    x: 0.5, y: 0.6, w: 12.3, h: 0.4,
    align: 'center',
    fontFace: FONTS.body,
    fontSize: 14,
    color: COLORS.accent,
    bold: true,
    charSpacing: 8,
  });

  // Linha decorativa
  slide.addShape(pres.ShapeType.line, {
    x: 5.5, y: 1.15, w: 2.3, h: 0,
    line: { color: COLORS.accent, width: 1.5 },
  });

  // Título principal — GIGANTE
  slide.addText(title || 'Sermão', {
    x: 0.8, y: 2.0, w: 11.7, h: 2.5,
    align: 'center',
    valign: 'middle',
    fontFace: FONTS.display,
    fontSize: 60,
    color: COLORS.textLight,
    bold: true,
  });

  // Grande Ideia (subtítulo)
  if (bigIdea?.trim()) {
    slide.addText(`"${bigIdea.trim()}"`, {
      x: 1.5, y: 4.8, w: 10.3, h: 1.6,
      align: 'center',
      valign: 'top',
      fontFace: FONTS.display,
      fontSize: 26,
      color: COLORS.textMuted,
      italic: true,
    });
  }

  addBrandFooter(slide);
}

/** Slide de conteúdo de bloco — letras grandes, alto contraste. */
function addBlockSlide(
  pres: pptxgen,
  block: SermonBlockData,
  index: number,
  lang: Lang,
) {
  const slide = pres.addSlide();
  slide.background = { color: COLORS.bgDark };

  const meta = SERMON_BLOCK_META[block.type];
  const tag = labelFor(block.type, lang);
  const heading = block.title?.trim() || meta?.label[lang] || '';
  const isPassage = block.type === 'passage';
  const isBigIdea = block.type === 'big_idea';
  const isQuote = block.type === 'quote';

  // Tag categoria (topo)
  slide.addText(`${meta?.emoji || ''}  ${tag}${block.type === 'main_point' ? ` ${index}` : ''}`.trim(), {
    x: 0.6, y: 0.45, w: 12.1, h: 0.45,
    align: 'left',
    fontFace: FONTS.body,
    fontSize: 16,
    color: COLORS.accent,
    bold: true,
    charSpacing: 6,
  });

  // Título do bloco
  if (heading && heading !== tag) {
    slide.addText(heading, {
      x: 0.6, y: 1.05, w: 12.1, h: 1.2,
      align: 'left',
      valign: 'top',
      fontFace: FONTS.display,
      fontSize: 44,
      color: COLORS.textLight,
      bold: true,
    });
  }

  // Referência bíblica destacada (passage)
  if (isPassage && block.passageRef?.trim()) {
    slide.addText(block.passageRef.trim(), {
      x: 0.6, y: 1.05, w: 12.1, h: 0.9,
      align: 'left',
      fontFace: FONTS.display,
      fontSize: 40,
      color: COLORS.accentSoft,
      bold: true,
      italic: true,
    });
  }

  // Conteúdo principal — fonte GIGANTE para projeção
  const contentText = trimForProjection(block.content || '', isBigIdea || isQuote ? 220 : 380);
  if (contentText) {
    const contentY = isPassage ? 2.2 : (heading && heading !== tag ? 2.6 : 1.6);
    const contentH = 6.8 - contentY;

    slide.addText(
      isPassage || isQuote ? `"${contentText}"` : contentText,
      {
        x: 0.8, y: contentY, w: 11.7, h: contentH,
        align: isBigIdea || isQuote ? 'center' : 'left',
        valign: isBigIdea || isQuote ? 'middle' : 'top',
        fontFace: isPassage || isQuote ? FONTS.display : FONTS.body,
        fontSize: isBigIdea ? 48 : isQuote || isPassage ? 36 : 30,
        color: COLORS.textLight,
        italic: isPassage || isQuote || isBigIdea,
        lineSpacingMultiple: 1.3,
      },
    );
  }

  addBrandFooter(slide);
}

/**
 * Gera e baixa um arquivo .pptx do sermão.
 * @returns número de slides criados
 */
export async function exportSermonToPptx(opts: {
  blocks: SermonBlockData[];
  title: string;
  bigIdea: string;
  passageRef?: string;
  lang: Lang;
}): Promise<number> {
  const { blocks, title, bigIdea, passageRef, lang } = opts;

  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 in (16:9)
  pres.title = title || 'Sermão';
  pres.author = 'Living Word';
  pres.company = 'Living Word';

  // Capa
  addCoverSlide(pres, title || passageRef || 'Sermão', bigIdea, lang);

  // Slides de conteúdo — 1 slide para CADA bloco ativo, na ordem original.
  // Pula apenas blocos 100% vazios (sem título, conteúdo ou referência).
  let mainPointIndex = 0;
  let contentSlides = 0;
  for (const block of blocks) {
    const hasContent = (block.content?.trim().length || 0) > 0
      || (block.title?.trim().length || 0) > 0
      || (block.type === 'passage' && (block.passageRef?.trim().length || 0) > 0);
    if (!hasContent) continue;
    if (block.type === 'main_point') mainPointIndex += 1;
    addBlockSlide(pres, block, mainPointIndex, lang);
    contentSlides += 1;
  }

  const safeName = (title || 'sermao')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'sermao';

  await pres.writeFile({ fileName: `${safeName}.pptx` });
  // Total = capa + 1 slide por bloco ativo
  return 1 + contentSlides;
}
