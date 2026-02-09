export function createMachineOverlay(): HTMLElement {
  const overlay = document.createElement('div');
  overlay.id = 'llm-see-machine-overlay';

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

  // Copy button
  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copy';
  Object.assign(copyBtn.style, {
    position: 'fixed',
    top: '12px',
    right: '16px',
    zIndex: '2147483647',
    padding: '6px 14px',
    border: '1px solid #3d444d',
    borderRadius: '6px',
    backgroundColor: '#21262d',
    color: '#e6edf3',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'none',
  });

  copyBtn.addEventListener('mouseenter', () => {
    copyBtn.style.backgroundColor = '#30363d';
  });
  copyBtn.addEventListener('mouseleave', () => {
    copyBtn.style.backgroundColor = '#21262d';
  });

  copyBtn.addEventListener('click', async () => {
    const content = overlay.textContent || '';
    await navigator.clipboard.writeText(content);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
  });

  overlay.appendChild(copyBtn);
  return overlay;
}

export function setOverlayContent(overlay: HTMLElement, markdown: string): void {
  const copyBtn = overlay.querySelector('button');
  overlay.textContent = markdown;
  if (copyBtn) overlay.appendChild(copyBtn);
}

export function showOverlay(overlay: HTMLElement): void {
  overlay.style.display = 'block';
  const copyBtn = overlay.querySelector('button') as HTMLElement | null;
  if (copyBtn) copyBtn.style.display = 'block';
}

export function hideOverlay(overlay: HTMLElement): void {
  overlay.style.display = 'none';
  const copyBtn = overlay.querySelector('button') as HTMLElement | null;
  if (copyBtn) copyBtn.style.display = 'none';
}
