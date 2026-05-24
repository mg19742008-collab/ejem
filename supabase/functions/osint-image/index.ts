import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function readU16(buf: Uint8Array, off: number, le: boolean): number {
  return le ? (buf[off] | (buf[off + 1] << 8)) : ((buf[off] << 8) | buf[off + 1]);
}

function readU32(buf: Uint8Array, off: number, le: boolean): number {
  return le
    ? (buf[off] | (buf[off + 1] << 8) | (buf[off + 2] << 16) | (buf[off + 3] << 24)) >>> 0
    : ((buf[off] << 24) | (buf[off + 1] << 16) | (buf[off + 2] << 8) | buf[off + 3]) >>> 0;
}

function readSRational(buf: Uint8Array, off: number, le: boolean): number {
  const num = readU32(buf, off, le);
  const den = readU32(buf, off + 4, le);
  return den === 0 ? 0 : num / den;
}

function readURational(buf: Uint8Array, off: number, le: boolean): number {
  const num = readU32(buf, off, le);
  const den = readU32(buf, off + 4, le);
  return den === 0 ? 0 : num / den;
}

function readASCII(buf: Uint8Array, off: number, count: number): string {
  let s = "";
  for (let i = 0; i < count && off + i < buf.length; i++) {
    const c = buf[off + i];
    if (c === 0) break;
    if (c >= 32 && c < 127) s += String.fromCharCode(c);
  }
  return s.trim();
}

interface ExifData {
  gpsLatRef?: string;
  gpsLat?: number[];
  gpsLonRef?: string;
  gpsLon?: number[];
  gpsAlt?: number;
  cameraMake?: string;
  cameraModel?: string;
  dateTime?: string;
  software?: string;
}

function parseIFD(buf: Uint8Array, tiffStart: number, ifdOffset: number, le: boolean, data: ExifData): void {
  if (ifdOffset + 2 > buf.length) return;
  const numEntries = readU16(buf, ifdOffset, le);

  for (let i = 0; i < numEntries; i++) {
    const entryOff = ifdOffset + 2 + i * 12;
    if (entryOff + 12 > buf.length) break;

    const tag = readU16(buf, entryOff, le);
    const type = readU16(buf, entryOff + 2, le);
    const count = readU32(buf, entryOff + 4, le);

    // Each type has a different size
    const typeSizes: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
    const unitSize = typeSizes[type] || 1;
    const totalSize = count * unitSize;

    // Value offset: if data fits in 4 bytes it's inline, otherwise it's a pointer
    let valueOff: number;
    if (totalSize <= 4) {
      valueOff = entryOff + 8;
    } else {
      valueOff = tiffStart + readU32(buf, entryOff + 8, le);
    }

    if (valueOff < 0 || valueOff + totalSize > buf.length) continue;

    // Process known tags
    switch (tag) {
      // GPS IFD pointer
      case 0x8825: {
        const gpsIFDOffset = tiffStart + readU32(buf, entryOff + 8, le);
        parseIFD(buf, tiffStart, gpsIFDOffset, le, data);
        break;
      }
      // Exif Sub IFD pointer
      case 0x8769: {
        const subIFDOffset = tiffStart + readU32(buf, entryOff + 8, le);
        parseIFD(buf, tiffStart, subIFDOffset, le, data);
        break;
      }
      // GPS Latitude Ref
      case 0x0001:
        data.gpsLatRef = String.fromCharCode(buf[valueOff]);
        break;
      // GPS Latitude
      case 0x0002:
        if (type === 5 && count === 3) {
          data.gpsLat = [
            readURational(buf, valueOff, le),
            readURational(buf, valueOff + 8, le),
            readURational(buf, valueOff + 16, le),
          ];
        }
        break;
      // GPS Longitude Ref
      case 0x0003:
        data.gpsLonRef = String.fromCharCode(buf[valueOff]);
        break;
      // GPS Longitude
      case 0x0004:
        if (type === 5 && count === 3) {
          data.gpsLon = [
            readURational(buf, valueOff, le),
            readURational(buf, valueOff + 8, le),
            readURational(buf, valueOff + 16, le),
          ];
        }
        break;
      // GPS Altitude
      case 0x0006:
        if (type === 5) {
          data.gpsAlt = readSRational(buf, valueOff, le);
        }
        break;
      // Make
      case 0x010F:
        if (type === 2) data.cameraMake = readASCII(buf, valueOff, count);
        break;
      // Model
      case 0x0110:
        if (type === 2) data.cameraModel = readASCII(buf, valueOff, count);
        break;
      // DateTime
      case 0x0132:
        if (type === 2) data.dateTime = readASCII(buf, valueOff, count);
        break;
      // Software
      case 0x0131:
        if (type === 2) data.software = readASCII(buf, valueOff, count);
        break;
    }
  }
}

