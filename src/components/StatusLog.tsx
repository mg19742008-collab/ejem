import { useState } from "react";
import { Terminal, ChevronDown, ChevronUp } from "lucide-react";

export default function StatusLog({ logs }: { logs: string[] }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border-t border-[#1a1a1a] bg-[#0a0a0a]">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-400 transition-colors"
      >
        <Terminal size={12} />
        <span className="text-[10px] font-mono uppercase tracking-widest">Execution Log</span>
        <span className="ml-auto">{expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-3 max-h-28 overflow-y-auto space-y-0.5">
          {logs.map((log, i) => (
            <div key={i} className={`font-mono text-[10px] leading-relaxed ${
              i === 0 ? "text-white" : "text-gray-600"
            }`}>
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
