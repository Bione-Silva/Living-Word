export function buildWhatsAppShareUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function openWhatsAppShare(text: string) {
  const url = buildWhatsAppShareUrl(text);
  window.open(url, '_blank', 'noopener,noreferrer');
}
