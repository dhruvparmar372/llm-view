import { createTogglePill } from './toggle-pill';
import type { ViewMode } from './toggle-pill';
import { createMachineOverlay, setOverlayContent, showOverlay, hideOverlay } from './machine-view';

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

  // Create overlay (hidden) and toggle pill
  const overlay = createMachineOverlay();
  const toggleHost = createTogglePill(handleToggle);

  // Append to <html> to avoid interfering with <body> management
  document.documentElement.appendChild(overlay);
  document.documentElement.appendChild(toggleHost);

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

  function handleToggle(mode: ViewMode): void {
    if (mode === currentMode) return;
    currentMode = mode;
    debug(`[content] toggle → ${mode}`);

    if (mode === 'machine') {
      setOverlayContent(overlay, 'Converting page to markdown...');
      showOverlay(overlay);

      // Send current page HTML for conversion
      const html = document.body.innerHTML;
      debug(`[content] sending HTML for conversion (${html.length} chars)`);
      chrome.runtime.sendMessage({
        type: 'CONVERT_PAGE',
        html,
      });
    } else {
      hideOverlay(overlay);
    }
  }
}
