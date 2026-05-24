import { useEffect, useState } from "react";
import { X, Globe, User, Mail, MessageSquare, Phone, Trash2, Clock, ArrowRight, Send, Image } from "lucide-react";
import { getHistory, clearHistory } from "../lib/history";
import type { SearchHistoryEntry, ModuleType } from "../types/osint";

const icons: Record<ModuleType, React.ReactNode> = {
  ip: <Globe size={12} />,
  username: <User size={12} />,
  email: <Mail size={12} />,
  discord: <MessageSquare size={12} />,
  phone: <Phone size={12} />,
  telegram: <Send size={12} />,
  image: <Image size={12} />,
};

const labels: Record<ModuleType, string> = {
  ip: "IP",
  username: "Username",
  email: "Email",
  discord: "Discord",
  phone: "Phone",
  telegram: "Telegram",
  image: "Image",
};

interface Props {
  onClose: () => void;
  onSelect: (type: ModuleType, query: string) => void;
}

export default function HistoryPanel({ onClose, onSelect }: Props) {
  const [entries, setEntries] = useState<SearchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory().then(h => { setEntries(h); setLoading(false); });
  }, []);

  const handleClear = async () => {
    await clearHistory();
    setEntries([]);
  };

  return (
    <div className="w-64 flex-shrink-0 bg-[#0a0a0a] border-l border-[#1a1a1a] flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2 text-gray-300 text-sm font-medium">
          <Clock size={14} className="text-gray-500" />
          History
        </div>
        <div className="flex items-center gap-1">
          {entries.length > 0 && (
            <button
              onClick={handleClear}
              title="Clear history"
              className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-[#1a1a1a] transition-colors"
            >
              <Trash2 size={12} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-[#1a1a1a] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-24 text-gray-600 text-xs">Loading...</div>
        )}

        {!loading && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-600">
            <Clock size={20} className="mb-2 opacity-30" />
            <span className="text-xs">No searches yet</span>
          </div>
        )}

        {entries.map((entry, idx) => (
          <button
            key={entry.id}
            onClick={() => onSelect(entry.type, entry.query)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#111] transition-colors border-b border-[#0f0f0f] group text-left"
            style={{ animationDelay: `${idx * 30}ms` }}
          >
            <span className="text-gray-500">{icons[entry.type]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-white truncate">{entry.query}</span>
              </div>
              <div className="text-[10px] text-gray-600 mt-0.5">
                {labels[entry.type]} · {new Date(entry.created_at).toLocaleDateString()}
              </div>
            </div>
            <ArrowRight size={12} className="text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
}
