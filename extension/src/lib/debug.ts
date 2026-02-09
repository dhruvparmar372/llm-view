export function debug(message: string): void {
  chrome.runtime.sendMessage({ type: 'DEBUG_LOG', message });
}
