import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  lat: number;
  lon: number;
  zoom?: number;
  className?: string;
}

export default function MapView({ lat, lon, zoom = 12, className = "h-64" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.setView([lat, lon], zoom);
      mapRef.current.eachLayer(layer => {
        if (layer instanceof L.Marker) layer.setLatLng([lat, lon]);
      });
      return;
    }

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([lat, lon], zoom);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    const icon = L.divIcon({
      className: "",
      html: `<div style="width:20px;height:20px;background:#fff;border-radius:50%;border:3px solid #000;box-shadow:0 0 10px rgba(0,0,0,0.5);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    L.marker([lat, lon], { icon }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lon, zoom]);

  return <div ref={containerRef} className={`w-full rounded-lg overflow-hidden ${className}`} />;
}
