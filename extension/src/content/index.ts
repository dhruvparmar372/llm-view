import { createTogglePill } from './toggle-pill';
import type { ViewMode } from './toggle-pill';
import { createMachineOverlay, setOverlayContent, showOverlay, hideOverlay } from './machine-view';
import { createActionPanel, showActionPanel, hideActionPanel } from './action-panel';
import type { ExtractorId } from '@/types/extractor';

function debug(message: string): void {
  chrome.runtime.sendMessage({ type: 'DEBUG_LOG', message });
}

// Idempotency guard
if (!document.getElementById('llm-see-toggle-host')) {
  init();
}

function init() {
  debug('[content] injected');
  let currentMode: ViewMode = 'human';
  let currentExtractor: ExtractorId = 'defuddle';

  // Create overlay (hidden) and toggle pill
  const overlay = createMachineOverlay();
  const toggleHost = createTogglePill(handleToggle);

  // Create action panel
  const actionPanel = createActionPanel(handleExtractorChange, handleCopy);

  // Append to <html> to avoid interfering with <body> management
  document.documentElement.appendChild(overlay);
  document.documentElement.appendChild(toggleHost);
  document.documentElement.appendChild(actionPanel);

  // Listen for MARKDOWN_READY from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'MARKDOWN_READY' && message.markdown) {
      debug(`[content] markdown received (${message.markdown.length} chars)`);
      setOverlayContent(overlay, message.markdown as string);

      if (currentMode === 'machine') {
        showOverlay(overlay);
      }
    }
  });

  function sendConvertRequest(): void {
    const html = document.body.innerHTML;
    debug(`[content] sending HTML for conversion (${html.length} chars, extractor: ${currentExtractor})`);
    chrome.runtime.sendMessage({
      type: 'CONVERT_PAGE',
      html,
      extractor: currentExtractor,
      url: window.location.href,
    });
  }

  function handleExtractorChange(id: ExtractorId): void {
    if (id === currentExtractor) return;
    currentExtractor = id;
    debug(`[content] extractor changed → ${id}`);
    setOverlayContent(overlay, 'Converting page to markdown...');
    sendConvertRequest();
  }

  function handleCopy(): void {
    const content = overlay.textContent || '';
    navigator.clipboard.writeText(content);
  }

  function handleToggle(mode: ViewMode): void {
    if (mode === currentMode) return;
    currentMode = mode;
    debug(`[content] toggle → ${mode}`);

    if (mode === 'machine') {
      setOverlayContent(overlay, 'Converting page to markdown...');
      showOverlay(overlay);
      showActionPanel(actionPanel);
      sendConvertRequest();
    } else {
      hideOverlay(overlay);
      hideActionPanel(actionPanel);
    }
  }
}
