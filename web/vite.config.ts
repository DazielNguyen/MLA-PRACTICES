import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { chatDevPlugin } from './server/vite-chat.ts';
export default defineConfig(({mode, command}) => {
  const personal = mode === 'personal';
  if (personal && command !== 'serve') throw new Error('Bộ cá nhân chỉ chạy local bằng npm run study; không dùng để build production.');
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  if (Object.entries(env).some(([name,value]) => value && (/OPENAI.*KEY|AI_CHAT_ACCESS_CODE/.test(name) || value.startsWith('sk-')))) throw new Error('Không đặt API key OpenAI hoặc mã truy cập bot trong biến VITE_. Dùng OPENAI_API_KEY và AI_CHAT_ACCESS_CODE phía server.');
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (Boolean(url) !== Boolean(key)) throw new Error('Cần khai báo cả VITE_SUPABASE_URL và VITE_SUPABASE_PUBLISHABLE_KEY.');
  if (key) {
    let secret = key.startsWith('sb_secret_');
    if (key.split('.').length === 3) {
      try { secret ||= JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'service_role'; } catch { /* Supabase will validate the key. */ }
    }
    if (secret) throw new Error('Không đặt secret key hoặc service_role key trong VITE_. Chỉ dùng publishable key hoặc anon key.');
  }
  return {
    plugins: [react(), ...(command === 'serve' ? [chatDevPlugin(loadEnv(mode, process.cwd(), ''))] : [])],
    resolve: { alias: { '@study-bank': fileURLToPath(new URL('./src/data/questions.json', import.meta.url)) } },
    // Personal mode uses the published bank and keeps progress on this browser.
    ...(personal ? { define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(''),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(''),
    }, server: { host: '127.0.0.1' } } : {}),
  };
});
