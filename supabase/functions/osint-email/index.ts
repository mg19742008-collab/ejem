import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const EMAIL_PROVIDERS: Record<string, string> = {
  "gmail.com": "Google Gmail",
  "googlemail.com": "Google Gmail",
  "yahoo.com": "Yahoo Mail",
  "hotmail.com": "Microsoft Hotmail",
  "outlook.com": "Microsoft Outlook",
  "live.com": "Microsoft Live",
  "icloud.com": "Apple iCloud",
  "me.com": "Apple Me",
  "protonmail.com": "ProtonMail",
  "proton.me": "ProtonMail",
  "tutanota.com": "Tutanota",
  "zoho.com": "Zoho Mail",
};

interface PlatformResult {
  platform: string;
  url: string;
  icon: string;
  username: string;
  exists: boolean;
}

async function checkGitHub(username: string): Promise<{ exists: boolean; data?: Record<string, string | number | null> }> {
  try {
    const res = await fetch(`https://api.github.com/users/${username}`, {
      headers: { "Accept": "application/vnd.github.v3+json", "User-Agent": "OSINTX/1.0" },
    });
    if (res.ok) {
      const gh = await res.json();
      return {
        exists: true,
        data: {
          login: gh.login,
          name: gh.name,
          bio: gh.bio,
          avatar: gh.avatar_url,
          followers: gh.followers,
          repos: gh.public_repos,
          created: gh.created_at,
          location: gh.location,
          company: gh.company,
          blog: gh.blog,
          url: gh.html_url,
        },
      };
    }
    return { exists: false };
  } catch {
    return { exists: false };
  }
}

async function checkGitLab(username: string): Promise<{ exists: boolean; data?: Record<string, string | number | null> }> {
  try {
    const res = await fetch(`https://gitlab.com/api/v4/users?username=${username}`);
    if (res.ok) {
      const users = await res.json();
      if (Array.isArray(users) && users.length > 0) {
        const u = users[0];
        return {
          exists: true,
          data: {
            id: u.id,
            name: u.name,
            avatar: u.avatar_url,
            url: u.web_url,
          },
        };
      }
    }
    return { exists: false };
  } catch {
    return { exists: false };
  }
}

async function checkReddit(username: string): Promise<{ exists: boolean; data?: Record<string, string | number | null> }> {
  try {
    const res = await fetch(`https://www.reddit.com/user/${username}/about.json`, {
      headers: { "User-Agent": "OSINTX/1.0" },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.data?.name) {
        return {
          exists: true,
          data: {
            name: data.data.name,
            karma: data.data.link_karma + data.data.comment_karma,
            created: new Date(data.data.created_utc * 1000).toISOString(),
          },
        };
      }
    }
    return { exists: false };
  } catch {
    return { exists: false };
  }
}

