import { Readability } from '@mozilla/readability';
import type { Extractor, ExtractorResult } from './types';

export const readabilityExtractor: Extractor = {
  label: 'Readability',
  id: 'readability',
  extract(doc: Document): ExtractorResult {
    // Readability mutates the DOM, so clone first
    const clone = doc.cloneNode(true) as Document;
    const result = new Readability(clone).parse();
    return {
      content: result?.content ?? '',
      title: result?.title || undefined,
      author: result?.byline || undefined,
      site: result?.siteName || undefined,
      published: result?.publishedTime || undefined,
    };
  },
};
