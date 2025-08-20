import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jjsgcsalrxypwhnqtxkz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqc2djc2Fscnh5cHdobnF0eGt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTE4MTksImV4cCI6MjA3MTEyNzgxOX0.1yiYw48MzZ5Tikkcw6dyKZQ-YgSmf-D8WCh9GQ9cwsQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);