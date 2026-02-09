import type { ExtractorId } from '@/types/extractor';

export interface ExtractorResult {
  content: string;
  title?: string;
  author?: string;
  site?: string;
  published?: string;
}

export interface Extractor {
  readonly label: string;
  readonly id: ExtractorId;
  extract(doc: Document): ExtractorResult;
}
