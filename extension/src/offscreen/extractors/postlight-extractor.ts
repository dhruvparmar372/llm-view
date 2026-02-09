// Use the browser-specific build to avoid Node module dependencies (e.g. 'url')
import Parser from '@postlight/parser/dist/mercury.web.js';
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
