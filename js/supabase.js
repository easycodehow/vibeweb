import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://cwphhxahdjsxagadoywg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cGhoeGFoZGpzeGFnYWRveXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NzgxNzUsImV4cCI6MjA4OTA1NDE3NX0.zcKp3UH4Ebyt-yKYci6DfYFyzJerHZAAWKGlfpxX4rU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
