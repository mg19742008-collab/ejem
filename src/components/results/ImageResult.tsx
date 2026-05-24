import { MapPin, Camera, Mountain, Map, AlertCircle, Image } from "lucide-react";
import type { ImageGeoResult } from "../../types/osint";
import MapView from "../MapView";

function Field({ label, value, mono = false }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div>
      <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-sm text-white ${mono ? "font-mono text-gray-300" : ""}`}>{value || "—"}</div>
    </div>
  );
}

export default function ImageResultView({ data }: { data: ImageGeoResult }) {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-[#131313] border border-[#1a1a1a] rounded-lg">
        <div className="w-12 h-12 rounded-lg bg-white text-black flex items-center justify-center flex-shrink-0">
          <Image size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xl font-bold text-white font-mono truncate">{data.filename}</div>
          <div className="text-sm text-gray-500">{data.hasGPS ? "GPS data found" : "No GPS data"}</div>
        </div>
        <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
          data.hasGPS ? "bg-white text-black" : "bg-[#1a1a1a] text-gray-500"
        }`}>
          {data.hasGPS ? "Geolocated" : "No GPS"}
        </div>
      </div>

      {/* No GPS Warning */}
      {!data.hasGPS && (
        <div className="flex items-start gap-3 p-4 bg-[#131313] border border-[#222] rounded-lg text-sm text-gray-400">
          <AlertCircle size={16} className="flex-shrink-0 text-gray-500 mt-0.5" />
          <span>{data.note || "No GPS metadata found in this image. The location data may have been stripped or was never captured."}</span>
        </div>
      )}

      {/* GPS Results */}
      {data.hasGPS && data.lat != null && data.lon != null && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-[#131313] border border-[#1a1a1a] rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4 text-gray-400">
                <MapPin size={12} />
                <span className="text-xs uppercase tracking-widest">Location</span>
              </div>
              <div className="space-y-3">
                <Field label="Country" value={data.country || "Unknown"} />
                <Field label="Region" value={data.region || "Unknown"} />
                <Field label="City" value={data.city || "Unknown"} />
              </div>
            </div>

            <div className="bg-[#131313] border border-[#1a1a1a] rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4 text-gray-400">
                <Mountain size={12} />
                <span className="text-xs uppercase tracking-widest">Coordinates</span>
              </div>
              <div className="space-y-3">
                <Field label="Latitude" value={data.lat.toFixed(6)} mono />
                <Field label="Longitude" value={data.lon.toFixed(6)} mono />
                {data.altitude != null && <Field label="Altitude" value={`${data.altitude.toFixed(1)}m`} mono />}
              </div>
            </div>

            <div className="bg-[#131313] border border-[#1a1a1a] rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4 text-gray-400">
                <Camera size={12} />
                <span className="text-xs uppercase tracking-widest">Camera</span>
              </div>
              <div className="space-y-3">
                <Field label="Device" value={data.camera || "Unknown"} />
              </div>
            </div>
          </div>

          {/* Inline Map */}
          <div className="bg-[#131313] border border-[#1a1a1a] rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 p-3 border-b border-[#1a1a1a] text-gray-400">
              <Map size={12} />
              <span className="text-xs uppercase tracking-widest">Location Map</span>
            </div>
            <MapView lat={data.lat} lon={data.lon} zoom={13} />
          </div>
        </>
      )}
    </div>
  );
}
