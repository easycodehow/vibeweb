import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL  = 'https://cwphhxahdjsxagadoywg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cGhoeGFoZGpzeGFnYWRveXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NzgxNzUsImV4cCI6MjA4OTA1NDE3NX0.zcKp3UH4Ebyt-yKYci6DfYFyzJerHZAAWKGlfpxX4rU';
const STORAGE_KEY   = 'sb-cwphhxahdjsxagadoywg-auth-token';

// 로그인 유지로 저장된 세션이 있으면 sessionStorage로 복원
const remembered = localStorage.getItem(STORAGE_KEY);
if (remembered && !sessionStorage.getItem(STORAGE_KEY)) {
  sessionStorage.setItem(STORAGE_KEY, remembered);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: window.sessionStorage,
    persistSession: true,
  }
});

// 로그아웃 시 localStorage 세션도 정리
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    localStorage.removeItem(STORAGE_KEY);
  }
});
