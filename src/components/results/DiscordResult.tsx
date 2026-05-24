import { MessageSquare, Calendar, Hash, Info, AlertTriangle, Award } from "lucide-react";
import type { DiscordResult } from "../../types/osint";

const DISCORD_FLAGS: Record<number, string> = {
  1: "Discord Staff",
  2: "Discord Partner",
  4: "HypeSquad Events",
  8: "Bug Hunter L1",
  64: "HypeSquad Bravery",
  128: "HypeSquad Brilliance",
  256: "HypeSquad Balance",
  512: "Early Supporter",
  16384: "Bug Hunter L2",
  131072: "Bot Developer",
  4194304: "Active Developer",
};

function getBadges(flags: number): string[] {
  return Object.entries(DISCORD_FLAGS).filter(([bit]) => (flags & parseInt(bit)) !== 0).map(([, label]) => label);
}

function accentToHex(color: number | null | undefined): string | null {
  if (!color) return null;
  return `#${color.toString(16).padStart(6, "0")}`;
}

export default function DiscordResultView({ data }: { data: DiscordResult }) {
  const badges = getBadges(data.publicFlags ?? 0);
  const accentHex = accentToHex(data.accentColor);
  const displayName = data.globalName || data.username;
  const tag = data.username
    ? data.discriminator && data.discriminator !== "0"
      ? `${data.username}#${data.discriminator}`
      : `@${data.username}`
    : null;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-[#131313] border border-[#1a1a1a] rounded-lg">
        <div className="w-12 h-12 rounded-lg bg-white text-black flex items-center justify-center flex-shrink-0">
          <MessageSquare size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xl font-bold text-white font-mono">{data.id}</div>
          <div className="text-sm text-gray-500">Discord Snowflake ID</div>
        </div>
        <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
          data.apiAvailable
            ? "bg-white text-black"
            : "bg-[#1a1a1a] text-gray-400"
        }`}>
          {data.apiAvailable ? "Full Profile" : "Snowflake Only"}
        </div>
      </div>

      {/* Warning */}
      {!data.apiAvailable && data.note && (
        <div className="flex items-start gap-3 p-4 bg-[#131313] border border-[#222] rounded-lg text-sm text-gray-400">
          <AlertTriangle size={16} className="flex-shrink-0 text-gray-500 mt-0.5" />
          <span>{data.note}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-[#131313] border border-[#1a1a1a] rounded-lg overflow-hidden">
        {/* Banner */}
        {data.banner ? (
          <div className="h-24 overflow-hidden">
            <img src={data.banner} alt="banner" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div
            className="h-20"
            style={{
              background: accentHex
                ? `linear-gradient(135deg, ${accentHex}30, ${accentHex}10)`
                : "linear-gradient(135deg, #1a1a1a, #0f0f0f)"
            }}
          />
        )}

        {/* Profile */}
        <div className="px-5 pb-5">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <div className="relative">
              <img
                src={data.avatar}
                alt="avatar"
                className="w-20 h-20 rounded-xl border-4 border-[#131313] object-cover"
              />
              {data.bot && (
                <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-md bg-white text-black text-[9px] font-bold">
                  BOT
                </span>
              )}
            </div>
            <div className="pb-2">
              {displayName && <div className="text-lg font-bold text-white">{displayName}</div>}
              {tag && <div className="text-sm text-gray-500 font-mono">{tag}</div>}
            </div>
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {badges.map(b => (
                <span key={b} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#1a1a1a] text-gray-300 text-[10px]">
                  <Award size={10} />
                  {b}
                </span>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-[9px] text-gray-600 uppercase tracking-widest flex items-center gap-1 mb-1">
                <Hash size={9} /> Snowflake ID
              </div>
              <div className="font-mono text-sm text-white">{data.id}</div>
            </div>
            <div>
              <div className="text-[9px] text-gray-600 uppercase tracking-widest flex items-center gap-1 mb-1">
                <Calendar size={9} /> Created
              </div>
              <div className="text-sm text-white">{data.createdAtFormatted}</div>
              <div className="text-[10px] text-gray-600 font-mono">{new Date(data.createdAt).toLocaleDateString()}</div>
            </div>
            {accentHex && (
              <div>
                <div className="text-[9px] text-gray-600 uppercase tracking-widest flex items-center gap-1 mb-1">
                  <Info size={8} /> Accent
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-[#333]" style={{ background: accentHex }} />
                  <span className="font-mono text-sm text-white">{accentHex}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Snowflake Breakdown */}
      <div className="bg-[#131313] border border-[#1a1a1a] rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4 text-gray-400">
          <Info size={12} />
          <span className="text-xs uppercase tracking-widest">Snowflake Breakdown</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Discord Epoch</div>
            <div className="font-mono text-xs text-gray-400">Jan 1, 2015</div>
          </div>
          <div>
            <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Timestamp</div>
            <div className="font-mono text-xs text-gray-400">{data.createdAt}</div>
          </div>
          <div>
            <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Account Age</div>
            <div className="font-mono text-xs text-gray-400">
              {Math.floor((Date.now() - new Date(data.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365))} years
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
