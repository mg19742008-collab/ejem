import { supabase, getSessionId } from "./supabase";
import type { ModuleType, OSINTResult, SearchHistoryEntry } from "../types/osint";

export async function saveSearch(type: ModuleType, query: string, result: OSINTResult) {
  try {
    const session_id = getSessionId();
    const { error } = await supabase
      .from("search_history")
      .insert({ session_id, type, query, result });
    if (error) {
      console.error("Error saving search:", error);
    }
  } catch (err) {
    console.error("Exception saving search:", err);
  }
}

export async function getHistory(): Promise<SearchHistoryEntry[]> {
  try {
    const session_id = getSessionId();
    const { data, error } = await supabase
      .from("search_history")
      .select("*")
      .eq("session_id", session_id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      console.error("Error getting history:", error);
      return [];
    }
    return (data ?? []) as SearchHistoryEntry[];
  } catch (err) {
    console.error("Exception getting history:", err);
    return [];
  }
}

export async function clearHistory() {
  try {
    const session_id = getSessionId();
    const { error } = await supabase.from("search_history").delete().eq("session_id", session_id);
    if (error) {
      console.error("Error clearing history:", error);
    }
  } catch (err) {
    console.error("Exception clearing history:", err);
  }
}

export async function deleteSearch(id: string) {
  try {
    const { error } = await supabase.from("search_history").delete().eq("id", id);
    if (error) {
      console.error("Error deleting search:", error);
    }
  } catch (err) {
    console.error("Exception deleting search:", err);
  }
}
