import { Send, User, Hash, AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";
import type { TelegramResult } from "../../types/osint";

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-sm text-white ${mono ? "font-mono text-gray-300" : ""}`}>{value || "—"}</div>
    </div>
  );
}

export default function TelegramResultView({ data }: { data: TelegramResult }) {
  const displayName = data.first_name
    ? [data.first_name, data.last_name].filter(Boolean).join(" ")
    : data.title || data.query;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-[#131313] border border-[#1a1a1a] rounded-lg">
        <div className="w-12 h-12 rounded-lg bg-white text-black flex items-center justify-center flex-shrink-0">
          {data.photo_url ? (
            <img src={data.photo_url} alt={displayName} className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <Send size={22} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xl font-bold text-white font-mono">
            {data.found ? `@${data.username || data.query}` : data.query}
          </div>
          <div className="text-sm text-gray-500">{displayName}</div>
        </div>
        <div className="flex items-center gap-2">
          {data.is_verified && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white text-black text-[10px] font-bold uppercase tracking-wider">
              <CheckCircle size={10} /> Verified
            </span>
          )}
          {data.is_scam && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider">
              <AlertTriangle size={10} /> Scam
            </span>
          )}
          {data.is_fake && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-wider">
              <AlertTriangle size={10} /> Fake
            </span>
          )}
          <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
            data.found ? "bg-white text-black" : "bg-[#1a1a1a] text-gray-500"
          }`}>
            {data.found ? "Found" : "Not Found"}
          </div>
        </div>
      </div>

      {/* Not Found */}
      {!data.found && (
        <div className="flex items-start gap-3 p-4 bg-[#131313] border border-[#222] rounded-lg text-sm text-gray-400">
          <XCircle size={16} className="flex-shrink-0 text-red-500 mt-0.5" />
          <span>The username <span className="text-white font-mono">@{data.query.replace(/^@/, "")}</span> was not found on Telegram.</span>
        </div>
      )}

      {/* Info Grid */}
      {data.found && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-[#131313] border border-[#1a1a1a] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4 text-gray-400">
              <Hash size={12} />
              <span className="text-xs uppercase tracking-widest">Identity</span>
            </div>
            <div className="space-y-3">
              <Field label="Telegram ID" value={String(data.id ?? "")} mono />
              <Field label="Username" value={data.username ? `@${data.username}` : ""} mono />
              <Field label="Display Name" value={displayName} />
            </div>
          </div>

          <div className="bg-[#131313] border border-[#1a1a1a] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4 text-gray-400">
              <User size={12} />
              <span className="text-xs uppercase tracking-widest">Account</span>
            </div>
            <div className="space-y-3">
              <Field label="Type" value={data.type ? capitalize(data.type) : ""} />
              {data.member_count != null && (
                <Field label="Members" value={data.member_count.toLocaleString()} />
              )}
              <Field label="Verified" value={data.is_verified ? "Yes" : "No"} />
              <Field label="Scam" value={data.is_scam ? "Yes" : "No"} />
            </div>
          </div>

          <div className="bg-[#131313] border border-[#1a1a1a] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4 text-gray-400">
              <Info size={12} />
              <span className="text-xs uppercase tracking-widest">Details</span>
            </div>
            <div className="space-y-3">
              {data.description && (
                <Field label="Description" value={data.description} />
              )}
              {data.found && (
                <div className="pt-2">
                  <a
                    href={`https://t.me/${data.username || data.query.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-white hover:text-gray-300 transition-colors bg-[#1a1a1a] px-3 py-1.5 rounded-lg"
                  >
                    Open on Telegram <Send size={10} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Note */}
      {data.note && (
        <div className="flex items-start gap-3 p-4 bg-[#131313] border border-[#222] rounded-lg text-sm text-gray-400">
          <AlertTriangle size={16} className="flex-shrink-0 text-gray-500 mt-0.5" />
          <span>{data.note}</span>
        </div>
      )}
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
