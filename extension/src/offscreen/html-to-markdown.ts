import TurndownService from 'turndown';
import { strikethrough, taskListItems } from 'turndown-plugin-gfm';
import DOMPurify from 'dompurify';
import { debug } from '@/lib/debug';
import type { ExtractorId } from '@/types/extractor';
import { getExtractor } from './extractors/registry';

const turndown = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  fence: '```',
  linkStyle: 'inlined',
});

turndown.use(strikethrough);
turndown.use(taskListItems);

// --- Custom table handling ---
// Swallow table sub-elements so they don't produce independent output.
// The parent <table> rule reads the DOM directly and processes cell content.
turndown.addRule('tableSubElements', {
  filter: ['thead', 'tbody', 'tfoot', 'caption', 'colgroup', 'col', 'tr', 'td', 'th'],
  replacement: () => '',
});

turndown.addRule('table', {
  filter: 'table',
  replacement: (_content, node) => {
    const table = node as HTMLElement;
    const rows: string[][] = [];
    let headerRowCount = 0;

    for (const tr of Array.from(table.querySelectorAll('tr'))) {
      // Only process rows that belong directly to this table, not nested tables
      if (tr.closest('table') !== table) continue;

      const isHeaderRow =
        tr.closest('thead') !== null ||
        (tr.querySelector('th') !== null && rows.length === 0);

      const cells: string[] = [];
      for (const child of Array.from(tr.children)) {
        if (child.tagName !== 'TD' && child.tagName !== 'TH') continue;
        const md = turndown.turndown(child.innerHTML).trim().replace(/\n+/g, ' ');
        cells.push(md);
      }

      if (cells.some((c) => c.length > 0)) {
        rows.push(cells);
        if (isHeaderRow) headerRowCount++;
      }
    }

    if (rows.length === 0) return '';

    // Tables with header cells → GFM pipe table
    if (headerRowCount > 0) {
      const maxCols = Math.max(...rows.map((r) => r.length));
      for (const row of rows) {
        while (row.length < maxCols) row.push('');
      }

      // Escape literal pipes inside cell content so they don't break GFM structure
      const escaped = rows.map((row) => row.map((cell) => cell.replace(/\|/g, '\\|')));

      const lines: string[] = [];
      for (let i = 0; i < headerRowCount; i++) {
        lines.push('| ' + escaped[i].join(' | ') + ' |');
      }
      lines.push('| ' + Array(maxCols).fill('---').join(' | ') + ' |');
      for (let i = headerRowCount; i < escaped.length; i++) {
        lines.push('| ' + escaped[i].join(' | ') + ' |');
      }
      return '\n\n' + lines.join('\n') + '\n\n';
    }

    // No headers → each row as a line, cells joined with spaces
    const lines = rows.map((row) => row.filter((c) => c.length > 0).join(' '));
    return '\n\n' + lines.filter((l) => l.length > 0).join('\n') + '\n\n';
  },
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

export function convertHtmlToMarkdown(html: string, extractorId?: ExtractorId): string {
  try {
    // Sanitize untrusted HTML before it touches the extractor
    const cleanHtml = DOMPurify.sanitize(html, {
      WHOLE_DOCUMENT: true,
      RETURN_DOM: false,
    });

    const doc = new DOMParser().parseFromString(cleanHtml, 'text/html');

    const extractor = getExtractor(extractorId);
    const result = extractor.extract(doc);
    if (!result.content || !result.content.trim()) {
      debug(`[html-to-markdown] ${extractor.id} could not extract content`);
      return '[llm-see] Could not extract readable content from this page.';
    }

    // Build markdown from extracted metadata + content
    const parts: string[] = [];

    if (result.title) {
      parts.push(`# ${result.title}`);
    }

    const meta: string[] = [];
    if (result.author) meta.push(result.author);
    if (result.site) meta.push(result.site);
    if (result.published) meta.push(result.published);
    if (meta.length > 0) {
      parts.push(meta.join(' · '));
    }

    const content = turndown.turndown(result.content);
    parts.push(content);

    return parts.join('\n\n');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    debug(`[html-to-markdown] conversion failed: ${message}`);
    return '[llm-see] Failed to convert this page to markdown.';
  }
}
