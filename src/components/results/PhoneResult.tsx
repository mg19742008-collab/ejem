import { Phone, Signal, CheckCircle, AlertCircle, Clock, MapPin } from "lucide-react";
import type { PhoneResult } from "../../types/osint";

export default function PhoneResultView({ data }: { data: PhoneResult }) {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-[#131313] border border-[#1a1a1a] rounded-lg">
        <div className="w-12 h-12 rounded-lg bg-white text-black flex items-center justify-center flex-shrink-0">
          <Phone size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xl font-bold text-white font-mono">{data.formatted}</div>
          <div className="text-sm text-gray-500">{data.carrier} · {data.lineType}</div>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
          data.valid ? "bg-white text-black" : "bg-[#1a1a1a] text-gray-500"
        }`}>
          {data.valid ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
          {data.valid ? "Valid" : "Invalid"}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-[#131313] border border-[#1a1a1a] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4 text-gray-400">
            <MapPin size={12} />
            <span className="text-xs uppercase tracking-widest">Location</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-0.5">Country</div>
              <div className="text-sm text-white">{data.country}</div>
            </div>
            <div>
              <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-0.5">Country Code</div>
              <div className="font-mono text-sm text-gray-300">{data.countryCode || "—"}</div>
            </div>
            <div>
              <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-0.5">Region</div>
              <div className="text-sm text-white">{data.region}</div>
            </div>
          </div>
        </div>

        <div className="bg-[#131313] border border-[#1a1a1a] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4 text-gray-400">
            <Signal size={12} />
            <span className="text-xs uppercase tracking-widest">Carrier</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-0.5">Network</div>
              <div className="text-sm text-white">{data.carrier}</div>
            </div>
            <div>
              <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-0.5">Line Type</div>
              <div className="text-sm text-gray-300 capitalize">{data.lineType}</div>
            </div>
          </div>
        </div>

        <div className="bg-[#131313] border border-[#1a1a1a] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4 text-gray-400">
            <Clock size={12} />
            <span className="text-xs uppercase tracking-widest">Details</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-0.5">Timezone</div>
              <div className="text-sm text-white">{data.timezone}</div>
            </div>
            <div>
              <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-0.5">Raw Number</div>
              <div className="font-mono text-sm text-gray-300">{data.phone}</div>
            </div>
          </div>
        </div>
      </div>

      {/* API Note */}
      {!data.apiAvailable && (
        <div className="bg-[#131313] border border-[#222] rounded-lg p-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-gray-600" />
            Limited data available. Add Numverify API key for full phone intelligence.
          </div>
        </div>
      )}
    </div>
  );
}
