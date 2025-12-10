import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables first
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('⚠️ Supabase credentials not configured!');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in backend/.env file');
  console.error('Current values:', { 
    url: supabaseUrl ? 'Set' : 'Missing', 
    key: supabaseServiceKey ? 'Set' : 'Missing' 
  });
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

