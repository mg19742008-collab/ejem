import { Mail, AtSign, Server, ExternalLink, Globe, Star, GitFork, CheckCircle } from "lucide-react";
import type { EmailResult, SocialProfile } from "../../types/osint";

function ProfileLink({ profile }: { profile: SocialProfile }) {
  return (
    <a
      href={profile.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all group"
    >
      <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white">
        {profile.platform[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white">{profile.platform}</div>
        <div className="text-[10px] text-white/40 font-mono truncate">{profile.url}</div>
      </div>
      <ExternalLink size={12} className="text-white/30 group-hover:text-white/60" />
    </a>
  );
}

export default function EmailResultView({ data }: { data: EmailResult }) {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg">
        <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-black">
          <Mail size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xl font-bold text-white font-mono">{data.email}</div>
          <div className="text-sm text-white/40">{data.provider}</div>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-white text-black text-[10px] font-bold uppercase">
          Analyzed
        </div>
      </div>

      {/* Email Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3 text-white/40">
            <AtSign size={12} />
            <span className="text-[10px] uppercase tracking-widest">Structure</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[9px] text-white/40 uppercase mb-0.5">Username</div>
              <div className="font-mono text-sm text-white">{data.localPart}</div>
            </div>
            {data.cleanUsername !== data.localPart && (
              <div>
                <div className="text-[9px] text-white/40 uppercase mb-0.5">Canonical</div>
                <div className="font-mono text-sm text-white/60">{data.cleanUsername}</div>
              </div>
            )}
            <div>
              <div className="text-[9px] text-white/40 uppercase mb-0.5">Domain</div>
              <div className="font-mono text-sm text-white">{data.domain}</div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3 text-white/40">
            <Server size={12} />
            <span className="text-[10px] uppercase tracking-widest">Provider</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[9px] text-white/40 uppercase mb-0.5">Service</div>
              <div className="text-sm text-white">{data.provider}</div>
            </div>
            <div>
              <div className="text-[9px] text-white/40 uppercase mb-1">MX Records</div>
              {data.mxRecords && data.mxRecords.length > 0 ? (
                <div className="space-y-0.5">
                  {data.mxRecords.slice(0, 3).map((mx, i) => (
                    <div key={i} className="font-mono text-[10px] text-white/50 truncate">{mx}</div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-white/30">None found</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3 text-white/40">
            <Globe size={12} />
            <span className="text-[10px] uppercase tracking-widest">Domain Intel</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[9px] text-white/40 uppercase mb-0.5">Domain</div>
              <div className="font-mono text-sm text-white">{data.domain}</div>
            </div>
            <a
              href={`https://www.whois.com/whois/${data.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] text-white/60 hover:text-white transition-colors bg-white/5 px-2 py-1 rounded"
            >
              WHOIS <ExternalLink size={9} />
            </a>
          </div>
        </div>
      </div>

      {/* GitHub Match */}
      {data.github && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] text-white/40 uppercase tracking-widest">GitHub Match</span>
            <span className="px-2 py-0.5 rounded bg-white text-black text-[9px] font-bold flex items-center gap-1">
              <CheckCircle size={9} />
              VERIFIED
            </span>
          </div>
          <div className="flex items-start gap-4">
            <img src={data.github.avatar} alt={data.github.login} className="w-12 h-12 rounded-lg border border-white/10" />
            <div className="flex-1">
              <div className="font-bold text-white mb-1">{data.github.name || data.github.login}</div>
              <div className="flex items-center gap-4 text-sm text-white/40">
                <span className="flex items-center gap-1"><Star size={11} />{data.github.followers} followers</span>
                <span className="flex items-center gap-1"><GitFork size={11} />{data.github.repos} repos</span>
              </div>
            </div>
            <a href={data.github.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-black text-xs font-medium hover:bg-white/90 transition-colors">
              View <ExternalLink size={10} />
            </a>
          </div>
        </div>
      )}

      {/* Social Profiles */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="text-[10px] text-white/40 uppercase tracking-widest mb-3">Potential Profiles</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {data.profiles.map(p => <ProfileLink key={p.platform} profile={p} />)}
        </div>
        <p className="text-[10px] text-white/30 mt-3">Generated from username. Manual verification required.</p>
      </div>
    </div>
  );
}
