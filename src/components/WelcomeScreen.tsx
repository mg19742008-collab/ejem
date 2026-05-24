import { Globe, User, Mail, MessageSquare, Phone, ArrowRight, Send, Image } from "lucide-react";
import type { ModuleType } from "../types/osint";

const content: Record<ModuleType, { icon: React.ReactNode; title: string; desc: string; features: string[] }> = {
  ip: {
    icon: <Globe size={28} />,
    title: "IP Intelligence",
    desc: "Geolocate and analyze any IP address",
    features: ["Country & City", "ISP & Organization", "Coordinates", "Timezone"],
  },
  username: {
    icon: <User size={28} />,
    title: "Username Intelligence",
    desc: "Map a username across platforms",
    features: ["GitHub Profile", "Social Media", "12+ Platforms", "Digital Footprint"],
  },
  email: {
    icon: <Mail size={28} />,
    title: "Email Intelligence",
    desc: "Analyze email structure and domain",
    features: ["Provider Detection", "MX Records", "Social Profiles", "Username Extraction"],
  },
  discord: {
    icon: <MessageSquare size={28} />,
    title: "Discord Intelligence",
    desc: "Decode Discord snowflake IDs",
    features: ["Profile Lookup", "Avatar & Banner", "Creation Date", "User Badges"],
  },
  phone: {
    icon: <Phone size={28} />,
    title: "Phone Intelligence",
    desc: "Lookup phone number details",
    features: ["Country Detection", "Carrier Info", "Line Type", "Validation"],
  },
  telegram: {
    icon: <Send size={28} />,
    title: "Telegram Intelligence",
    desc: "Resolve Telegram username to ID",
    features: ["User ID", "Account Type", "Verification Status", "Profile Info"],
  },
  image: {
    icon: <Image size={28} />,
    title: "Image Intelligence",
    desc: "Extract GPS location from photos",
    features: ["EXIF Extraction", "GPS Coordinates", "Reverse Geocode", "Camera Info"],
  },
};

export default function WelcomeScreen({ activeModule }: { activeModule: ModuleType }) {
  const c = content[activeModule];
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] py-12 animate-fade-in">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center mb-6">
        {c.icon}
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-white mb-2">{c.title}</h2>
      <p className="text-gray-500 text-sm mb-8">{c.desc}</p>

      {/* Features */}
      <div className="grid grid-cols-2 gap-3 mb-10">
        {c.features.map((f, i) => (
          <div key={i} className="flex items-center gap-2 px-4 py-2.5 bg-[#131313] border border-[#1a1a1a] rounded-lg">
            <ArrowRight size={12} className="text-gray-600" />
            <span className="text-sm text-gray-400">{f}</span>
          </div>
        ))}
      </div>

      {/* Hint */}
      <div className="flex items-center gap-2 text-gray-600 text-xs">
        <div className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-pulse-soft" />
        Enter a target above and press RUN
      </div>
    </div>
  );
}
