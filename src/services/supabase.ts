import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://kxkabnahclcsitfkllvg.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4a2FibmFoY2xjc2l0ZmtsbHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMTE2MjksImV4cCI6MjEwMjc4NzYyOX0.OeC2Gm4tZbZ8fIUkTIq07zK1Cofm5Mt7ggd9clHRWxI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
