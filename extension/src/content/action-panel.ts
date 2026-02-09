import type { ExtractorId } from '@/types/extractor';

export type OnExtractorChange = (id: ExtractorId) => void;
export type OnCopy = () => void;

interface ExtractorTab {
  id: ExtractorId;
  label: string;
}

const extractorTabs: ExtractorTab[] = [
  { id: 'defuddle', label: 'Defuddle' },
  { id: 'readability', label: 'Readability' },
];

const ACTIVE_BG = '#30363d';
const INACTIVE_BG = 'transparent';
const ACTIVE_COLOR = '#e6edf3';
const INACTIVE_COLOR = '#7d8590';

export function createActionPanel(
  onExtractorChange: OnExtractorChange,
  onCopy: OnCopy,
): HTMLElement {
  const panel = document.createElement('div');
  panel.id = 'llm-see-action-panel';
  Object.assign(panel.style, {
    position: 'fixed',
    top: '12px',
    right: '16px',
    zIndex: '2147483647',
    display: 'none',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '13px',
    fontWeight: '500',
  });

  // Extractor pill switcher
  const pillGroup = document.createElement('div');
  Object.assign(pillGroup.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    backgroundColor: '#21262d',
    border: '1px solid #3d444d',
    borderRadius: '6px',
    padding: '2px',
  });

  const tabButtons: HTMLElement[] = [];

  for (const tab of extractorTabs) {
    const btn = document.createElement('button');
    btn.textContent = tab.label;
    btn.dataset.extractorId = tab.id;
    Object.assign(btn.style, {
      padding: '4px 12px',
      border: 'none',
      borderRadius: '4px',
      backgroundColor: INACTIVE_BG,
      color: INACTIVE_COLOR,
      fontFamily: 'inherit',
      fontSize: 'inherit',
      fontWeight: 'inherit',
      cursor: 'pointer',
      transition: 'background-color 0.15s ease, color 0.15s ease',
    });

    btn.addEventListener('click', () => {
      setActiveTab(btn);
      onExtractorChange(tab.id);
    });

    btn.addEventListener('mouseenter', () => {
      if (btn.dataset.active !== 'true') {
        btn.style.color = ACTIVE_COLOR;
      }
    });
    btn.addEventListener('mouseleave', () => {
      if (btn.dataset.active !== 'true') {
        btn.style.color = INACTIVE_COLOR;
      }
    });

    tabButtons.push(btn);
    pillGroup.appendChild(btn);
  }

  function setActiveTab(active: HTMLElement) {
    for (const btn of tabButtons) {
      const isActive = btn === active;
      btn.dataset.active = String(isActive);
      btn.style.backgroundColor = isActive ? ACTIVE_BG : INACTIVE_BG;
      btn.style.color = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;
    }
  }

  // Set default active tab
  setActiveTab(tabButtons[0]);

  // Copy button
  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copy';
  Object.assign(copyBtn.style, {
    padding: '6px 14px',
    border: '1px solid #3d444d',
    borderRadius: '6px',
    backgroundColor: '#21262d',
    color: '#e6edf3',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    fontWeight: 'inherit',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  });

  copyBtn.addEventListener('mouseenter', () => {
    copyBtn.style.backgroundColor = '#30363d';
  });
  copyBtn.addEventListener('mouseleave', () => {
    copyBtn.style.backgroundColor = '#21262d';
  });

  copyBtn.addEventListener('click', () => {
    onCopy();
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.textContent = 'Copy';
    }, 1500);
  });

  panel.appendChild(pillGroup);
  panel.appendChild(copyBtn);

  return panel;
}

export function showActionPanel(panel: HTMLElement): void {
  panel.style.display = 'flex';
}

export function hideActionPanel(panel: HTMLElement): void {
  panel.style.display = 'none';
}
