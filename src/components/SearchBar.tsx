import { useState } from "react";
import { Search, Zap, Loader2, ChevronDown } from "lucide-react";
import type { ModuleType } from "../types/osint";

interface Props {
  activeModule: ModuleType;
  onSearch: (query: string, autoDetect?: boolean) => void;
  loading: boolean;
}

const placeholders: Record<ModuleType, string> = {
  ip: "8.8.8.8",
  username: "johndoe",
  email: "user@gmail.com",
  discord: "123456789012345678",
  phone: "+1234567890",
  telegram: "@username",
  image: "Upload an image",
};

const moduleLabels: Record<ModuleType, string> = {
  ip: "IP",
  username: "USER",
  email: "EMAIL",
  discord: "DISCORD",
  phone: "PHONE",
  telegram: "TG",
  image: "IMG",
};

export default function SearchBar({ activeModule, onSearch, loading }: Props) {
  const [query, setQuery] = useState("");
  const [autoDetect, setAutoDetect] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    onSearch(query.trim(), autoDetect);
  };

  return (
    <div className="bg-[#0a0a0a] border-b border-[#1a1a1a] px-6 py-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        {/* Search Input */}
        <div className="flex-1 flex items-center gap-3 bg-[#131313] border border-[#222] rounded-lg px-4 py-2.5 focus-within:border-gray-600 transition-colors group">
          <Search size={16} className="text-gray-600 flex-shrink-0" />
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded ${
              autoDetect
                ? "bg-gray-200 text-black"
                : "bg-[#1a1a1a] text-gray-400 border border-[#222]"
            }`}>
              {autoDetect ? "AUTO" : moduleLabels[activeModule]}
            </span>
          </div>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={autoDetect ? "Enter any identifier..." : placeholders[activeModule]}
            className="flex-1 bg-transparent text-white placeholder-gray-600 text-sm outline-none font-mono"
            autoFocus
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="text-gray-600 hover:text-gray-400 transition-colors text-xs px-2 py-1 rounded hover:bg-[#1a1a1a]">
              clear
            </button>
          )}
        </div>

        {/* Auto Button */}
        <button
          type="button"
          onClick={() => setAutoDetect(v => !v)}
          title="Auto-detect input type"
          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
            autoDetect
              ? "bg-white text-black border-white"
              : "bg-[#131313] border-[#222] text-gray-500 hover:text-white hover:border-gray-600"
          }`}
        >
          <Zap size={14} />
          <span>AUTO</span>
        </button>

        {/* Run Button */}
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-white text-black font-semibold text-sm rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Scanning...</span>
            </>
          ) : (
            <>
              <span>RUN</span>
              <ChevronDown size={14} className="rotate-[-90deg]" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
