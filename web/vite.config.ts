import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
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
  return { plugins: [react()] };
});
