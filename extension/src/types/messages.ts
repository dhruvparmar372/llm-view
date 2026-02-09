export interface ConvertHtmlMessage {
  type: 'CONVERT_HTML';
  target: 'offscreen';
  html: string;
}

export interface MarkdownReadyMessage {
  type: 'MARKDOWN_READY';
  markdown: string;
}

export interface ConvertPageMessage {
  type: 'CONVERT_PAGE';
  html: string;
}

export interface DebugLogMessage {
  type: 'DEBUG_LOG';
  message: string;
}

export type LlmSeeMessage =
  | ConvertHtmlMessage
  | MarkdownReadyMessage
  | ConvertPageMessage
  | DebugLogMessage;
