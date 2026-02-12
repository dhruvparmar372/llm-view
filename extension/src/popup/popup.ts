const root = document.getElementById('root')!;

let markdown = '';

function showConverting(): void {
  root.innerHTML = `
    <div class="status">
      <div class="spinner"></div>
      <span>Converting page to markdown…</span>
    </div>`;
}

function showCopied(): void {
  root.innerHTML = `
    <div class="status">
      <span class="icon">&#10003;</span>
      <span>Copied to clipboard!</span>
    </div>
    <button class="copy-again" id="copy-again">Copy again</button>`;
  document.getElementById('copy-again')!.addEventListener('click', copyToClipboard);
}

function showManualCopy(): void {
  root.innerHTML = `
    <div class="status">
      <span class="icon">&#10003;</span>
      <span>Conversion complete</span>
    </div>
    <button class="copy-btn" id="copy-btn">Copy to Clipboard</button>`;
  document.getElementById('copy-btn')!.addEventListener('click', copyToClipboard);
}

function showError(msg: string): void {
  root.innerHTML = `
    <div class="status">
      <span class="icon error">&#10007;</span>
      <span class="error">${msg}</span>
    </div>`;
}

async function copyToClipboard(): Promise<void> {
  try {
    await navigator.clipboard.writeText(markdown);
    showCopied();
  } catch {
    showManualCopy();
  }
}

async function start(): Promise<void> {
  showConverting();

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    showError('No active tab found');
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'START_CONVERSION',
      tabId: tab.id,
    });

    if (response?.error) {
      showError(response.error);
      return;
    }

    markdown = response.markdown;
    await copyToClipboard();
  } catch (err) {
    showError('Conversion failed');
  }
}

document.addEventListener('DOMContentLoaded', start);
