declare module '@postlight/parser' {
  interface ParseResult {
    title?: string;
    content?: string;
    author?: string;
    date_published?: string;
    lead_image_url?: string;
    dek?: string;
    next_page_url?: string;
    url?: string;
    domain?: string;
    excerpt?: string;
    word_count?: number;
    direction?: string;
    total_pages?: number;
    rendered_pages?: number;
  }

  interface ParseOptions {
    html?: string;
    contentType?: string;
    headers?: Record<string, string>;
  }

  const Parser: {
    parse(url: string, options?: ParseOptions): Promise<ParseResult>;
  };

  export default Parser;
}

declare module '@postlight/parser/dist/mercury.esm.js' {
  import Parser from '@postlight/parser';
  export default Parser;
}
