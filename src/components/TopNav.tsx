import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useLang } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import KhatamStar from "./KhatamStar";
import {
  Home,
  Grid2x2,
  Bookmark,
  Coins,
  User as UserIcon,
  Shield,
  Search,
  X,
  Globe,
  ChevronDown,
} from "lucide-react";

export default function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const { lang, setLang, t } = useLang();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (pathname === "/home" && q) setSearchQuery(q);
  }, [pathname, searchParams]);

  const navItems = [
    {
      href: "/home",
      labelSw: "Nyumbani",
      labelEn: "Home",
      icon: Home,
      match: (p: string) => p === "/home" || p === "/",
    },
    {
      href: "/categories",
      labelSw: "Aina",
      labelEn: "Categories",
      icon: Grid2x2,
      match: (p: string) => p.startsWith("/categories") || p.startsWith("/category"),
    },
    {
      href: "/subscribe",
      labelSw: "Fungua",
      labelEn: "Unlock",
      icon: Coins,
      match: (p: string) => p.startsWith("/subscribe"),
    },
    {
      href: "/saved",
      labelSw: "Zilizohifadhiwa",
      labelEn: "Saved",
      icon: Bookmark,
      match: (p: string) => p.startsWith("/saved"),
    },
    {
      href: "/profile",
      labelSw: "Wasifu",
      labelEn: "Profile",
      icon: UserIcon,
      match: (p: string) => p.startsWith("/profile"),
    },
  ];

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      navigate("/home");
      return;
    }
    navigate(`/home?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-deep-green border-b border-white/10 shadow-md">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-14 flex items-center justify-between gap-6">

        {/* ── Brand ── */}
        <Link
          to="/home"
          className="flex items-center gap-2.5 flex-shrink-0 group"
        >
          <div className="h-8 w-8 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold shadow-inner group-hover:bg-gold/30 transition">
            <KhatamStar size={17} className="text-gold" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-[15px] font-black tracking-wide text-warm-white">
              Qisas al-Anbiyaa
            </span>
            <span className="text-[8px] font-bold tracking-widest text-gold-light/70 uppercase">
              Stories &amp; Wisdom
            </span>
          </div>
        </Link>

        {/* ── Centre nav links ── */}
        <nav className="flex items-center gap-0.5" aria-label="Main navigation">
          {navItems.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            const label = lang === "sw" ? item.labelSw : item.labelEn;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12.5px] font-bold transition-all duration-150 ${
                  active
                    ? "bg-gold text-deep-green shadow-sm"
                    : "text-warm-white/75 hover:text-warm-white hover:bg-white/10"
                }`}
              >
                <Icon
                  size={14}
                  strokeWidth={active ? 2.5 : 2}
                  className="flex-shrink-0"
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ── Right actions ── */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* Search toggle */}
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label={searchOpen ? "Close search" : "Open search"}
            className={`flex items-center justify-center h-8 w-8 rounded-xl border transition ${
              searchOpen
                ? "bg-gold text-deep-green border-gold"
                : "bg-white/10 text-warm-white/80 hover:text-warm-white border-white/10 hover:bg-white/15"
            }`}
          >
            {searchOpen ? <X size={14} /> : <Search size={14} />}
          </button>

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === "sw" ? "en" : "sw")}
            title={lang === "sw" ? "Switch to English" : "Badili Kiswahili"}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/8 hover:bg-white/15 border border-white/10 text-[11px] font-bold text-warm-white/85 hover:text-warm-white transition"
          >
            <Globe size={12} className="text-gold-light flex-shrink-0" />
            <span>{lang === "sw" ? "EN" : "SW"}</span>
          </button>

          {/* Admin badge */}
          {user?.role === "ADMIN" && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-teal/20 hover:bg-teal/30 border border-teal/30 text-teal-light text-[11px] font-bold transition"
            >
              <Shield size={12} />
              <span>Admin</span>
            </Link>
          )}

          {/* User avatar pill */}
          {user ? (
            <Link
              to="/profile"
              className="flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition group"
            >
              <span className="text-[12px] font-semibold text-warm-white/90 max-w-[90px] truncate">
                {user.name.split(" ")[0]}
              </span>
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-teal to-gold flex items-center justify-center text-[10px] font-black text-deep-green shadow flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </Link>
          ) : (
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-xl text-warm-white/80 hover:text-white hover:bg-white/10 text-[12px] font-semibold transition"
            >
              {lang === "sw" ? "Hifadhi" : "Save"}
            </Link>
          )}
        </div>
      </div>

      {/* ── Expandable inline search bar ── */}
      {searchOpen && (
        <div className="border-t border-white/10 bg-deep-green/95 backdrop-blur-sm px-6 lg:px-10 py-2.5">
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto flex items-stretch"
            role="search"
          >
            <div className="relative min-w-0 flex-1">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === "sw"
                    ? "Tafuta hadithi za mitume, maswahaba..."
                    : "Search prophets, companions, stories..."
                }
                autoFocus
                enterKeyHint="search"
                className="w-full bg-white/10 text-warm-white placeholder:text-white/40 text-[13px] rounded-l-xl rounded-r-none pl-9 pr-9 py-2 border border-white/15 border-r-0 focus:border-gold-light focus:bg-white/15 outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition"
                  aria-label={lang === "sw" ? "Futa" : "Clear"}
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-r-xl bg-gold hover:bg-gold-light px-4 text-deep-green text-[12px] font-black border border-gold transition active:scale-[0.98]"
            >
              <Search size={14} />
              <span>{lang === "sw" ? "Tafuta" : "Search"}</span>
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