function extractExif(imageData: Uint8Array): ExifData {
  const data: ExifData = {};

  // Check JPEG SOI
  if (imageData[0] !== 0xFF || imageData[1] !== 0xD8) return data;

  let offset = 2;
  while (offset < imageData.length - 4) {
    if (imageData[offset] !== 0xFF) break;
    const marker = imageData[offset + 1];

    // SOS or EOI - stop
    if (marker === 0xDA || marker === 0xD9) break;

    offset += 2;

    // Markers without length
    if (marker >= 0xD0 && marker <= 0xD7) continue;

    const segLen = (imageData[offset] << 8) | imageData[offset + 1];

    // APP1 - Exif
    if (marker === 0xE1 && offset + segLen <= imageData.length) {
      // Check "Exif\0\0" header
      if (imageData[offset + 2] === 0x45 && imageData[offset + 3] === 0x78 &&
          imageData[offset + 4] === 0x69 && imageData[offset + 5] === 0x66) {
        const tiffStart = offset + 8;
        const le = imageData[tiffStart] === 0x49; // "II" = little endian
        // Verify "MM" or "II"
        if (imageData[tiffStart] === 0x49 || imageData[tiffStart] === 0x4D) {
          const ifd0Offset = tiffStart + readU32(imageData, tiffStart + 4, le);
          parseIFD(imageData, tiffStart, ifd0Offset, le, data);
        }
      }
    }

    offset += segLen;
  }

  return data;
}

function getGPS(data: ExifData): { lat: number; lon: number; altitude?: number } | null {
  if (!data.gpsLat || !data.gpsLon) return null;

  const latDeg = data.gpsLat[0];
  const latMin = data.gpsLat[1];
  const latSec = data.gpsLat[2];
  const lonDeg = data.gpsLon[0];
  const lonMin = data.gpsLon[1];
  const lonSec = data.gpsLon[2];

  let lat = latDeg + latMin / 60 + latSec / 3600;
  let lon = lonDeg + lonMin / 60 + lonSec / 3600;

  if (data.gpsLatRef === "S") lat = -lat;
  if (data.gpsLonRef === "W") lon = -lon;

  return { lat, lon, altitude: data.gpsAlt };
}

async function reverseGeocode(lat: number, lon: number): Promise<{ country: string; city: string; region: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
      { headers: { "User-Agent": "OSINTX-ImageGeo/1.0" } }
    );
    if (res.ok) {
      const d = await res.json();
      const a = d.address || {};
      return {
        country: a.country || "",
        city: a.city || a.town || a.village || a.municipality || "",
        region: a.state || a.region || "",
      };
    }
  } catch { /* optional */ }
  return { country: "", city: "", region: "" };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "POST required with image file" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formData = await req.formData();
    const file = formData.get("image");

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: "Image file required in 'image' field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const filename = file.name;

    const exif = extractExif(bytes);
    const gps = getGPS(exif);

    if (!gps) {
      const camera = [exif.cameraMake, exif.cameraModel].filter(Boolean).join(" ") || undefined;
      return new Response(JSON.stringify({
        filename,
        hasGPS: false,
        camera,
        dateTaken: exif.dateTime,
        software: exif.software,
        note: "No GPS data found in image EXIF. Many apps and social media strip GPS data before sharing. Try with the original photo from the camera.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geo = await reverseGeocode(gps.lat, gps.lon);
    const camera = [exif.cameraMake, exif.cameraModel].filter(Boolean).join(" ") || undefined;

    const result = {
      filename,
      hasGPS: true,
      lat: gps.lat,
      lon: gps.lon,
      altitude: gps.altitude,
      country: geo.country,
      city: geo.city,
      region: geo.region,
      camera,
      dateTaken: exif.dateTime,
      software: exif.software,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Failed to process image" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
