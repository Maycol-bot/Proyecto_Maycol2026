import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_API_KEY;   // ← cambiado aquí

console.log("URL:", supabaseUrl);
console.log("Key cargada:", supabaseAnonKey ? "✅ Sí" : "❌ No");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);