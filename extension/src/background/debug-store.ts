const MAX_LOGS = 10_000;

interface DebugEntry {
  timestamp: number;
  source: string;
  message: string;
}

const logs: DebugEntry[] = [];

export function pushLog(source: string, message: string): void {
  logs.push({ timestamp: Date.now(), source, message });
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }
}

export function surfaceDebugLogs(): void {
  console.group(`[llm-view] Debug logs (${logs.length} entries)`);
  for (const entry of logs) {
    const time = new Date(entry.timestamp).toISOString().slice(11, 23);
    console.log(`${time} [${entry.source}] ${entry.message}`);
  }
  console.groupEnd();
}

(globalThis as any).surfaceDebugLogs = surfaceDebugLogs;
