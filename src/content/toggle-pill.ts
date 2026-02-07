export type ViewMode = 'human' | 'machine';
export type OnToggle = (mode: ViewMode) => void;

export function createTogglePill(onToggle: OnToggle): HTMLElement {
  const host = document.createElement('div');
  host.id = 'llm-see-toggle-host';

  const shadow = host.attachShadow({ mode: 'closed' });

  const pill = document.createElement('div');
  Object.assign(pill.style, {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '2147483647',
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    background: '#1a1a2e',
    borderRadius: '24px',
    padding: '4px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    fontSize: '13px',
    fontWeight: '500',
    letterSpacing: '0.5px',
    userSelect: 'none',
    cursor: 'pointer',
  });

  const humanBtn = createButton('HUMAN');
  const machineBtn = createButton('MACHINE');
  setActive(humanBtn, machineBtn);

  humanBtn.addEventListener('click', () => {
    setActive(humanBtn, machineBtn);
    onToggle('human');
  });

  machineBtn.addEventListener('click', () => {
    setActive(machineBtn, humanBtn);
    onToggle('machine');
  });

  pill.appendChild(humanBtn);
  pill.appendChild(machineBtn);
  shadow.appendChild(pill);

  return host;
}

function createButton(label: string): HTMLElement {
  const btn = document.createElement('div');
  btn.textContent = label;
  Object.assign(btn.style, {
    padding: '8px 20px',
    borderRadius: '20px',
    transition: 'background-color 0.15s ease, color 0.15s ease',
    whiteSpace: 'nowrap',
  });
  return btn;
}

function setActive(active: HTMLElement, inactive: HTMLElement): void {
  Object.assign(active.style, {
    backgroundColor: '#ffffff',
    color: '#1a1a2e',
  });
  Object.assign(inactive.style, {
    backgroundColor: 'transparent',
    color: '#888888',
  });
}