async function checkKeybase(username: string): Promise<{ exists: boolean; data?: Record<string, string | number | null> }> {
  try {
    const res = await fetch(`https://keybase.io/_/api/1.0/user/lookup.json?usernames=${username}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.them && data.them.length > 0) {
        const u = data.them[0];
        return {
          exists: true,
          data: {
            id: u.id,
            name: u.profile?.full_name,
            bio: u.profile?.bio,
          },
        };
      }
    }
    return { exists: false };
  } catch {
    return { exists: false };
  }
}

async function checkGravatar(username: string): Promise<{ exists: boolean; data?: Record<string, string | number | null> }> {
  try {
    const res = await fetch(`https://gravatar.com/${username}.json`);
    if (res.ok) {
      const data = await res.json();
      if (data?.entry && data.entry.length > 0) {
        const u = data.entry[0];
        return {
          exists: true,
          data: {
            name: u.displayName || u.name?.formatted,
            url: u.profileUrl,
            avatar: u.thumbnailUrl,
          },
        };
      }
    }
    return { exists: false };
  } catch {
    return { exists: false };
  }
}

async function checkUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    return res.ok || res.status === 403;
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email") || url.pathname.split("/").pop();

    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Valid email parameter required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [localPart, domain] = email.toLowerCase().split("@");
    const provider = EMAIL_PROVIDERS[domain] || "Unknown / Custom Domain";

    let cleanUsername = localPart;
    if (domain === "gmail.com" || domain === "googlemail.com") {
      cleanUsername = localPart.split("+")[0].replace(/\./g, "");
    }

    let mxRecords: string[] = [];
    try {
      const dnsRes = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=MX`, {
        headers: { "Accept": "application/dns-json" },
      });
      if (dnsRes.ok) {
        const dns = await dnsRes.json();
        if (dns.Answer) {
          mxRecords = dns.Answer.map((r: { data: string }) => r.data);
        }
      }
    } catch (_) {}

    const platforms: { platform: string; icon: string; checker: () => Promise<{ exists: boolean; data?: Record<string, string | number | null> }> }[] = [
      { platform: "GitHub", icon: "github", checker: () => checkGitHub(cleanUsername) },
      { platform: "GitLab", icon: "gitlab", checker: () => checkGitLab(cleanUsername) },
      { platform: "Reddit", icon: "reddit", checker: () => checkReddit(cleanUsername) },
      { platform: "Keybase", icon: "keybase", checker: () => checkKeybase(cleanUsername) },
      { platform: "Gravatar", icon: "gravatar", checker: () => checkGravatar(cleanUsername) },
    ];

    const apiResults = await Promise.all(platforms.map(async (p) => {
      const result = await p.checker();
      return {
        platform: p.platform,
        icon: p.icon,
        exists: result.exists,
        data: result.data,
      };
    }));

    const profiles: PlatformResult[] = [];
    let githubData: Record<string, string | number | null> | null = null;

    for (const r of apiResults) {
      if (r.exists) {
        let profileUrl = "";
        switch (r.platform) {
          case "GitHub": profileUrl = `https://github.com/${cleanUsername}`; break;
          case "GitLab": profileUrl = `https://gitlab.com/${cleanUsername}`; break;
          case "Reddit": profileUrl = `https://reddit.com/user/${cleanUsername}`; break;
          case "Keybase": profileUrl = `https://keybase.io/${cleanUsername}`; break;
          case "Gravatar": profileUrl = `https://gravatar.com/${cleanUsername}`; break;
        }
        profiles.push({
          platform: r.platform,
          icon: r.icon,
          url: profileUrl,
          username: cleanUsername,
          exists: true,
        });
        if (r.platform === "GitHub" && r.data) {
          githubData = r.data;
        }
      }
    }

    const scrapePlatforms = [
      { name: "Twitter/X", url: (u: string) => `https://x.com/${u}`, icon: "twitter" },
      { name: "Instagram", url: (u: string) => `https://instagram.com/${u}`, icon: "instagram" },
      { name: "TikTok", url: (u: string) => `https://www.tiktok.com/@${u}`, icon: "tiktok" },
      { name: "Twitch", url: (u: string) => `https://twitch.tv/${u}`, icon: "twitch" },
      { name: "Telegram", url: (u: string) => `https://t.me/${u}`, icon: "telegram" },
      { name: "YouTube", url: (u: string) => `https://youtube.com/@${u}`, icon: "youtube" },
      { name: "SoundCloud", url: (u: string) => `https://soundcloud.com/${u}`, icon: "soundcloud" },
      { name: "Medium", url: (u: string) => `https://medium.com/@${u}`, icon: "medium" },
      { name: "DeviantArt", url: (u: string) => `https://deviantart.com/${u}`, icon: "deviantart" },
      { name: "Pinterest", url: (u: string) => `https://pinterest.com/${u}`, icon: "pinterest" },
    ];

    for (const p of scrapePlatforms) {
      const exists = await checkUrl(p.url(cleanUsername));
      if (exists) {
        profiles.push({
          platform: p.name,
          icon: p.icon,
          url: p.url(cleanUsername),
          username: cleanUsername,
          exists: true,
        });
      }
    }

    const result = {
      email,
      localPart,
      domain,
      cleanUsername,
      provider,
      mxRecords,
      profiles,
      github: githubData,
      summary: {
        totalFound: profiles.length,
        platformsFound: profiles.map(p => p.platform),
      },
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to process email" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
