import { forwardRef, useImperativeHandle, useRef } from 'react';
import JSZip from 'jszip';
import { SlideCanvas, type SlideData } from './SlideCanvas';
import { getThemePalette, type ThemeConfig } from './ThemeCustomizer';
import type { CanvasTemplate } from './TemplatePicker';
import { captureNodeAsPng } from './export-utils';
import { getFormatById, type FormatId, type FormatDef } from './FormatPicker';

interface Props {
  formats: FormatId[];
  slides: SlideData[];
  theme: ThemeConfig;
  template: CanvasTemplate;
}

export interface MultiFormatExporterHandle {
  /** Build a ZIP containing one PNG per (format × slide). */
  buildZip: () => Promise<Blob>;
  /** Capture a single (format, slideIdx) as PNG blob. */
  capture: (formatId: FormatId, slideIdx: number) => Promise<Blob>;
}

function dataUrlToBlob(dataUrl: string) {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const binary = atob(parts[1]);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return new Blob([array], { type: mime });
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Renders an offscreen instance of SlideCanvas for every (format × slide)
 * combination so it can be captured at the correct aspect ratio per channel.
 * The container is visually hidden but kept in the DOM so html2canvas can
 * read computed styles correctly.
 */
export const MultiFormatExporter = forwardRef<MultiFormatExporterHandle, Props>(
  ({ formats, slides, theme, template }, ref) => {
    // Map of nodeKey -> DOM ref. Key = `${formatId}::${slideIdx}`
    const refsMap = useRef<Map<string, HTMLDivElement | null>>(new Map());
    const setRef = (key: string) => (el: HTMLDivElement | null) => {
      refsMap.current.set(key, el);
    };

    const captureBlob = async (formatId: FormatId, slideIdx: number): Promise<Blob> => {
      const key = `${formatId}::${slideIdx}`;
      const node = refsMap.current.get(key);
      if (!node) throw new Error(`No render node for ${key}`);
      const dataUrl = await captureNodeAsPng(node);
      return dataUrlToBlob(dataUrl);
    };

    useImperativeHandle(ref, () => ({
      capture: captureBlob,
      buildZip: async () => {
        const zip = new JSZip();
        for (const fid of formats) {
          const def = getFormatById(fid);
          if (!def) continue;
          const folderName = `${slugify(def.channel.PT)}-${slugify(def.type.PT)}`;
          const folder = zip.folder(folderName) ?? zip;
          for (let i = 0; i < slides.length; i++) {
            try {
              const blob = await captureBlob(fid, i);
              const fname = slides.length === 1
                ? `${folderName}.png`
                : `slide-${String(i + 1).padStart(2, '0')}.png`;
              folder.file(fname, blob);
            } catch (e) {
              console.warn('export skipped', fid, i, e);
            }
          }
        }
        return zip.generateAsync({ type: 'blob' });
      },
    }));

    return (
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-99999px',
          top: 0,
          width: 600,
          height: 'auto',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {formats.map((fid) => {
          const def: FormatDef | undefined = getFormatById(fid);
          if (!def) return null;
          return (
            <div key={fid} style={{ width: 520, marginBottom: 12 }}>
              {slides.map((slide, slideIdx) => {
                return (
                  <div key={`${fid}-${slideIdx}`} style={{ width: 520 }}>
                    <SlideCanvas
                      ref={setRef(`${fid}::${slideIdx}`)}
                      slide={slide}
                      aspectRatio={def.aspectRatio}
                      template={template}
                      bgImageUrl={slide.bgImageUrl ?? theme.backgroundImageUrl}
                      themeColor={theme.gradient}
                      themeColors={getThemePalette(theme.gradient)}
                      slideIndex={slideIdx}
                      fontFamily={theme.fontFamily}
                      textColor={theme.textColor}
                      showWatermark
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }
);

MultiFormatExporter.displayName = 'MultiFormatExporter';
