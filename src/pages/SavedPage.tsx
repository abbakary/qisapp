import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import SeriesCard, { type SeriesCardData } from "../components/SeriesCard";
import { db, toSeriesCard, subscribeDb } from "../lib/mock/db";

export default function SavedPage() {
  const { lang, t } = useLang();
  const { user } = useAuth();
  const [, setDbVersion] = useState(0);

  useEffect(() => {
    return subscribeDb(() => setDbVersion((v) => v + 1));
  }, []);

  const savedSeries: SeriesCardData[] = useMemo(() => {
    if (!user?.id) return [];
    const favs = db.favorites.findMany(user.id);
    return favs.flatMap((f) => {
      const s = db.series.findById(f.seriesId);
      return s ? [toSeriesCard(s)] : [];
    });
  }, [user?.id]);

  return (
    <div className="flex-1 flex flex-col bg-warm-white">
      <div className="rounded-b-3xl bg-deep-green px-4 sm:px-5 md:px-10 lg:px-16 pb-5 md:pb-7 pt-5 md:pt-6 text-warm-white shadow-md flex-shrink-0">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-[10.5px] md:text-xs uppercase tracking-[0.05em] text-gold-light font-bold">
            {t("saved")}
          </div>
          <div className="font-display text-[19px] md:text-2xl font-bold mt-0.5">
            {savedSeries.length} {lang === "sw" ? "misururu" : "series"}
          </div>
        </div>
      </div>

      {savedSeries.length === 0 ? (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-5 py-16 text-center pb-24 md:pb-10">
          <p className="text-[13px] text-muted">{t("noFavorites")}</p>
          <Link
            to="/home"
            className="mt-4 inline-block rounded-xl bg-sand px-4 py-2 text-[12px] font-bold text-deep-green hover:bg-[#e4dbbe] transition cursor-pointer"
          >
            {t("home")}
          </Link>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-5 md:px-10 lg:px-16 py-5 md:py-8 pb-24 md:pb-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4 md:gap-5">
            {savedSeries.map((s) => (
              <SeriesCard key={s.slug} s={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
