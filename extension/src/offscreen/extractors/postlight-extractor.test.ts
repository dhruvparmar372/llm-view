import { describe, it, expect } from 'vitest';
import { postlightExtractor } from './postlight-extractor';

const sampleHtml = `
<!DOCTYPE html>
<html>
<head><title>Test Article</title></head>
<body>
  <article>
    <h1>Test Article Title</h1>
    <p>By John Doe</p>
    <p>This is the first paragraph of the article. It contains enough text to be considered meaningful content by the parser. The postlight parser typically needs a reasonable amount of content to extract properly.</p>
    <p>This is the second paragraph with more details about the topic. We want to make sure the extractor can handle basic HTML content and return it correctly.</p>
    <p>Here is a third paragraph to provide even more content for the extractor to work with. Having multiple paragraphs helps ensure the content is recognized as an article.</p>
  </article>
</body>
</html>
`;

describe('postlightExtractor', () => {
  it('extracts content from basic HTML', async () => {
    const doc = new DOMParser().parseFromString(sampleHtml, 'text/html');

    const result = await postlightExtractor.extract(doc, {
      html: sampleHtml,
      url: 'https://example.com/test-article',
    });

    expect(result.content).toBeTruthy();
    expect(result.content.length).toBeGreaterThan(0);
    // The extracted content should contain the article text
    expect(result.content).toContain('first paragraph');
    expect(result.content).toContain('second paragraph');
  });
});
