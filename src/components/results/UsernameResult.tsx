import { User, ExternalLink, MapPin, Building, Calendar, Link as LinkIcon } from "lucide-react";
import type { UsernameResult, SocialProfile } from "../../types/osint";

function ProfileCard({ profile }: { profile: SocialProfile }) {
  return (
    <a
      href={profile.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all group"
    >
      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-sm font-bold text-white">
        {profile.platform[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white font-medium">{profile.platform}</div>
        <div className="text-[11px] text-white/40 font-mono truncate">{profile.url}</div>
      </div>
      <ExternalLink size={14} className="text-white/30 group-hover:text-white/60 transition-colors" />
    </a>
  );
}

export default function UsernameResultView({ data }: { data: UsernameResult }) {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg">
        <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-black">
          <User size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xl font-bold text-white font-mono">@{data.username}</div>
          <div className="text-sm text-white/40">{data.profiles.length} platforms scanned</div>
        </div>
      </div>

      {/* GitHub Verified Profile */}
      {data.github && data.github.exists && (
        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          <div className="bg-white text-black px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 m-4 rounded">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            GitHub Verified
          </div>

          <div className="flex items-start gap-4 px-4 pb-4">
            <img
              src={data.github.avatar}
              alt={data.github.login}
              className="w-16 h-16 rounded-xl object-cover border border-white/10"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold text-white">{data.github.name || data.github.login}</span>
                <span className="text-xs text-white/40 font-mono">@{data.github.login}</span>
              </div>

              {data.github.bio && (
                <p className="text-sm text-white/60 mb-3">{data.github.bio}</p>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/40">
                <span className="flex items-center gap-1">
                  <User size={12} />
                  {data.github.followers} followers
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  {data.github.repos} repos
                </span>
                {data.github.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {data.github.location}
                  </span>
                )}
                {data.github.company && (
                  <span className="flex items-center gap-1">
                    <Building size={12} />
                    {data.github.company}
                  </span>
                )}
                {data.github.created && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    Joined {new Date(data.github.created).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                )}
                {data.github.blog && (
                  <a href={data.github.blog.startsWith('http') ? data.github.blog : `https://${data.github.blog}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white/80 transition-colors">
                    <LinkIcon size={12} />
                    Website
                  </a>
                )}
              </div>
            </div>

            <a
              href={data.github.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors flex-shrink-0"
            >
              View Profile
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}

      {/* Platform Links */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="text-[10px] text-white/40 uppercase tracking-widest mb-3">Potential Profiles</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {data.profiles.map(p => <ProfileCard key={p.platform} profile={p} />)}
        </div>
        <p className="text-[10px] text-white/30 mt-3">Profile links are generated. Verification requires manual check.</p>
      </div>
    </div>
  );
}
