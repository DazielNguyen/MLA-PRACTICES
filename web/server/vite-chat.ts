import type { Plugin } from 'vite';
import { Readable } from 'node:stream';
import { createChatHandler } from './chat.ts';

export function chatDevPlugin(env: Record<string, string>): Plugin {
  const handler = createChatHandler(() => env);
  return {
    name: 'local-study-assistant',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res) => {
        const abort = new AbortController();
        res.on('close', () => { if (!res.writableEnded) abort.abort(); });
        try {
          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(',') : value);
          const body = req.method === 'POST' ? Readable.toWeb(req) as ReadableStream<Uint8Array> : undefined;
          const request = new Request(`http://${req.headers.host}/api/chat`, { method: req.method, headers, body, signal: abort.signal, ...(body ? { duplex: 'half' } : {}) });
          const response = await handler(request);
          res.writeHead(response.status, Object.fromEntries(response.headers));
          if (response.body) {
            const reader = response.body.getReader();
            try { while (!abort.signal.aborted) { const { done, value } = await reader.read(); if (done) break; res.write(value); } }
            finally { await reader.cancel(); reader.releaseLock(); }
          }
          res.end();
        } catch { if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Chưa kết nối được trợ lý trên máy.' })); }
      });
    },
  };
}
