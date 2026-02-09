import type { ExtractorId } from '@/types/extractor';
import type { Extractor } from './types';
import { defuddleExtractor } from './defuddle-extractor';
import { readabilityExtractor } from './readability-extractor';

const extractors: Record<ExtractorId, Extractor> = {
  defuddle: defuddleExtractor,
  readability: readabilityExtractor,
};

export function getExtractor(id?: ExtractorId): Extractor {
  return extractors[id ?? 'defuddle'];
}
