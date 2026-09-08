import React, { useState } from "react";
import { X, Copy, Check, MessageCircle, Share2, Send, Globe, Mail } from "lucide-react";
import { useLang } from "../context/LanguageContext";

export default function ShareModal({
  isOpen,
  onClose,
  title,
  url,
  onCopySuccess,
  onShare,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  onCopySuccess?: () => void;
  onShare?: (channel: string) => void;
}) {
  const { lang } = useLang();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  function copyToClipboard() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    onShare?.("copy");
    if (onCopySuccess) onCopySuccess();
    setTimeout(() => setCopied(false), 2000);
  }

  const shareLinks = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-[#25D366] text-white hover:bg-[#20ba5a]",
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      name: "Telegram",
      icon: Send,
      color: "bg-[#0088cc] text-white hover:bg-[#0077b5]",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: "Web / Social",
      icon: Globe,
      color: "bg-[#1877F2] text-white hover:bg-[#166fe5]",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
    {
      name: "Email",
      icon: Mail,
      color: "bg-[#EA4335] text-white hover:bg-[#d33828]",
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#091D16] border border-white/15 p-6 shadow-2xl text-warm-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#F3B728]/15 text-[#F3B728]">
              <Share2 size={18} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-warm-white">
                {lang === "sw" ? "Shiriki Maudhui" : "Share Content"}
              </h3>
              <p className="text-[11px] text-white/60 line-clamp-1">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-4 gap-2.5 my-5">
          {shareLinks.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onShare?.(item.name.toLowerCase())}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition group"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color} transition shadow`}>
                  <Icon size={18} />
                </div>
                <span className="text-[10px] font-medium text-white/80 group-hover:text-white truncate">
                  {item.name}
                </span>
              </a>
            );
          })}
        </div>

        {/* Copy Link input box */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <label className="block text-[10.5px] font-bold uppercase tracking-wider text-emerald-400 mb-1.5">
            {lang === "sw" ? "Au nakili kiungo" : "Or copy link"}
          </label>
          <div className="flex items-center gap-2 rounded-xl bg-[#040C08] border border-white/15 px-3 py-2">
            <input
              type="text"
              readOnly
              value={url}
              className="w-full bg-transparent text-xs text-white/90 outline-none select-all"
            />
            <button
              onClick={copyToClipboard}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-[#F3B728] text-[#07130E] hover:bg-[#ffd166]"
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? (lang === "sw" ? "Imenakiliwa!" : "Copied!") : (lang === "sw" ? "Nakili" : "Copy")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
