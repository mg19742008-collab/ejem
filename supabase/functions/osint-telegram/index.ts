import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");

    if (!username) {
      return new Response(JSON.stringify({ error: "username is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanUsername = username.replace(/^@/, "").trim();

    // Always try the public preview first to get basic info
    const publicResult = await tryPublicLookup(cleanUsername);

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

    if (botToken) {
      // Also try Bot API to get the numeric ID
      try {
        const apiUrl = `https://api.telegram.org/bot${botToken}/getChat?chat_id=@${encodeURIComponent(cleanUsername)}`;
        const res = await fetch(apiUrl);
        const json = await res.json();

        if (json.ok) {
          const chat = json.result;
          const result: Record<string, unknown> = {
            query: cleanUsername,
            found: true,
            id: chat.id,
            username: chat.username || cleanUsername,
            first_name: chat.first_name,
            last_name: chat.last_name,
            type: chat.type,
            title: chat.title,
            description: chat.description || publicResult.description,
            member_count: chat.active_usercount,
            is_verified: chat.is_verified || false,
            is_scam: chat.is_scam || false,
            is_fake: chat.is_fake || false,
            photo_url: null as string | null,
          };

          // Try to get profile photo
          if (chat.photo?.small_file_id) {
            try {
              const fileRes = await fetch(
                `https://api.telegram.org/bot${botToken}/getFile?file_id=${chat.photo.small_file_id}`
              );
              const fileJson = await fileRes.json();
              if (fileJson.ok) {
                result.photo_url = `https://api.telegram.org/file/bot${botToken}/${fileJson.result.file_path}`;
              }
            } catch {
              // photo is optional
            }
          }

          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch {
        // Bot API failed, fall through to public result
      }

      // Bot couldn't find user directly, but public page might exist
      // Return public result with note about ID
      if (publicResult.found) {
        return new Response(JSON.stringify({
          ...publicResult,
          note: "Bot cannot access this chat directly. Add the bot to a shared group with this user for full ID access.",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // No bot token or public lookup is all we have
    return new Response(JSON.stringify(publicResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function tryPublicLookup(username: string) {
  try {
    const res = await fetch(`https://t.me/${username}`, {
      headers: {
        "User-Agent": "TelegramBot (like TwitterBot)",
      },
    });

    const html = await res.text();

    // Check for page existence indicators
    const hasPage = html.includes("tgme_page_title") || html.includes("tgme_page_extra") || html.includes("tgme_page_description");

    if (!hasPage && html.includes("page_not_found")) {
      return {
        query: username,
        found: false,
        note: "Username not found on Telegram",
      };
    }

    // Extract og:title
    const titleMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)
      || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i);

    // Extract description
    const descMatch = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i)
      || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:description"/i);

    // Extract tgme_page_title (more reliable than og:title for display name)
    const pageNameMatch = html.match(/class="tgme_page_title"[^>]*>\s*<span[^>]*>([^<]+)/i);
    // Extract tgme_page_extra for @username or member count
    const extraMatch = html.match(/class="tgme_page_extra"[^>]*>([^<]+)/i);

    const displayName = pageNameMatch?.[1]?.trim() || titleMatch?.[1] || username;
    const description = descMatch?.[1];
    const extra = extraMatch?.[1]?.trim() || "";

    // Determine type based on extra info
    let type = "user";
    let memberCount: number | undefined;
    if (extra.includes("members") || extra.includes("subscribers")) {
      type = extra.includes("subscribers") ? "channel" : "group";
      const countMatch = extra.match(/([\d,.\s]+)/);
      if (countMatch) {
        memberCount = parseInt(countMatch[1].replace(/[,\s]/g, ""));
      }
    }

    // Try to extract the image URL
    const imageMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
      || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
    const photoUrl = imageMatch?.[1];

    return {
      query: username,
      found: true,
      username: extra.startsWith("@") ? extra.substring(1).trim() : username,
      first_name: displayName,
      type,
      description,
      member_count: memberCount,
      photo_url: photoUrl || null,
      note: "Numeric ID not available via public preview. Add TELEGRAM_BOT_TOKEN and ensure the bot shares a group with this user for ID access.",
    };
  } catch {
    return {
      query: username,
      found: false,
      note: "Could not reach Telegram servers",
    };
  }
}
