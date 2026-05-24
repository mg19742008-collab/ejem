import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getSessionId(): string {
  let sid = localStorage.getItem("osint_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem("osint_session_id", sid);
  }
  return sid;
}

export function getFunctionUrl(name: string): string {
  return `${supabaseUrl}/functions/v1/${name}`;
}
