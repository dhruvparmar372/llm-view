# LLM See

A Chrome extension that toggles any webpage into clean, LLM-friendly markdown. One click gives you a distraction-free view of the page content, ready to copy and paste into any LLM chat.

<!-- TODO: embed short demo video -->
<!-- <video src="..." /> -->

## Install

<!-- TODO: Chrome Web Store link -->
<!-- [Install from the Chrome Web Store](https://chrome.google.com/webstore/detail/...) -->

**Manual install (development):**

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/...  # TODO: add repo URL
   cd llm-see
   npm install
   ```
2. Build the extension:
   ```bash
   npm run build
   ```
3. Open `chrome://extensions` in Chrome, enable **Developer mode**, click **Load unpacked**, and select the `dist/` folder.

## Architecture

The extension follows Chrome Manifest V3 conventions and is split into three isolated runtime contexts that communicate via message passing:

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────────────┐
│   Content    │         │    Background     │         │     Offscreen       │
│   Script     │         │  Service Worker   │         │     Document        │
│              │         │                   │         │                     │
│  Toggle pill │─ CONVERT_PAGE (html) ──────>│         │                     │
│  + overlay   │         │                   │─ CONVERT_HTML (html) ────────>│
│              │         │                   │         │  DOMParser + strip  │
│              │         │                   │<── markdown ──────────────────│
│              │<─ MARKDOWN_READY ───────────│         │  Turndown convert   │
│  Display md  │         │                   │         │                     │
└─────────────┘         └──────────────────┘         └─────────────────────┘
    (tab)                 (extension process)            (hidden DOM context)
```

### Content Script

Injected into the active tab when the user clicks the extension icon. It creates two UI elements appended to `document.documentElement` (avoiding pages that replace `document.body`):

- **Toggle pill** -- a fixed-position HUMAN / MACHINE switch at the bottom center of the page, rendered inside a closed Shadow DOM so host-page styles cannot interfere.
- **Machine view overlay** -- a full-screen dark overlay that displays the converted markdown and provides a one-click copy button.

When the user switches to MACHINE mode the content script sends the page's `innerHTML` to the background service worker and waits for the converted markdown to come back.

### Background Service Worker

The central coordinator. It listens for two things:

1. **Extension icon clicks** -- injects the content script into the current tab via `chrome.scripting.executeScript`.
2. **`CONVERT_PAGE` messages** from the content script -- ensures the offscreen document exists (creating it on-demand as a singleton), forwards the raw HTML to it, and relays the resulting markdown back to the originating tab.

It also maintains a circular debug log (up to 10 000 entries) that any component can write to via `DEBUG_LOG` messages.

### Offscreen Document

Chrome Manifest V3 service workers have no DOM access, so HTML parsing and conversion happen in a dedicated offscreen document. It receives raw HTML and runs it through a multi-step pipeline:

1. **Parse** the HTML string with `DOMParser`.
2. **Strip** scripts, styles, iframes, SVGs, canvas elements, hidden elements (detected by attribute, inline style, and common CSS class heuristics), and ad containers.
3. **Convert** the cleaned DOM to markdown using [Turndown](https://github.com/mixmark-io/turndown) with custom rules for headings, code blocks, buttons, and images.

The resulting markdown string is sent back to the background worker, which forwards it to the content script for display.

### Debug Log

All components can emit `DEBUG_LOG` messages via a lightweight `debug()` helper. The background service worker collects these into a circular buffer capped at 10 000 entries, each stamped with a timestamp and source label. The full log can be dumped at any time by calling `surfaceDebugLogs()` in the service worker console. This was built specifically for LLM-assisted debugging -- when something goes wrong, the log dump can be pasted directly into an LLM conversation to help root-cause issues and generate fixes without needing to manually reproduce or step through the problem.
