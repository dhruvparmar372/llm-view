import Defuddle from 'defuddle/full';
import type { Extractor, ExtractorContext, ExtractorResult } from './types';

export const defuddleExtractor: Extractor = {
  label: 'Defuddle',
  id: 'defuddle',
  extract(doc: Document, _context: ExtractorContext): ExtractorResult {
    const result = new Defuddle(doc).parse();
    return {
      content: result.content,
      title: result.title || undefined,
      author: result.author || undefined,
      site: result.site || undefined,
      published: result.published || undefined,
    };
  },
};
