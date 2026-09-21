import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests',fullyParallel:false,workers:1,timeout:30000,
  use:{baseURL:'http://127.0.0.1:5175',channel:'chrome',headless:true,viewport:{width:1440,height:1050},trace:'retain-on-failure'},
  webServer:[
    {command:'npm run dev -- --port 5175 --strictPort',url:'http://127.0.0.1:5175',reuseExistingServer:false,timeout:30000,env:{VITE_SUPABASE_URL:'',VITE_SUPABASE_PUBLISHABLE_KEY:'',VITE_SUPABASE_ANON_KEY:''}},
    {command:'npm run dev -- --port 5174 --strictPort',url:'http://127.0.0.1:5174',reuseExistingServer:!process.env.CI,timeout:30000,env:{VITE_SUPABASE_URL:'https://ml-practice-test.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test_only'}}
  ],
  reporter:[['list']],
});
