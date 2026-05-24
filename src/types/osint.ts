export type ModuleType = "ip" | "username" | "email" | "discord" | "phone" | "telegram" | "image";

export interface IPResult {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  regionCode: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
}

export interface SocialProfile {
  platform: string;
  icon: string;
  url: string;
  username: string;
}

export interface GithubData {
  login: string;
  name: string | null;
  bio: string | null;
  avatar: string;
  followers: number;
  repos: number;
  created?: string;
  url: string;
  exists?: boolean;
  location?: string | null;
  company?: string | null;
  blog?: string | null;
}

export interface UsernameResult {
  username: string;
  profiles: SocialProfile[];
  github: GithubData | null;
}

export interface EmailResult {
  email: string;
  localPart: string;
  domain: string;
  cleanUsername: string;
  provider: string;
  mxRecords: string[];
  profiles: SocialProfile[];
  github: GithubData | null;
}

export interface DiscordResult {
  id: string;
  username?: string;
  discriminator?: string;
  globalName?: string | null;
  avatar: string;
  avatarHash?: string | null;
  banner?: string | null;
  bannerColor?: string | null;
  accentColor?: number | null;
  bot?: boolean;
  publicFlags?: number;
  createdAt: string;
  createdAtFormatted: string;
  apiAvailable: boolean;
  note?: string;
}

export interface PhoneResult {
  phone: string;
  formatted: string;
  country: string;
  countryCode: string;
  carrier: string;
  lineType: string;
  valid: boolean;
  region: string;
  timezone: string;
  apiAvailable?: boolean;
}

export interface TelegramResult {
  query: string;
  found: boolean;
  id?: string | number;
  username?: string;
  first_name?: string;
  last_name?: string;
  type?: string;
  title?: string;
  description?: string;
  member_count?: number;
  is_verified?: boolean;
  is_scam?: boolean;
  is_fake?: boolean;
  photo_url?: string;
  note?: string;
}

export interface ImageGeoResult {
  filename: string;
  hasGPS: boolean;
  lat?: number;
  lon?: number;
  altitude?: number;
  country?: string;
  city?: string;
  region?: string;
  camera?: string;
  dateTaken?: string;
  software?: string;
  note?: string;
}

export type OSINTResult = IPResult | UsernameResult | EmailResult | DiscordResult | PhoneResult | TelegramResult | ImageGeoResult;

export interface SearchState {
  type: ModuleType;
  query: string;
  loading: boolean;
  result: OSINTResult | null;
  error: string | null;
}

export interface SearchHistoryEntry {
  id: string;
  session_id: string;
  query: string;
  type: ModuleType;
  result: OSINTResult;
  created_at: string;
}
