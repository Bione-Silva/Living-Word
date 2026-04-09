export interface EditableBlogArticle {
  id: string;
  title: string;
  content: string;
  passage?: string | null;
  cover_image_url?: string | null;
  article_images?: string[] | null;
  queue_status?: string;
  queue_id?: string | null;
  language?: string | null;
}

export function intercalateArticleImages(markdown: string, images: string[]): string {
  if (!images.length) return markdown;

  const lines = markdown.split("\n");
  const headingIndices: number[] = [];

  lines.forEach((line, i) => {
    if (/^#{2,3}\s/.test(line.trim())) {
      headingIndices.push(i);
    }
  });

  const insertPoints = headingIndices.slice(1);
  const result = [...lines];
  let offset = 0;

  images.forEach((imgUrl, idx) => {
    if (idx < insertPoints.length) {
      const insertAt = insertPoints[idx] + offset + 2;
      result.splice(insertAt, 0, `\n![Ilustração ${idx + 1}](${imgUrl})\n`);
      offset += 1;
    }
  });

  const remaining = images.slice(insertPoints.length);
  if (remaining.length > 0) {
    const totalLines = result.length;
    remaining.forEach((imgUrl, idx) => {
      const position = Math.floor((totalLines / (remaining.length + 1)) * (idx + 1)) + offset;
      result.splice(Math.min(position, result.length), 0, `\n![Ilustração](${imgUrl})\n`);
      offset += 1;
    });
  }

  return result.join("\n");
}

export function getBodyArticleImages(article: Pick<EditableBlogArticle, "article_images" | "cover_image_url">): string[] {
  const images: string[] = (article.article_images || []).filter(Boolean) as string[];
  const cover = article.cover_image_url;
  return cover && images[0] === cover ? images.slice(1) : images;
}