// Use the ESM build which has a proper `export default`.
// The conditional require('jsdom') / require('util') inside it only fire when
// DOMParser is unavailable (Node-only), so they are dead code in browser contexts.
import Parser from '@postlight/parser/dist/mercury.esm.js';
import type { Extractor, ExtractorContext, ExtractorResult } from './types';

export const postlightExtractor: Extractor = {
  label: 'Postlight',
  id: 'postlight',
  async extract(_doc: Document, context: ExtractorContext): Promise<ExtractorResult> {
    const result = await Parser.parse(context.url, { html: context.html });
    return {
      content: result.content ?? '',
      title: result.title || undefined,
      author: result.author || undefined,
      site: result.domain || undefined,
      published: result.date_published || undefined,
    };
  },
};
