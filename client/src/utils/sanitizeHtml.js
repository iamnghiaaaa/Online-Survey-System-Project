import DOMPurify from 'dompurify';

const CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'a', 'span'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
};

export function sanitizeSurveyHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, CONFIG);
}

export function isRichTextEmpty(html) {
  if (!html || typeof html !== 'string') return true;
  const plain = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain === '';
}

export function plainTextSnippet(html, max = 72) {
  if (!html) return '';
  const t = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}
