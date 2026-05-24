import { getFunctionUrl } from "./supabase";
import type { IPResult, UsernameResult, EmailResult, DiscordResult, PhoneResult, TelegramResult, ImageGeoResult, ModuleType } from "../types/osint";

const headers = {
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

async function fetchFn<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export function lookupIP(ip: string): Promise<IPResult> {
  return fetchFn<IPResult>(`${getFunctionUrl("osint-ip")}?ip=${encodeURIComponent(ip)}`);
}

export function lookupUsername(username: string): Promise<UsernameResult> {
  return fetchFn<UsernameResult>(`${getFunctionUrl("osint-username")}?username=${encodeURIComponent(username)}`);
}

export function lookupEmail(email: string): Promise<EmailResult> {
  return fetchFn<EmailResult>(`${getFunctionUrl("osint-email")}?email=${encodeURIComponent(email)}`);
}

export function lookupDiscord(id: string): Promise<DiscordResult> {
  return fetchFn<DiscordResult>(`${getFunctionUrl("osint-discord")}?id=${encodeURIComponent(id)}`);
}

export function lookupPhone(phone: string): Promise<PhoneResult> {
  return fetchFn<PhoneResult>(`${getFunctionUrl("osint-phone")}?phone=${encodeURIComponent(phone)}`);
}

export function lookupTelegram(username: string): Promise<TelegramResult> {
  const clean = username.replace(/^@/, "");
  return fetchFn<TelegramResult>(`${getFunctionUrl("osint-telegram")}?username=${encodeURIComponent(clean)}`);
}

export async function lookupImage(file: File): Promise<ImageGeoResult> {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`${getFunctionUrl("osint-image")}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as ImageGeoResult;
}

export interface PortScanResult {
  host: string;
  scanned: number;
  open: number;
  ports: { port: number; status: string; service: string; banner?: string }[];
  timestamp: string;
}

export async function scanPorts(host: string): Promise<PortScanResult> {
  return fetchFn<PortScanResult>(`${getFunctionUrl("osint-portscan")}?host=${encodeURIComponent(host)}`);
}

export function detectInputType(input: string): ModuleType {
  const trimmed = input.trim();
  // Discord ID: 17-19 digits
  if (/^\d{17,19}$/.test(trimmed)) return "discord";
  // Email: contains @ and domain
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "email";
  // Phone: starts with + or contains mostly digits with optional spaces/dashes/parentheses
  if (/^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/.test(trimmed.replace(/[\s\-\(\)]/g, ""))) {
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length >= 7 && digits.length <= 15) return "phone";
  }
  // IP: IPv4 or IPv6
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(trimmed)) return "ip";
  if (/^([0-9a-fA-F:]+)$/.test(trimmed) && trimmed.includes(":")) return "ip";
  return "username";
}
