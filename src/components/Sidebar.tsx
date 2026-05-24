import { Globe, User, Mail, MessageSquare, Phone, History, Shield, Send, Image } from "lucide-react";
import type { ModuleType } from "../types/osint";

interface Props {
  active: ModuleType;
  onChange: (mod: ModuleType) => void;
  onHistoryToggle: () => void;
}

const modules: { id: ModuleType; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: "ip", label: "IP Address", desc: "Geolocate & analyze", icon: <Globe size={18} /> },
  { id: "username", label: "Username", desc: "Digital footprint", icon: <User size={18} /> },
  { id: "email", label: "Email", desc: "Domain analysis", icon: <Mail size={18} /> },
  { id: "discord", label: "Discord", desc: "Profile lookup", icon: <MessageSquare size={18} /> },
  { id: "phone", label: "Phone", desc: "Number lookup", icon: <Phone size={18} /> },
  { id: "telegram", label: "Telegram", desc: "Username to ID", icon: <Send size={18} /> },
  { id: "image", label: "Image", desc: "GPS from photo", icon: <Image size={18} /> },
];

export default function Sidebar({ active, onChange, onHistoryToggle }: Props) {
  return (
    <div className="w-56 flex-shrink-0 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col h-screen">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <Shield size={16} className="text-black" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide">OSINT<span className="text-gray-500">X</span></div>
            <div className="text-[9px] text-gray-600 uppercase tracking-widest">Intelligence Suite</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        <div className="text-[9px] text-gray-600 uppercase tracking-widest px-3 mb-2 font-medium">Intelligence Modules</div>
        {modules.map(mod => (
          <button
            key={mod.id}
            onClick={() => onChange(mod.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
              active === mod.id
                ? "bg-white text-black"
                : "text-gray-400 hover:bg-[#1a1a1a] hover:text-white"
            }`}
          >
            <span className={active === mod.id ? "text-black" : "text-gray-500 group-hover:text-gray-300"}>
              {mod.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className={`text-[13px] font-medium ${active === mod.id ? "text-black" : "text-gray-300 group-hover:text-white"}`}>
                {mod.label}
              </div>
              <div className={`text-[10px] truncate ${active === mod.id ? "text-gray-700" : "text-gray-600"}`}>
                {mod.desc}
              </div>
            </div>
            {active === mod.id && (
              <div className="w-1 h-4 rounded bg-black" />
            )}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-4 border-t border-[#1a1a1a] space-y-0.5">
        <button
          onClick={onHistoryToggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:bg-[#1a1a1a] hover:text-white transition-all"
        >
          <History size={16} />
          <span className="text-[13px]">History</span>
        </button>
        <div className="px-3 pt-3">
          <div className="text-[9px] text-gray-700">v1.0.0 · For educational use</div>
        </div>
      </div>
    </div>
  );
}
