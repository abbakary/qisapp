import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useLang } from "../context/LanguageContext";

const items = [
  { href: "/home", key: "home" as const, icon: HomeIcon },
  { href: "/categories", key: "categories" as const, icon: GridIcon },
  { href: "/saved", key: "saved" as const, icon: BookmarkIcon },
  { href: "/profile", key: "profile" as const, icon: UserIcon },
];

export default function BottomNav() {
  const location = useLocation();
  const pathname = location.pathname;
  const { t } = useLang();

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 inset-x-0 z-50 border-t border-line bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.08)] w-full"
    >
      <div className="w-full max-w-md md:max-w-lg mx-auto flex items-center justify-around px-3 pt-2 pb-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] md:py-2.5">
        {items.map(({ href, key, icon: Icon }) => {
          const active =
            href === "/home" ? pathname === "/home" || pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              to={href}
              className={`flex flex-col items-center gap-1 text-[8.5px] md:text-[10px] font-bold transition ${
                active ? "text-deep-green" : "text-muted hover:text-deep-green"
              }`}
            >
              <span
                className={`flex h-[26px] w-[26px] md:h-[30px] md:w-[30px] items-center justify-center rounded-lg transition ${
                  active ? "bg-gold text-deep-green shadow-sm" : "bg-sand text-muted"
                }`}
              >
                <Icon />
              </span>
              {t(key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function BookmarkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12v18l-6-4-6 4z" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}
