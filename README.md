# LLM View

A Chrome extension that toggles any webpage into clean, LLM-friendly markdown. One click converts the page and copies the markdown straight to your clipboard.

<video src="https://llmview.page/demo.mp4" autoplay loop muted playsinline width="100%"></video>

## Project Structure

```
llm-view/
├── extension/   # Chrome extension (Manifest V3)
└── website/     # Project website (Astro)
```

## Install

<!-- TODO: Chrome Web Store link -->
<!-- [Install from the Chrome Web Store](https://chrome.google.com/webstore/detail/...) -->

**Manual install (development):**

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/dhruvparmar372/llm-view
   cd llm-view/extension
   npm install
   ```
2. Build the extension:
   ```bash
   npm run build
   ```
3. Open `chrome://extensions` in Chrome, enable **Developer mode**, click **Load unpacked**, and select the `extension/dist/` folder.

## Development

If you're using [Claude Code](https://claude.ai/claude-code), run `/llmview:check` to typecheck and build any changed directories. It detects uncommitted changes in `extension/` or `website/`, runs the appropriate checks, and fixes any errors it finds.

## Architecture

The extension follows Chrome Manifest V3 conventions and is split into four isolated runtime contexts that communicate via message passing:

```
┌───────────┐  ┌─────────────┐         ┌──────────────────┐         ┌─────────────────────┐
│   Popup   │  │   Content    │         │    Background     │         │     Offscreen       │
│           │  │   Script     │         │  Service Worker   │         │     Document        │
│           │  │              │         │                   │         │                     │
│ START_CONVERSION ──────────────────>│                   │         │                     │
│           │  │              │         │── executeScript ─>│         │                     │
│           │  │              │         │  (inject + get    │         │                     │
│           │  │              │         │   page HTML/URL)  │─ CONVERT_HTML ──────────────>│
│           │  │              │         │                   │  (html, extractor, url)      │
│           │  │              │         │                   │         │  Extractor registry │
│           │  │              │         │                   │<── markdown ────────────────│
│           │  │              │<─ MARKDOWN_READY ───────────│         │  Turndown convert   │
│<── { markdown } ───────────────────│  (pre-load overlay) │         │                     │
│ Copy to   │  │              │         │                   │         │                     │
│ clipboard │  │  Toggle pill │─ CONVERT_PAGE ────────────>│         │                     │
│           │  │  Action panel│  (extractor switch)        │─ CONVERT_HTML ──────────────>│
│           │  │  + overlay   │         │                   │         │                     │
│           │  │              │<─ MARKDOWN_READY ───────────│         │                     │
└───────────┘  └─────────────┘         └──────────────────┘         └─────────────────────┘
  (popup)          (tab)                 (extension process)            (hidden DOM context)
```

There are two conversion paths:

1. **Popup flow (one-click)** -- Clicking the extension icon opens a small popup that sends `START_CONVERSION` to the background. The background injects the content script, grabs the page HTML, converts it, copies the markdown to the clipboard via the popup, and pre-loads the overlay in the content script. The page view stays untouched.
2. **Manual flow** -- The user clicks MACHINE on the toggle pill. The content script sends `CONVERT_PAGE` to the background, which converts and sends `MARKDOWN_READY` back. The user can also switch extractors in the action panel, which re-triggers conversion.

### Content Script

Injected into the active tab when the popup triggers conversion (or when the user manually toggles to MACHINE mode). It creates three UI elements appended to `document.documentElement` (avoiding pages that replace `document.body`):

- **Toggle pill** -- a fixed-position HUMAN / MACHINE switch at the bottom center of the page, rendered inside a closed Shadow DOM so host-page styles cannot interfere.
- **Action panel** -- a fixed top-right bar (visible in MACHINE mode) containing an extractor switcher and a copy button. The extractor switcher is a dark pill-style tab group that lets the user choose between content extractors (Defuddle, Readability, Postlight). Switching extractors re-sends the page HTML for conversion with the newly selected extractor.
- **Machine view overlay** -- a full-screen dark overlay that displays the converted markdown.

When the user switches to MACHINE mode the content script sends the page's `innerHTML`, the selected extractor ID, and the page URL to the background service worker and waits for the converted markdown to come back.

### Popup

A small dark-themed popup (320px) that opens when the user clicks the extension icon. On open it immediately sends `START_CONVERSION` to the background, shows a spinner while converting, and auto-copies the resulting markdown to the clipboard. The page view is never modified -- the popup handles everything without switching the page to machine view.

### Background Service Worker

The central coordinator. It handles two conversion paths:

1. **`START_CONVERSION` messages** from the popup -- injects the content script, grabs the page HTML and URL via `chrome.scripting.executeScript`, converts it through the offscreen document, pre-loads the overlay in the content script via `MARKDOWN_READY`, and returns the markdown to the popup for clipboard copy.
2. **`CONVERT_PAGE` messages** from the content script -- ensures the offscreen document exists (creating it on-demand as a singleton), forwards the raw HTML, extractor ID, and page URL to it, and relays the resulting markdown back to the originating tab. This path is used when the user manually switches extractors in the action panel.

It also maintains a circular debug log (up to 10 000 entries) that any component can write to via `DEBUG_LOG` messages.

### Offscreen Document

Chrome Manifest V3 service workers have no DOM access, so HTML parsing and conversion happen in a dedicated offscreen document. It receives raw HTML, an extractor ID, and the page URL, then runs it through an async pipeline:

1. **Sanitize** the HTML with DOMPurify.
2. **Parse** the sanitized string with `DOMParser`.
3. **Extract** readable content using the selected extractor from the extractor registry (see below). Extractors may be synchronous or asynchronous (e.g. Postlight).
4. **Convert** the extracted HTML to markdown using [Turndown](https://github.com/mixmark-io/turndown) with custom rules for tables, code blocks, buttons, and images.

The resulting markdown string is sent back to the background worker, which forwards it to the content script for display.

### Extractor Registry

Content extraction is handled by a pluggable registry of extractors (`src/offscreen/extractors/`). Each extractor implements a common `Extractor` interface that takes a parsed `Document` and an `ExtractorContext` (raw HTML + page URL), and returns an `ExtractorResult` (or `Promise<ExtractorResult>`) with content HTML plus optional metadata (title, author, site, published date). The registry maps `ExtractorId` strings to extractor instances and provides a `getExtractor(id)` lookup with a default fallback to Defuddle.

Built-in extractors:

- **Defuddle** (`defuddle/full`) -- the default. Good general-purpose extraction with strong metadata parsing.
- **Readability** (`@mozilla/readability`) -- Mozilla's reader-mode engine. Clones the document before parsing since Readability mutates the DOM.
- **Postlight** (`@postlight/parser`) -- Postlight's Mercury Parser. Uses an async API that takes raw HTML and the page URL for extraction.

To add a new extractor: add its ID to the `ExtractorId` union in `src/types/extractor.ts`, create an extractor file implementing the `Extractor` interface, register it in `src/offscreen/extractors/registry.ts`, and add a tab entry in `src/content/action-panel.ts`.

### Debug Log

All components can emit `DEBUG_LOG` messages via a lightweight `debug()` helper. The background service worker collects these into a circular buffer capped at 10 000 entries, each stamped with a timestamp and source label. The full log can be dumped at any time by calling `surfaceDebugLogs()` in the service worker console. This was built specifically for LLM-assisted debugging -- when something goes wrong, the log dump can be pasted directly into an LLM conversation to help root-cause issues and generate fixes without needing to manually reproduce or step through the problem.
