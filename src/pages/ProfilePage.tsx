import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import LangToggle from "../components/LangToggle";
import { db, subscribeDb } from "../lib/mock/db";

export default function ProfilePage() {
  const { lang, t } = useLang();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState(true);
  const [, setDbVersion] = useState(0);

  useEffect(() => {
    return subscribeDb(() => setDbVersion((v) => v + 1));
  }, []);

  const completedCount = useMemo(() => {
    if (!user?.id) return 0;
    return db.progress.countCompleted(user.id);
  }, [user?.id]);

  const favoriteCount = useMemo(() => {
    if (!user?.id) return 0;
    return db.favorites.count(user.id);
  }, [user?.id]);

  const fullUser = user?.id ? db.users.findById(user.id) : null;
  const since = fullUser?.createdAt
    ? new Date(fullUser.createdAt).toLocaleDateString(lang === "sw" ? "sw-TZ" : "en-GB", {
        month: "long",
        year: "numeric",
      })
    : "September 2026";

  function handleLogout() {
    logout();
    navigate("/home");
  }

  return (
    <div className="flex-1 flex flex-col bg-warm-white">
      <div className="rounded-b-3xl bg-deep-green px-4 sm:px-5 md:px-10 lg:px-16 pb-7 md:pb-10 pt-6 md:pt-8 text-center text-white shadow-md flex-shrink-0">
        <div className="max-w-xl mx-auto">
          <div className="mx-auto mb-2.5 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full border-2 border-white/30 bg-gold font-display text-[22px] md:text-2xl text-deep-green shadow-inner">
            {(user?.name || "?").charAt(0).toUpperCase()}
          </div>
          <h1 className="font-display text-[16px] md:text-xl font-bold">{user?.name}</h1>
          <div className="mt-0.5 text-[11px] md:text-xs font-mono text-gold-light">
            {user?.phone ? `📱 ${user.phone}` : user?.email}
          </div>
          <div className="mt-0.5 text-[10.5px] md:text-xs text-[#cfc9ae]">
            {t("member")} · {since}
          </div>

          <div className="mt-4 flex justify-center gap-7 md:gap-12">
            <div>
              <b className="block font-display text-[15px] md:text-lg">{completedCount}</b>
              <span className="text-[9px] md:text-[10px] text-[#CFC9AE]">{t("completed")}</span>
            </div>
            <div>
              <b className="block font-display text-[15px] md:text-lg">{favoriteCount}</b>
              <span className="text-[9px] md:text-[10px] text-[#CFC9AE]">{t("saved")}</span>
            </div>
            <div>
              <b className="block font-display text-[15px] md:text-lg">{lang.toUpperCase()}</b>
              <span className="text-[9px] md:text-[10px] text-[#CFC9AE]">{t("language")}</span>
            </div>
          </div>
        </div>
      </div>

        <div className="flex flex-col gap-2.5 max-w-xl md:max-w-2xl mx-auto w-full px-4 sm:px-5 py-6 pb-28 md:pb-10">
        <Link to="/subscribe" className="flex items-center gap-3 rounded-2xl bg-white p-3.5 card-shadow transition hover:bg-warm-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-deep-green font-black text-xs">
            {db.unlocks.mine().length || "1"}
          </span>
          <div className="min-w-0">
            <div className="text-[12px] font-bold text-deep-green">
              {lang === "sw"
                ? `Hadithi ${db.unlocks.mine().length} umilikiwa milele`
                : `${db.unlocks.mine().length} stories owned forever`}
            </div>
            <div className="text-[10px] text-muted truncate">
              {lang === "sw"
                ? "Kipindi cha kwanza ni bure. Fungua yaliyobaki mara moja — bila kuisha."
                : "Episode 1 is free. Unlock the rest once — they never expire."}
            </div>
          </div>
          <span className="ml-auto text-[12px] text-muted">→</span>
        </Link>
        {(user?.streakDays || 0) > 0 && (
          <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 card-shadow">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sand text-gold-dark font-black text-xs">
              {user?.streakDays}
            </span>
            <div>
              <div className="text-[12px] font-bold text-deep-green">
                {lang === "sw" ? "Mfululizo wa watoto (bure)" : "Kids streak (always free)"}
              </div>
              <div className="text-[10px] text-muted">
                {(user?.badges || []).length
                  ? user!.badges!.join(" · ")
                  : lang === "sw"
                  ? "Beji zinakuja unaporudi kila siku"
                  : "Badges arrive as you come back daily"}
              </div>
            </div>
          </div>
        )}
        <Link to="/saved" className="flex items-center gap-3 rounded-2xl bg-white p-3.5 card-shadow transition hover:bg-warm-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sand text-gold-dark">★</span>
          <span className="text-[12px] font-bold text-deep-green">{t("saved")}</span>
          <span className="ml-auto text-[12px] text-muted">{favoriteCount}</span>
        </Link>

        <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 card-shadow">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sand">🌐</span>
          <span className="text-[12px] font-bold text-deep-green">
            {lang === "sw" ? "Lugha: Kiswahili / English" : "Language: Swahili / English"}
          </span>
          <span className="ml-auto">
            <LangToggle />
          </span>
        </div>

        <button
          onClick={() => setAlerts((v) => !v)}
          className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-3.5 text-left card-shadow hover:bg-warm-white transition"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sand">🔔</span>
          <span className="text-[12px] font-bold text-deep-green">{t("newEpisodeAlerts")}</span>
          <span
            className={`relative ml-auto h-5 w-9 rounded-full transition duration-300 ${
              alerts ? "bg-gold" : "bg-line"
            }`}
          >
            <i
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-xs transition-all duration-300 ${
                alerts ? "right-0.5" : "left-0.5"
              }`}
            />
          </span>
        </button>

        {user?.role === "ADMIN" && (
          <Link
            to="/admin"
            className="flex items-center gap-3 rounded-2xl bg-deep-green p-3.5 text-warm-white shadow-md transition hover:bg-teal"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">⚙</span>
            <span className="text-[12px] font-bold">{t("adminPanel")}</span>
            <span className="ml-auto text-[13px]">→</span>
          </Link>
        )}

        <button
          onClick={handleLogout}
          className="mt-2 flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-3.5 text-left card-shadow hover:bg-red-50 transition"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sand text-red-700">⏻</span>
          <span className="text-[12px] font-bold text-red-700">{t("logout")}</span>
        </button>
      </div>
    </div>
  );
}
