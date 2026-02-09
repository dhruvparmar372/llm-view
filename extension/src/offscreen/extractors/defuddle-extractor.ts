import Defuddle from 'defuddle/full';
import type { Extractor, ExtractorResult } from './types';

export const defuddleExtractor: Extractor = {
  label: 'Defuddle',
  id: 'defuddle',
  extract(doc: Document): ExtractorResult {
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
