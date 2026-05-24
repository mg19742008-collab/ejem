import { useState, useCallback, useEffect, useRef } from "react";
import { Search, Globe, User, Mail, MessageSquare, Phone, Loader2, History, Trash2, Radar, X, Send, Image, Upload } from "lucide-react";
import IPResult from "./components/results/IPResult";
import UsernameResult from "./components/results/UsernameResult";
import EmailResult from "./components/results/EmailResult";
import DiscordResult from "./components/results/DiscordResult";
import PhoneResult from "./components/results/PhoneResult";
import TelegramResult from "./components/results/TelegramResult";
import ImageResult from "./components/results/ImageResult";
import { lookupIP, lookupUsername, lookupEmail, lookupDiscord, lookupPhone, lookupTelegram, lookupImage, scanPorts } from "./lib/api";
import { saveSearch, getHistory, clearHistory, deleteSearch } from "./lib/history";
import type {
  ModuleType,
  OSINTResult,
  IPResult as IPR,
  UsernameResult as UR,
  EmailResult as ER,
  DiscordResult as DR,
  PhoneResult as PR,
  TelegramResult as TGR,
  ImageGeoResult as IMGR,
  SearchHistoryEntry,
} from "./types/osint";

const modules: { id: ModuleType; label: string; icon: React.ReactNode }[] = [
  { id: "ip", label: "IP Address", icon: <Globe size={16} /> },
  { id: "username", label: "Username", icon: <User size={16} /> },
  { id: "email", label: "Email", icon: <Mail size={16} /> },
  { id: "discord", label: "Discord", icon: <MessageSquare size={16} /> },
  { id: "phone", label: "Phone", icon: <Phone size={16} /> },
  { id: "telegram", label: "Telegram", icon: <Send size={16} /> },
  { id: "image", label: "Image", icon: <Image size={16} /> },
];

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleType>("ip");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OSINTResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [showPortScanner, setShowPortScanner] = useState(false);
  const [scanningIp, setScanningIp] = useState("");
  const [portResults, setPortResults] = useState<{ port: number; status: string; service: string; banner?: string }[]>([]);
  const [scanningPorts, setScanningPorts] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getHistory().then(setHistory);
  }, []);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  }, []);

  const handleSearch = useCallback(async () => {
    if (loading) return;

    // Image module uses file upload, not text query
    if (activeModule === "image") {
      if (!selectedFile) return;
      setLoading(true);
      setError(null);
      setResult(null);
      addLog(`Analyzing image: ${selectedFile.name}`);

      try {
        const res = await lookupImage(selectedFile);
        addLog(res.hasGPS ? `GPS found: ${res.lat}, ${res.lon}` : "No GPS data in image");
        setResult(res);
        addLog("Complete.");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        addLog(`ERROR: ${msg}`);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    addLog(`Starting ${activeModule.toUpperCase()} lookup: ${query}`);

    try {
      let res: OSINTResult;
      switch (activeModule) {
        case "ip":
          addLog("Querying IP geolocation API...");
          res = await lookupIP(query);
          addLog(`Found: ${(res as IPR).city}, ${(res as IPR).country}`);
          break;
        case "username":
          addLog("Scanning platforms...");
          res = await lookupUsername(query);
          addLog(`Found ${(res as UR).profiles.length} profiles`);
          break;
        case "email":
          addLog("Analyzing email...");
          res = await lookupEmail(query);
          addLog(`Provider: ${(res as ER).provider}`);
          break;
        case "discord":
          addLog("Decoding snowflake...");
          res = await lookupDiscord(query);
          addLog((res as DR).apiAvailable ? `Found: ${(res as DR).username}` : "Snowflake decoded");
          break;
        case "phone":
          addLog("Validating phone number...");
          res = await lookupPhone(query);
          addLog(`Carrier: ${(res as PR).carrier}`);
          break;
        case "telegram":
          addLog("Resolving Telegram username...");
          res = await lookupTelegram(query);
          addLog((res as TGR).found ? `Found ID: ${(res as TGR).id}` : "Username not found");
          break;
      }
      setResult(res);
      await saveSearch(activeModule, query, res);
      const updatedHistory = await getHistory();
      setHistory(updatedHistory);
      addLog("Complete.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      addLog(`ERROR: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [activeModule, query, loading, selectedFile, addLog]);

  const handleHistorySelect = (entry: SearchHistoryEntry) => {
    setActiveModule(entry.type);
    setQuery(entry.query);
    setShowHistory(false);
    setResult(null);
    setError(null);
  };

  const handleClearHistory = async () => {
    if (confirm("Clear all search history?")) {
      await clearHistory();
      setHistory([]);
    }
  };

  const handlePortScan = async () => {
    if (!scanningIp.trim()) return;
    setScanningPorts(true);
    setPortResults([]);
    addLog(`Scanning ports on ${scanningIp}...`);

    try {
      const scanResult = await scanPorts(scanningIp);
      setPortResults(scanResult.ports);
      addLog(`Port scan complete: ${scanResult.open} open / ${scanResult.scanned} scanned`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Scan failed";
      addLog(`ERROR: ${msg}`);
      setError(msg);
    } finally {
      setScanningPorts(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-3xl px-8 pt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Search<span className="text-white/30">X</span></h1>
            <p className="text-white/30 text-xs mt-0.5">OSINT Intelligence Tool</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (activeModule === "ip" && result) {
                  setScanningIp((result as IPR).ip);
                  setShowPortScanner(true);
                } else {
                  setShowPortScanner(!showPortScanner);
                }
              }}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded transition-colors text-sm"
            >
              <Radar size={14} />
              Port Scanner
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded transition-colors text-sm"
            >
              <History size={14} />
              History ({history.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Search Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 w-full max-w-3xl">
        {/* Module Tabs */}
        <div className="flex justify-center gap-1 mb-8 flex-wrap">
          {modules.map(mod => (
            <button
              key={mod.id}
              onClick={() => {
                setActiveModule(mod.id);
                setResult(null);
                setError(null);
                setLogs([]);
                setSelectedFile(null);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all ${
                activeModule === mod.id
                  ? "bg-white text-black"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {mod.icon}
              {mod.label}
            </button>
          ))}
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2">
            {modules.find(m => m.id === activeModule)?.label} Intelligence
          </h2>
          <p className="text-white/40 text-sm">
            {activeModule === "ip" && "Geolocate and analyze IP addresses"}
            {activeModule === "username" && "Find digital footprint across platforms"}
            {activeModule === "email" && "Analyze email providers and social profiles"}
            {activeModule === "discord" && "Decode Discord snowflake IDs"}
            {activeModule === "phone" && "Lookup phone number details"}
            {activeModule === "telegram" && "Resolve Telegram username to ID"}
            {activeModule === "image" && "Extract GPS location from photo EXIF data"}
          </p>
        </div>

        {/* Search Box - Image Upload */}
        {activeModule === "image" ? (
          <div className="w-full">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 p-8 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:border-white/30 transition-colors ${
                selectedFile ? "border-white/20" : ""
              }`}
            >
              {selectedFile ? (
                <>
                  <div className="w-16 h-16 rounded-lg bg-white text-black flex items-center justify-center">
                    <Image size={28} />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-white">{selectedFile.name}</div>
                    <div className="text-xs text-white/40 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSearch(); }}
                    disabled={loading}
                    className="px-6 py-2.5 bg-white text-black font-semibold text-sm rounded-lg hover:bg-white/90 disabled:opacity-30 flex items-center gap-2 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Analyzing</span>
                      </>
                    ) : (
                      <>
                        <Search size={14} />
                        <span>Extract GPS</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <Upload size={32} className="text-white/30" />
                  <div className="text-sm text-white/40">Click to upload an image</div>
                  <div className="text-xs text-white/20">Supports JPEG with EXIF GPS data</div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/tiff,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        ) : (
          /* Search Box - Text */
          <div className="w-full">
            <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-white/30 transition-colors">
              <div className="flex items-center px-4 border-r border-white/10">
                <span className="text-white/30 text-xs font-mono uppercase">{activeModule}</span>
              </div>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder={
                  activeModule === "ip" ? "8.8.8.8" :
                  activeModule === "username" ? "johndoe" :
                  activeModule === "email" ? "user@gmail.com" :
                  activeModule === "discord" ? "123456789012345678" :
                  activeModule === "telegram" ? "@username" :
                  "+34678283829"
                }
                className="flex-1 bg-transparent px-4 py-4 text-white placeholder-white/30 outline-none font-mono text-sm"
                autoFocus
              />
              <button
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                className="px-6 bg-white text-black font-semibold text-sm hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Scanning</span>
                  </>
                ) : (
                  <>
                    <Search size={14} />
                    <span>Run</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div className="w-full mt-4 p-3 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-white/40 text-xs mb-2">Execution Log</div>
            <div className="space-y-0.5 max-h-24 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className={`font-mono text-[11px] ${i === 0 ? "text-white" : "text-white/40"}`}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {(result || error) && (
        <div className="w-full max-w-3xl px-8 pb-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm mb-4">
              <span className="font-mono">[ERROR]</span> {error}
            </div>
          )}
          <div className="animate-fade-in">
            {result && activeModule === "ip" && <IPResult data={result as IPR} />}
            {result && activeModule === "username" && <UsernameResult data={result as UR} />}
            {result && activeModule === "email" && <EmailResult data={result as ER} />}
            {result && activeModule === "discord" && <DiscordResult data={result as DR} />}
            {result && activeModule === "phone" && <PhoneResult data={result as PR} />}
            {result && activeModule === "telegram" && <TelegramResult data={result as TGR} />}
            {result && activeModule === "image" && <ImageResult data={result as IMGR} />}
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowHistory(false)}>
          <div className="w-96 max-h-[80vh] bg-black border border-white/10 rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <span className="font-semibold">Search History</span>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button onClick={handleClearHistory} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5">
                    <Trash2 size={12} />
                    Clear All
                  </button>
                )}
                <button onClick={() => setShowHistory(false)} className="text-white/50 hover:text-white text-sm">Close</button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {history.length === 0 ? (
                <div className="p-8 text-center text-white/30 text-sm">No searches yet</div>
              ) : (
                history.map(entry => (
                  <div key={entry.id} className="flex items-center">
                    <button
                      onClick={() => handleHistorySelect(entry)}
                      className="flex-1 flex items-center gap-3 p-4 hover:bg-white/5 text-left border-b border-white/5 transition-colors"
                    >
                      <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                        {modules.find(m => m.id === entry.type)?.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-sm truncate">{entry.query}</div>
                        <div className="text-white/40 text-xs">{entry.type.toUpperCase()} · {new Date(entry.created_at).toLocaleDateString()}</div>
                      </div>
                    </button>
                    <button
                      onClick={async () => {
                        await deleteSearch(entry.id);
                        setHistory(prev => prev.filter(h => h.id !== entry.id));
                      }}
                      className="p-2 text-white/20 hover:text-red-400 transition-colors mr-2"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Port Scanner Modal */}
      {showPortScanner && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowPortScanner(false)}>
          <div className="w-[520px] max-h-[80vh] bg-black border border-white/10 rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Radar size={16} className="text-white" />
                <span className="font-semibold">Port Scanner</span>
              </div>
              <button onClick={() => setShowPortScanner(false)} className="text-white/50 hover:text-white text-sm">Close</button>
            </div>
            <div className="p-4">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={scanningIp}
                  onChange={e => setScanningIp(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handlePortScan()}
                  placeholder="Enter IP to scan (e.g. 8.8.8.8)"
                  className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm font-mono outline-none focus:border-white/30"
                />
                <button
                  onClick={handlePortScan}
                  disabled={scanningPorts || !scanningIp.trim()}
                  className="px-4 bg-white text-black font-semibold text-sm rounded hover:bg-white/90 disabled:opacity-30 flex items-center gap-2"
                >
                  {scanningPorts ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  Scan
                </button>
              </div>
              {portResults.length > 0 && (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {portResults.map(r => (
                    <div key={r.port} className="flex items-center justify-between p-2 bg-white/5 rounded">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm">{r.port}</span>
                        <span className="text-white/40 text-xs">{r.service}</span>
                        {r.banner && <span className="text-white/20 text-[10px] font-mono truncate max-w-48">{r.banner}</span>}
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        r.status === 'open' ? 'bg-green-500/20 text-green-400' :
                        r.status === 'closed' ? 'bg-red-500/20 text-red-400' :
                        'bg-white/10 text-white/40'
                      }`}>
                        {r.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {portResults.length === 0 && (
                <div className="text-center text-white/30 text-sm py-8">
                  Enter an IP address and click Scan to check common ports
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
