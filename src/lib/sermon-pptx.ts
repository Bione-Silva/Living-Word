/**
 * Exportação de Sermão para PowerPoint (.pptx).
 *
 * Mapeia blocos do Studio para slides projetáveis no datashow,
 * com tipografia GIGANTE para leitura à distância e auto-fit que
 * reduz a fonte ou divide em múltiplos slides quando o conteúdo
 * é longo demais — para nunca sobrar texto cortado.
 *
 * Branding: rodapé discreto "Living Word" em cada slide.
 * Identidade: borda esquerda + tag + referências bíblicas inline coloridas
 * na cor identitária do bloco (espelha Studio + Púlpito Claro).
 */
import pptxgen from 'pptxgenjs';
import {
  SERMON_BLOCK_META,
  type SermonBlockData,
} from '@/components/sermon/sermon-block-types';
import { splitByVerseRefs } from '@/lib/verse-highlighter';

type Lang = 'PT' | 'EN' | 'ES';

/** Paleta neutra premium — fundo escuro elegante, alto contraste para datashow. */
const COLORS = {
  bgDark: '0F172A',
  textLight: 'F1F5F9',
  textMuted: '94A3B8',
  textDark: '0F172A',
  accent: 'D4A853', // gold (Living Word)
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
  cont: { PT: '(continua)', EN: '(continued)', ES: '(continúa)' },
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

/* ───────────────────────── Auto-fit & Pagination ───────────────────────── */

/**
 * Tabela de fontSize por densidade de caracteres.
 * Slide tem ~10.7" x 4.6" úteis para conteúdo (em LAYOUT_WIDE 13.333" x 7.5").
 * Valores empíricos calibrados para Calibri/Georgia.
 */
function pickFontSize(charCount: number, isHero: boolean): number {
  if (isHero) {
    // Big Idea / Quote — sempre grandes
    if (charCount <= 80) return 48;
    if (charCount <= 160) return 40;
    if (charCount <= 260) return 32;
    return 28;
  }
  if (charCount <= 220) return 32;
  if (charCount <= 380) return 28;
  if (charCount <= 560) return 24;
  if (charCount <= 760) return 22;
  return 20; // mínimo legível à distância
}

/** Capacidade aproximada de chars por slide para a fontSize escolhida. */
function maxCharsPerSlide(fontSize: number): number {
  // Empírico: ~9000 / fontSize → quantos chars cabem confortavelmente
  if (fontSize >= 32) return 350;
  if (fontSize >= 28) return 520;
  if (fontSize >= 24) return 760;
  if (fontSize >= 22) return 950;
  return 1150;
}

/**
 * Quebra um texto longo em pedaços que cabem em slides separados,
 * preservando parágrafos e nunca cortando frases no meio.
 */
function splitForSlides(text: string, maxChars: number): string[] {
  const clean = (text || '').trim();
  if (clean.length <= maxChars) return [clean];

  const paragraphs = clean.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let buf = '';

  const flush = () => {
    if (buf.trim()) chunks.push(buf.trim());
    buf = '';
  };

  for (const p of paragraphs) {
    if ((buf + '\n\n' + p).length <= maxChars) {
      buf = buf ? `${buf}\n\n${p}` : p;
      continue;
    }
    flush();
    if (p.length <= maxChars) {
      buf = p;
      continue;
    }
    // Parágrafo único maior que maxChars — quebra por sentenças
    const sentences = p.split(/(?<=[.!?])\s+/);
    let sBuf = '';
    for (const s of sentences) {
      if ((sBuf + ' ' + s).length <= maxChars) {
        sBuf = sBuf ? `${sBuf} ${s}` : s;
      } else {
        if (sBuf) chunks.push(sBuf.trim());
        sBuf = s;
      }
    }
    if (sBuf) buf = sBuf;
  }
  flush();
  return chunks;
}

/* ───────────────────────── Rich text com refs coloridas ───────────────────────── */

interface RichRun {
  text: string;
  options?: { color?: string; bold?: boolean; italic?: boolean };
}

/**
 * Converte texto em array de runs do pptxgenjs, destacando referências
 * bíblicas (PT/EN/ES) na cor identitária do bloco.
 */
function buildRichRuns(
  text: string,
  baseColor: string,
  refColor: string,
  italic = false,
): RichRun[] {
  const segs = splitByVerseRefs(text);
  return segs
    .filter((s) => s.value.length > 0)
    .map((s) =>
      s.type === 'ref'
        ? { text: s.value, options: { color: refColor, bold: true, italic } }
        : { text: s.value, options: { color: baseColor, italic } },
    );
}

/* ───────────────────────── Brand footer ───────────────────────── */

function addBrandFooter(slide: pptxgen.Slide, color = COLORS.accent) {
  slide.addText('† LIVING WORD', {
    x: 0,
    y: 7.0,
    w: 13.333,
    h: 0.4,
    align: 'center',
    fontFace: FONTS.body,
    fontSize: 10,
    color,
    bold: true,
    charSpacing: 4,
  });
}

/* ───────────────────────── Cover slide ───────────────────────── */

function addCoverSlide(
  pres: pptxgen,
  title: string,
  bigIdea: string,
  lang: Lang,
) {
  const slide = pres.addSlide();
  slide.background = { color: COLORS.bgDark };

  slide.addText(T.cover[lang], {
    x: 0.5, y: 0.6, w: 12.3, h: 0.4,
    align: 'center',
    fontFace: FONTS.body,
    fontSize: 14,
    color: COLORS.accent,
    bold: true,
    charSpacing: 8,
  });

  slide.addShape(pres.ShapeType.line, {
    x: 5.5, y: 1.15, w: 2.3, h: 0,
    line: { color: COLORS.accent, width: 1.5 },
  });

  slide.addText(title || 'Sermão', {
    x: 0.8, y: 2.0, w: 11.7, h: 2.5,
    align: 'center',
    valign: 'middle',
    fontFace: FONTS.display,
    fontSize: 60,
    color: COLORS.textLight,
    bold: true,
    fit: 'shrink', // auto-shrink se título for longo
  });

  if (bigIdea?.trim()) {
    const runs = buildRichRuns(`"${bigIdea.trim()}"`, COLORS.textMuted, COLORS.accent, true);
    slide.addText(runs, {
      x: 1.5, y: 4.8, w: 10.3, h: 1.6,
      align: 'center',
      valign: 'top',
      fontFace: FONTS.display,
      fontSize: 26,
      italic: true,
      fit: 'shrink',
    });
  }

  addBrandFooter(slide);
}

/* ───────────────────────── Content slide(s) per block ───────────────────────── */

/**
 * Adiciona 1+ slides para um bloco. Retorna quantos slides foram criados.
 * Quando o conteúdo é longo, divide automaticamente em múltiplos slides
 * marcando "(continua)" no rodapé dos intermediários.
 */
function addBlockSlides(
  pres: pptxgen,
  block: SermonBlockData,
  index: number,
  lang: Lang,
): number {
  const meta = SERMON_BLOCK_META[block.type];
  const tag = labelFor(block.type, lang);
  const heading = block.title?.trim() || meta?.label[lang] || '';
  const isPassage = block.type === 'passage';
  const isHero = block.type === 'big_idea' || block.type === 'quote';

  const palette = meta?.hex ?? {
    bg50: 'F8FAFC', border200: 'E2E8F0', accent500: '64748B', accent700: '334155',
  };
  const bg50 = palette.bg50.replace('#', '');
  const accent700 = palette.accent700.replace('#', '');
  const accent500 = palette.accent500.replace('#', '');
  const border200 = palette.border200.replace('#', '');

  const rawContent = (block.content || '').trim();
  const fontSize = pickFontSize(rawContent.length, isHero);
  const maxChars = maxCharsPerSlide(fontSize);
  const chunks = rawContent ? splitForSlides(rawContent, maxChars) : [''];

  chunks.forEach((chunk, chunkIdx) => {
    const slide = pres.addSlide();
    slide.background = { color: bg50 };

    // Faixa identitária (borda esquerda)
    slide.addShape(pres.ShapeType.rect, {
      x: 0, y: 0, w: 0.18, h: 7.5,
      fill: { color: accent500 },
      line: { type: 'none' },
    });

    // Tag categoria
    const tagText = `${meta?.emoji || ''}  ${tag}${block.type === 'main_point' ? ` ${index}` : ''}`.trim();
    const tagSuffix = chunks.length > 1 ? ` · ${chunkIdx + 1}/${chunks.length}` : '';
    slide.addText(`${tagText}${tagSuffix}`, {
      x: 0.6, y: 0.45, w: 12.1, h: 0.45,
      align: 'left',
      fontFace: FONTS.body,
      fontSize: 16,
      color: accent700,
      bold: true,
      charSpacing: 6,
    });

    // Heading (apenas no 1º slide do bloco)
    let contentY = 1.05;
    let contentH = 5.6;

    if (chunkIdx === 0 && isPassage && block.passageRef?.trim()) {
      slide.addText(block.passageRef.trim(), {
        x: 0.6, y: 1.05, w: 12.1, h: 0.9,
        align: 'left',
        fontFace: FONTS.display,
        fontSize: 36,
        color: accent700,
        bold: true,
        italic: true,
        fit: 'shrink',
      });
      contentY = 2.05;
      contentH = 4.7;
    } else if (chunkIdx === 0 && heading && heading !== tag) {
      slide.addText(heading, {
        x: 0.6, y: 1.05, w: 12.1, h: 1.3,
        align: 'left',
        valign: 'top',
        fontFace: FONTS.display,
        fontSize: heading.length > 50 ? 32 : 40,
        color: COLORS.textDark,
        bold: true,
        fit: 'shrink',
      });
      contentY = 2.4;
      contentH = 4.4;
    }

    // Conteúdo principal — runs com refs coloridas
    if (chunk) {
      const wrappedChunk = isPassage ? `"${chunk}"` : chunk;
      const runs = buildRichRuns(
        wrappedChunk,
        COLORS.textDark,
        accent700,
        isHero || isPassage,
      );
      slide.addText(runs, {
        x: 0.8, y: contentY, w: 11.7, h: contentH,
        align: isHero ? 'center' : 'left',
        valign: isHero ? 'middle' : 'top',
        fontFace: isPassage || isHero ? FONTS.display : FONTS.body,
        fontSize,
        lineSpacingMultiple: 1.3,
        fit: 'shrink', // segurança extra: ainda encolhe se passar
        paraSpaceAfter: 6,
      });
    }

    // Indicador "(continua)" no rodapé esquerdo de slides intermediários
    if (chunks.length > 1 && chunkIdx < chunks.length - 1) {
      slide.addText(T.cont[lang], {
        x: 0.6, y: 6.5, w: 4, h: 0.3,
        align: 'left',
        fontFace: FONTS.body,
        fontSize: 12,
        color: accent500,
        italic: true,
      });
    }

    // Linha divisória + brand footer
    slide.addShape(pres.ShapeType.line, {
      x: 0.6, y: 6.85, w: 12.1, h: 0,
      line: { color: border200, width: 1 },
    });
    addBrandFooter(slide, accent700);
  });

  return chunks.length;
}

/* ───────────────────────── Public API ───────────────────────── */

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

  // 1 (ou +) slides por bloco ativo, na ordem original
  let mainPointIndex = 0;
  let totalContentSlides = 0;
  for (const block of blocks) {
    const hasContent = (block.content?.trim().length || 0) > 0
      || (block.title?.trim().length || 0) > 0
      || (block.type === 'passage' && (block.passageRef?.trim().length || 0) > 0);
    if (!hasContent) continue;
    if (block.type === 'main_point') mainPointIndex += 1;
    totalContentSlides += addBlockSlides(pres, block, mainPointIndex, lang);
  }

  const safeName = (title || 'sermao')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'sermao';

  await pres.writeFile({ fileName: `${safeName}.pptx` });
  return 1 + totalContentSlides;
}
