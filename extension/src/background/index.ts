import { pushLog } from './debug-store';
import type { ExtractorId } from '@/types/extractor';

// --- Debug ---
function inferSource(sender: chrome.runtime.MessageSender): string {
  if (sender.url?.includes('offscreen.html')) return 'offscreen';
  if (sender.tab) return `tab:${sender.tab.id}`;
  return 'unknown';
}

function bgDebug(message: string): void {
  pushLog('background', message);
}

// --- Offscreen document management ---
let creatingOffscreen: Promise<void> | null = null;

async function ensureOffscreenDocument(): Promise<void> {
  const offscreenUrl = chrome.runtime.getURL('offscreen.html');
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType],
    documentUrls: [offscreenUrl],
  });
  if (contexts.length > 0) return;

  if (creatingOffscreen) {
    await creatingOffscreen;
    return;
  }

  creatingOffscreen = chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['DOM_PARSER' as chrome.offscreen.Reason],
    justification: 'Parse HTML and convert to markdown using DOMParser and Turndown',
  });
  await creatingOffscreen;
  creatingOffscreen = null;
}

// --- Convert HTML via offscreen document ---
async function convertViaOffscreen(html: string, extractor?: ExtractorId, url?: string): Promise<string> {
  await ensureOffscreenDocument();
  const response = await chrome.runtime.sendMessage({
    type: 'CONVERT_HTML',
    target: 'offscreen',
    html,
    extractor,
    url,
  });
  return response.markdown;
}

// --- Message listener ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DEBUG_LOG') {
    const source = inferSource(sender);
    pushLog(source, message.message);
    return false;
  }

  if (message.type === 'CONVERT_PAGE') {
    const tabId = sender.tab?.id;
    if (tabId == null) return false;

    bgDebug(`convert requested from tab:${tabId} (${message.html.length} chars)`);

    convertViaOffscreen(message.html, message.extractor, message.url)
      .then((markdown) => {
        bgDebug(`conversion done for tab:${tabId} (${markdown.length} chars markdown)`);
        chrome.tabs.sendMessage(tabId, {
          type: 'MARKDOWN_READY',
          markdown,
        });
      })
      .catch((err) => {
        console.error('[llm-view] Conversion error:', err);
      });

    return false;
  }

  if (message.type === 'START_CONVERSION') {
    const tabId = message.tabId as number;
    bgDebug(`popup requested conversion for tab:${tabId}`);

    handleStartConversion(tabId)
      .then((markdown) => sendResponse({ markdown }))
      .catch((err) => {
        console.error('[llm-view] START_CONVERSION error:', err);
        sendResponse({ error: String(err) });
      });

    return true; // keep channel open for async sendResponse
  }

  return false;
});

// --- Popup-driven conversion ---
async function handleStartConversion(tabId: number): Promise<string> {
  // 1. Inject content script (idempotent)
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content.js'],
  });

  // 2. Get page HTML and URL
  const [htmlResult] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => document.body.innerHTML,
  });
  const [urlResult] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => window.location.href,
  });

  const html = htmlResult.result as string;
  const url = urlResult.result as string;

  bgDebug(`popup conversion: got ${html.length} chars from tab:${tabId}`);

  // 3. Convert via offscreen
  const markdown = await convertViaOffscreen(html, undefined, url);

  bgDebug(`popup conversion done for tab:${tabId} (${markdown.length} chars markdown)`);

  // 4. Pre-load overlay in content script (view stays on HUMAN)
  chrome.tabs.sendMessage(tabId, {
    type: 'MARKDOWN_READY',
    markdown,
  });

  return markdown;
}
