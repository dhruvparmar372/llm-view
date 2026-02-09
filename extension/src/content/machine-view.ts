export function createMachineOverlay(): HTMLElement {
  const overlay = document.createElement('div');
  overlay.id = 'llm-view-machine-overlay';

  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '2147483646',
    backgroundColor: '#0d1117',
    color: '#e6edf3',
    fontFamily: "'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, 'Liberation Mono', monospace",
    fontSize: '14px',
    lineHeight: '1.6',
    padding: '40px 60px 100px 60px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'none',
    margin: '0',
    boxSizing: 'border-box',
  });

  return overlay;
}

export function setOverlayContent(overlay: HTMLElement, markdown: string): void {
  overlay.textContent = markdown;
}

export function showOverlay(overlay: HTMLElement): void {
  overlay.style.display = 'block';
}

export function hideOverlay(overlay: HTMLElement): void {
  overlay.style.display = 'none';
}
