import { getFontEmbedCSS, toPng } from 'html-to-image';

export const EXPORT_SCALE = 3;

export const waitForNextPaint = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

async function inlineExternalImages(node: HTMLElement) {
  const images = Array.from(node.querySelectorAll('img'));

  await Promise.all(
    images.map(async (img) => {
      if (!img.complete) {
        await new Promise<void>((resolve) => {
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        });
      }

      if (!img.src || img.src.startsWith('data:')) {
        return;
      }

      try {
        const resp = await fetch(img.src, { mode: 'cors' });
        const blob = await resp.blob();
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        img.src = dataUrl;
      } catch {
        try {
          const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(img.src)}&w=1200&output=jpg`;
          const resp = await fetch(proxyUrl);
          const blob = await resp.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          img.src = dataUrl;
        } catch {
          // keep original src as a last resort
        }
      }
    })
  );
}

function getCaptureDimensions(node: HTMLDivElement) {
  const width = Number(node.dataset.captureWidth) || Math.round(node.scrollWidth || node.getBoundingClientRect().width);
  const height = Number(node.dataset.captureHeight) || Math.round(node.scrollHeight || node.getBoundingClientRect().height);

  return { width, height };
}

function createSandboxClone(node: HTMLDivElement, width: number, height: number) {
  const sandbox = document.createElement('div');
  sandbox.style.position = 'fixed';
  sandbox.style.left = '-10000px';
  sandbox.style.top = '0';
  sandbox.style.width = `${width}px`;
  sandbox.style.height = `${height}px`;
  sandbox.style.overflow = 'hidden';
  sandbox.style.pointerEvents = 'none';
  sandbox.style.zIndex = '-1';

  const clone = node.cloneNode(true) as HTMLDivElement;
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.margin = '0';
  clone.style.transform = 'none';
  clone.style.transformOrigin = 'top left';
  clone.style.maxWidth = 'none';
  clone.style.maxHeight = 'none';

  sandbox.appendChild(clone);
  document.body.appendChild(sandbox);

  return { sandbox, clone };
}

export async function captureNodeAsPng(node: HTMLDivElement) {
  const { width, height } = getCaptureDimensions(node);
  const { sandbox, clone } = createSandboxClone(node, width, height);

  try {
    if ('fonts' in document) {
      await document.fonts.ready;
    }

    await inlineExternalImages(clone);
    await waitForNextPaint();

    let fontEmbedCSS: string | undefined;
    try {
      fontEmbedCSS = await getFontEmbedCSS(clone);
    } catch {
      fontEmbedCSS = undefined;
    }

    return await toPng(clone, {
      cacheBust: true,
      pixelRatio: 1,
      backgroundColor: '#000000',
      width,
      height,
      canvasWidth: width * EXPORT_SCALE,
      canvasHeight: height * EXPORT_SCALE,
      skipAutoScale: true,
      fontEmbedCSS,
      style: {
        margin: '0',
        transform: 'none',
        transformOrigin: 'top left',
      },
    });
  } finally {
    sandbox.remove();
  }
}
