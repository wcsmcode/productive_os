// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Chỉ tạo 1 instance duy nhất và export nó ra
export const supabase = createClient(supabaseUrl, supabaseAnonKey)