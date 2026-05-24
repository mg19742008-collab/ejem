import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function snowflakeToDate(snowflake: string): Date {
  const DISCORD_EPOCH = 1420070400000n;
  const id = BigInt(snowflake);
  const timestamp = (id >> 22n) + DISCORD_EPOCH;
  return new Date(Number(timestamp));
}

function getAvatarUrl(userId: string, avatarHash: string | null, format = "png"): string | null {
  if (!avatarHash) return null;
  const ext = avatarHash.startsWith("a_") ? "gif" : format;
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${ext}?size=256`;
}

function getBannerUrl(userId: string, bannerHash: string | null): string | null {
  if (!bannerHash) return null;
  const ext = bannerHash.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/banners/${userId}/${bannerHash}.${ext}?size=512`;
}

function getDefaultAvatar(discriminator: string): string {
  const index = discriminator === "0" ? 0 : parseInt(discriminator) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const discordId = url.searchParams.get("id") || url.pathname.split("/").pop();

    if (!discordId || !/^\d{17,19}$/.test(discordId)) {
      return new Response(JSON.stringify({ error: "Valid Discord ID required (17-19 digits)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const createdAt = snowflakeToDate(discordId);

    const botToken = Deno.env.get("DISCORD_BOT_TOKEN") || "";

    if (!botToken) {
      return new Response(JSON.stringify({
        id: discordId,
        avatar: getDefaultAvatar("0"),
        createdAt: createdAt.toISOString(),
        createdAtFormatted: createdAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        apiAvailable: false,
        note: "Discord Bot Token not configured. Showing snowflake data only.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const discordRes = await fetch(`https://discord.com/api/v10/users/${discordId}`, {
      headers: {
        "Authorization": `Bot ${botToken}`,
        "User-Agent": "OSINT-Dashboard (https://github.com, 1.0.0)",
      },
    });

    if (!discordRes.ok) {
      if (discordRes.status === 404) {
        return new Response(JSON.stringify({
          id: discordId,
          avatar: getDefaultAvatar("0"),
          createdAt: createdAt.toISOString(),
          createdAtFormatted: createdAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
          apiAvailable: false,
          note: "User not found or account deleted.",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Discord API error");
    }

    const user = await discordRes.json();

    const result = {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator || "0",
      globalName: user.global_name || null,
      avatar: getAvatarUrl(user.id, user.avatar) || getDefaultAvatar(user.discriminator || "0"),
      avatarHash: user.avatar,
      banner: getBannerUrl(user.id, user.banner),
      bannerColor: user.banner_color,
      accentColor: user.accent_color,
      bot: user.bot || false,
      publicFlags: user.public_flags || 0,
      createdAt: createdAt.toISOString(),
      createdAtFormatted: createdAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      apiAvailable: true,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to process Discord ID" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
