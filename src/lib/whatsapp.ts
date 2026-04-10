export function buildWhatsAppShareUrl(text: string) {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

export function openWhatsAppShare(text: string) {
  const link = document.createElement('a');
  link.href = buildWhatsAppShareUrl(text);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}