import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SERVICES: Record<number, string> = {
  21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS",
  80: "HTTP", 110: "POP3", 143: "IMAP", 443: "HTTPS", 993: "IMAPS",
  995: "POP3S", 3306: "MySQL", 3389: "RDP", 5432: "PostgreSQL",
  5900: "VNC", 6379: "Redis", 8080: "HTTP-Alt", 8443: "HTTPS-Alt", 27017: "MongoDB",
};

const DEFAULT_PORTS = [21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 1433, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 27017];

async function scanPort(host: string, port: number, timeout = 3000): Promise<{ port: number; status: string; service: string; banner?: string }> {
  const service = SERVICES[port] || "Unknown";
  try {
    const conn = await Deno.connect({ hostname: host, port, transport: "tcp" });

    // Try to grab banner for some services
    let banner: string | undefined;
    if ([21, 22, 25, 80, 110, 143, 3306, 6379, 27017].includes(port)) {
      try {
        const buf = new Uint8Array(256);
        const timer = setTimeout(() => conn.close(), 2000);
        const n = await conn.read(buf);
        clearTimeout(timer);
        if (n && n > 0) {
          banner = new TextDecoder().decode(buf.slice(0, n)).trim().substring(0, 120);
        }
      } catch {
        // banner grab failed, that's fine
      }
    }

    conn.close();
    return { port, status: "open", service, banner };
  } catch {
    return { port, status: "closed", service };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const host = url.searchParams.get("host");
    const portsParam = url.searchParams.get("ports");

    if (!host) {
      return new Response(JSON.stringify({ error: "host parameter required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate IP format to prevent abuse
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
      return new Response(JSON.stringify({ error: "Only IP addresses are supported" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ports = portsParam
      ? portsParam.split(",").map(p => parseInt(p.trim())).filter(p => p > 0 && p <= 65535)
      : DEFAULT_PORTS;

    // Scan with concurrency limit (5 at a time)
    const results: { port: number; status: string; service: string; banner?: string }[] = [];
    const batchSize = 5;

    for (let i = 0; i < ports.length; i += batchSize) {
      const batch = ports.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(port => scanPort(host, port, 3000))
      );
      results.push(...batchResults);
    }

    const openPorts = results.filter(r => r.status === "open");

    return new Response(JSON.stringify({
      host,
      scanned: ports.length,
      open: openPorts.length,
      ports: results,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Scan failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
