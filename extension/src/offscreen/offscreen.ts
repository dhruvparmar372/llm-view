import { convertHtmlToMarkdown } from './html-to-markdown';
import { debug } from '@/lib/debug';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Only handle messages targeted at offscreen
  if (message.target !== 'offscreen') return false;

  if (message.type === 'CONVERT_HTML') {
    debug(`[offscreen] converting ${message.html.length} chars`);
    convertHtmlToMarkdown(message.html, message.extractor, message.url).then((markdown) => {
      debug(`[offscreen] conversion done → ${markdown.length} chars markdown`);
      sendResponse({ markdown });
    });
    return true;
  }

  return false;
});
