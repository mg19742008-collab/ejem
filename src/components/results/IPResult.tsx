import { Globe, MapPin, Server, Clock, Map } from "lucide-react";
import type { IPResult } from "../../types/osint";
import MapView from "../MapView";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-[#131313] border border-[#1a1a1a] rounded-lg p-5 ${className}`}>{children}</div>;
}

function Field({ label, value, mono = false }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div>
      <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-sm text-white ${mono ? "font-mono text-gray-300" : ""}`}>{value || "—"}</div>
    </div>
  );
}

export default function IPResultView({ data }: { data: IPResult }) {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-[#131313] border border-[#1a1a1a] rounded-lg">
        <div className="w-12 h-12 rounded-lg bg-white text-black flex items-center justify-center flex-shrink-0">
          <Globe size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xl font-bold text-white font-mono">{data.ip}</div>
          <div className="text-sm text-gray-500">
            {data.city}, {data.region}, {data.country}
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-white text-black text-[10px] font-bold uppercase tracking-wider">
          Located
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <div className="flex items-center gap-2 mb-4 text-gray-400">
            <MapPin size={14} />
            <span className="text-xs uppercase tracking-widest">Location</span>
          </div>
          <div className="space-y-3">
            <Field label="Country" value={`${data.country} (${data.countryCode})`} />
            <Field label="Region" value={data.region} />
            <Field label="City" value={data.city} />
            <Field label="Postal" value={data.zip} mono />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4 text-gray-400">
            <Server size={14} />
            <span className="text-xs uppercase tracking-widest">Network</span>
          </div>
          <div className="space-y-3">
            <Field label="ISP" value={data.isp} />
            <Field label="Organization" value={data.org} />
            <Field label="ASN" value={data.as} mono />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4 text-gray-400">
            <Clock size={14} />
            <span className="text-xs uppercase tracking-widest">Details</span>
          </div>
          <div className="space-y-3">
            <Field label="Timezone" value={data.timezone} />
            <Field label="Latitude" value={data.lat} mono />
            <Field label="Longitude" value={data.lon} mono />
          </div>
        </Card>
      </div>

      {/* Inline Map */}
      <div className="bg-[#131313] border border-[#1a1a1a] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2 text-gray-400">
            <Map size={14} />
            <span className="text-xs uppercase tracking-widest">Location Map</span>
          </div>
          <a
            href={`https://www.openstreetmap.org/?mlat=${data.lat}&mlon=${data.lon}#map=12/${data.lat}/${data.lon}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-white hover:text-gray-300 transition-colors bg-[#1a1a1a] px-3 py-1.5 rounded-lg"
          >
            Open Full Map
            <span className="font-mono text-gray-500">({data.lat.toFixed(4)}, {data.lon.toFixed(4)})</span>
          </a>
        </div>
        <MapView lat={data.lat} lon={data.lon} zoom={11} />
      </div>
    </div>
  );
}
