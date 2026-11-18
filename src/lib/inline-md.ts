// Minimal inline Markdown (links, *italics*, **bold**) for captions stored in front matter.
import { url } from './url';
export function marked(s: string): string {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text, href) => `<a href="${url(href)}">${text}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
