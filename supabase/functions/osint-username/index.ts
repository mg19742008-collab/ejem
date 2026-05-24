import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PLATFORMS = [
  { name: "GitHub", url: (u: string) => `https://github.com/${u}`, icon: "github", type: "api" },
  { name: "GitLab", url: (u: string) => `https://gitlab.com/${u}`, icon: "gitlab", type: "api" },
  { name: "Reddit", url: (u: string) => `https://www.reddit.com/user/${u}`, icon: "reddit", type: "api" },
  { name: "Keybase", url: (u: string) => `https://keybase.io/${u}`, icon: "keybase", type: "api" },
  { name: "Gravatar", url: (u: string) => `https://gravatar.com/${u}`, icon: "gravatar", type: "api" },
  { name: "Twitter/X", url: (u: string) => `https://x.com/${u}`, icon: "twitter", type: "scrape" },
  { name: "Instagram", url: (u: string) => `https://instagram.com/${u}`, icon: "instagram", type: "scrape" },
  { name: "TikTok", url: (u: string) => `https://www.tiktok.com/@${u}`, icon: "tiktok", type: "scrape" },
  { name: "Twitch", url: (u: string) => `https://twitch.tv/${u}`, icon: "twitch", type: "scrape" },
  { name: "Telegram", url: (u: string) => `https://t.me/${u}`, icon: "telegram", type: "scrape" },
  { name: "YouTube", url: (u: string) => `https://youtube.com/@${u}`, icon: "youtube", type: "scrape" },
  { name: "SoundCloud", url: (u: string) => `https://soundcloud.com/${u}`, icon: "soundcloud", type: "scrape" },
  { name: "Medium", url: (u: string) => `https://medium.com/@${u}`, icon: "medium", type: "scrape" },
  { name: "DeviantArt", url: (u: string) => `https://deviantart.com/${u}`, icon: "deviantart", type: "scrape" },
  { name: "Pinterest", url: (u: string) => `https://pinterest.com/${u}`, icon: "pinterest", type: "scrape" },
  { name: "Spotify", url: (u: string) => `https://open.spotify.com/user/${u}`, icon: "spotify", type: "scrape" },
];

interface Profile {
  platform: string;
  icon: string;
  url: string;
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
            avatar: data.data.icon_img || data.data.snoovatar_img,
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
            location: u.profile?.location,
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
            location: u.currentLocation,
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
    const username = url.searchParams.get("username") || url.pathname.split("/").pop();

    if (!username) {
      return new Response(JSON.stringify({ error: "Username required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clean = username.replace(/[^a-zA-Z0-9_.-]/g, "").toLowerCase();

    const platforms: { platform: string; checker: () => Promise<{ exists: boolean; data?: Record<string, string | number | null> }> }[] = [
      { platform: "GitHub", checker: () => checkGitHub(clean) },
      { platform: "GitLab", checker: () => checkGitLab(clean) },
      { platform: "Reddit", checker: () => checkReddit(clean) },
      { platform: "Keybase", checker: () => checkKeybase(clean) },
      { platform: "Gravatar", checker: () => checkGravatar(clean) },
    ];

    const apiResults = await Promise.all(platforms.map(async (p) => {
      const result = await p.checker();
      return {
        platform: p.platform,
        exists: result.exists,
        data: result.data,
      };
    }));

    const profiles: Profile[] = [];
    let githubData: Record<string, string | number | null> | null = null;

    for (const r of apiResults) {
      if (r.exists) {
        const platformInfo = PLATFORMS.find(p => p.name === r.platform);
        if (platformInfo) {
          profiles.push({
            platform: r.platform,
            icon: platformInfo.icon,
            url: platformInfo.url(clean),
            username: clean,
            exists: true,
          });
        }
        if (r.platform === "GitHub" && r.data) {
          githubData = r.data;
        }
      }
    }

    const scrapePlatforms = PLATFORMS.filter(p => p.type === "scrape");
    for (const p of scrapePlatforms) {
      const exists = await checkUrl(p.url(clean));
      if (exists) {
        profiles.push({
          platform: p.name,
          icon: p.icon,
          url: p.url(clean),
          username: clean,
          exists: true,
        });
      }
    }

    const result = {
      username: clean,
      profiles,
      github: githubData,
      timestamp: new Date().toISOString(),
      summary: {
        totalFound: profiles.length,
        platformsFound: profiles.map(p => p.platform),
      },
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to lookup username" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
