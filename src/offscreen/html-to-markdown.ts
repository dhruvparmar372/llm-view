import TurndownService from 'turndown';

const turndown = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  fence: '```',
  linkStyle: 'inlined',
});

// Strip unwanted elements
turndown.addRule('stripUnwanted', {
  filter: (node) => {
    const tag = node.nodeName.toLowerCase();
    return ['script', 'style', 'noscript', 'svg', 'iframe', 'canvas'].includes(tag);
  },
  replacement: () => '',
});

// Handle buttons with hrefs
turndown.addRule('buttons', {
  filter: (node) => {
    if (node.nodeName === 'BUTTON') return true;
    if (node.nodeName === 'A' && node.getAttribute('role') === 'button') return true;
    if (
      node.nodeName === 'INPUT' &&
      (node.getAttribute('type') === 'button' || node.getAttribute('type') === 'submit')
    )
      return true;
    return false;
  },
  replacement: (content, node) => {
    const el = node as HTMLElement;
    const href = el.closest('a')?.getAttribute('href') || el.getAttribute('href') || '';
    const text =
      content.trim() ||
      (el as HTMLInputElement).value ||
      el.getAttribute('aria-label') ||
      '';
    if (!text) return '';
    return href ? `[${text}](${href})` : `[${text}]`;
  },
});

// Handle images with alt text
turndown.addRule('images', {
  filter: 'img',
  replacement: (_content, node) => {
    const el = node as HTMLElement;
    const alt = el.getAttribute('alt') || '';
    const src = el.getAttribute('src') || '';
    if (!src) return alt ? alt : '';
    return `![${alt}](${src})`;
  },
});

const HIDDEN_CLASSES = [
  'hidden',
  'd-none',
  'sr-only',
  'visually-hidden',
  'invisible',
  'screen-reader-text',
];

function isHiddenByHeuristic(el: Element): boolean {
  // Check hidden attribute
  if (el.hasAttribute('hidden')) return true;

  // Check aria-hidden
  if (el.getAttribute('aria-hidden') === 'true') return true;

  // Check inline style
  const style = el.getAttribute('style');
  if (style) {
    const normalized = style.toLowerCase().replace(/\s/g, '');
    if (normalized.includes('display:none')) return true;
    if (normalized.includes('visibility:hidden')) return true;
    if (normalized.includes('opacity:0')) return true;
  }

  // Check common CSS classes
  const classList = el.classList;
  for (const cls of HIDDEN_CLASSES) {
    if (classList.contains(cls)) return true;
  }

  return false;
}

function stripHiddenElements(root: Element): void {
  // Walk in reverse to avoid mutation issues during iteration
  const elements = root.querySelectorAll('*');
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    if (isHiddenByHeuristic(el)) {
      el.remove();
    }
  }
}

function stripAdContainers(root: Element): void {
  const adSelectors = [
    '[id*="google_ads"]',
    '[id*="ad-"]',
    '[class*="ad-container"]',
    '[class*="advertisement"]',
    '[data-ad]',
    'ins.adsbygoogle',
  ];
  root.querySelectorAll(adSelectors.join(', ')).forEach((el) => el.remove());
}

export function convertHtmlToMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  // Strip unwanted elements
  doc.body
    .querySelectorAll('script, style, noscript, svg, iframe, canvas')
    .forEach((el) => el.remove());

  // Strip hidden elements via heuristics
  stripHiddenElements(doc.body);

  // Strip ad containers
  stripAdContainers(doc.body);

  return turndown.turndown(doc.body);
}
