import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const COUNTRY_CODES: Record<string, { name: string; code: string }> = {
  "1": { name: "United States", code: "US" },
  "44": { name: "United Kingdom", code: "GB" },
  "49": { name: "Germany", code: "DE" },
  "33": { name: "France", code: "FR" },
  "34": { name: "Spain", code: "ES" },
  "39": { name: "Italy", code: "IT" },
  "7": { name: "Russia", code: "RU" },
  "81": { name: "Japan", code: "JP" },
  "86": { name: "China", code: "CN" },
  "91": { name: "India", code: "IN" },
  "55": { name: "Brazil", code: "BR" },
  "52": { name: "Mexico", code: "MX" },
  "61": { name: "Australia", code: "AU" },
  "31": { name: "Netherlands", code: "NL" },
  "46": { name: "Sweden", code: "SE" },
  "47": { name: "Norway", code: "NO" },
  "358": { name: "Finland", code: "FI" },
  "45": { name: "Denmark", code: "DK" },
  "41": { name: "Switzerland", code: "CH" },
  "43": { name: "Austria", code: "AT" },
  "32": { name: "Belgium", code: "BE" },
  "351": { name: "Portugal", code: "PT" },
  "30": { name: "Greece", code: "GR" },
  "48": { name: "Poland", code: "PL" },
  "380": { name: "Ukraine", code: "UA" },
  "353": { name: "Ireland", code: "IE" },
  "359": { name: "Bulgaria", code: "BG" },
  "36": { name: "Hungary", code: "HU" },
  "420": { name: "Czech Republic", code: "CZ" },
  "421": { name: "Slovakia", code: "SK" },
  "40": { name: "Romania", code: "RO" },
  "371": { name: "Latvia", code: "LV" },
  "372": { name: "Estonia", code: "EE" },
  "370": { name: "Lithuania", code: "LT" },
  "82": { name: "South Korea", code: "KR" },
  "886": { name: "Taiwan", code: "TW" },
  "65": { name: "Singapore", code: "SG" },
  "60": { name: "Malaysia", code: "MY" },
  "66": { name: "Thailand", code: "TH" },
  "63": { name: "Philippines", code: "PH" },
  "62": { name: "Indonesia", code: "ID" },
  "84": { name: "Vietnam", code: "VN" },
  "234": { name: "Nigeria", code: "NG" },
  "27": { name: "South Africa", code: "ZA" },
  "20": { name: "Egypt", code: "EG" },
  "966": { name: "Saudi Arabia", code: "SA" },
  "971": { name: "UAE", code: "AE" },
  "972": { name: "Israel", code: "IL" },
  "90": { name: "Turkey", code: "TR" },
  "98": { name: "Iran", code: "IR" },
  "92": { name: "Pakistan", code: "PK" },
  "880": { name: "Bangladesh", code: "BD" },
};

const CARRIERS_SPAIN: Record<string, string> = {
  "6": ["Movistar", "Vodafone", "Orange", "Yoigo", "Movistar", "Movistar", "Movistar"],
  "7": ["Movistar", "Vodafone", "Orange", "Yoigo"],
};

function detectCarrier(phone: string, countryCode: string): string {
  // Spanish numbers
  if (countryCode === "34") {
    const prefix = phone.substring(2, 3);
    if (prefix === "6" || prefix === "7") {
      const second = phone.substring(3, 4);
      if (second === "0" || second === "1" || second === "2" || second === "3" || second === "4" || second === "5") return "Movistar";
      if (second === "6" || second === "7") return "Vodafone";
      if (second === "8") return "Orange";
      if (second === "9") return "Yoigo";
    }
    return "Spanish Mobile";
  }
  return "Unknown Carrier";
}

function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.startsWith("34") && clean.length === 11) {
    return `+34 ${clean.substring(2, 5)} ${clean.substring(5, 8)} ${clean.substring(8, 11)}`;
  }
  if (clean.length >= 10) {
    return `+${clean}`;
  }
  return phone;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const phone = url.searchParams.get("phone") || url.pathname.split("/").pop();

    if (!phone) {
      return new Response(JSON.stringify({ error: "Phone number required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanPhone = phone.replace(/^\+/, "").replace(/\D/g, "");

    if (cleanPhone.length < 7 || cleanPhone.length > 15) {
      return new Response(JSON.stringify({ error: "Invalid phone number length" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let countryCode = "";
    let country = "Unknown";
    let lineType = "Mobile";

    // Try to match country code (longest match first)
    for (let len = 3; len >= 1; len--) {
      const prefix = cleanPhone.substring(0, len);
      if (COUNTRY_CODES[prefix]) {
        countryCode = prefix;
        country = COUNTRY_CODES[prefix].name;
        break;
      }
    }

    const carrier = detectCarrier(cleanPhone, countryCode);

    const result = {
      phone: cleanPhone,
      formatted: formatPhone(phone),
      country,
      countryCode: countryCode || "",
      carrier,
      lineType,
      valid: cleanPhone.length >= 9,
      region: country !== "Unknown" ? country : "Unknown",
      timezone: country !== "Unknown" ? "Local" : "Unknown",
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to process phone number" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
