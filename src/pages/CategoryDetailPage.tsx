import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang, pick } from "../context/LanguageContext";
import SeriesCard from "../components/SeriesCard";
import { db, toSeriesCard, subscribeDb } from "../lib/mock/db";

export default function CategoryDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLang();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "audio" | "video">("all");
  const [, setDbVersion] = useState(0);

  useEffect(() => {
    return subscribeDb(() => setDbVersion((v) => v + 1));
  }, []);

  const category = slug ? db.categories.findBySlug(slug) : null;
  const seriesList = slug
    ? db.series.findMany({ categorySlug: slug, published: true })
    : [];

  const seriesWithMedia = seriesList.map((s) => {
    const eps = db.episodes.findBySeries(s.id);
    const hasAudio = eps.some((e) => e.mediaType === "AUDIO");
    const hasVideo = eps.some((e) => e.mediaType === "VIDEO");
    return {
      ...toSeriesCard(s),
      hasAudio,
      hasVideo,
    };
  });

  const chips: { key: typeof filter; sw: string; en: string }[] = [
    { key: "all", sw: "Zote", en: "All" },
    { key: "audio", sw: "Sikiliza tu", en: "Audio" },
    { key: "video", sw: "Video", en: "Video" },
  ];

  const shown = seriesWithMedia.filter((s) =>
    filter === "all" ? true : filter === "audio" ? s.hasAudio : s.hasVideo,
  );

  if (!category) {
    return (
      <div className="p-8 text-center text-muted">
        <p>Category not found.</p>
        <button onClick={() => navigate("/categories")} className="mt-4 btn-ghost w-auto px-4 py-2">
          ← Back to categories
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-warm-white">
      {category.image ? (
        <div className="relative h-[150px] sm:h-[200px] md:h-[240px] overflow-hidden shadow-sm">
          <img src={category.image} alt="" className="h-full w-full object-cover object-[50%_32%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-warm-white via-deep-green/30 to-deep-green/50" />
          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 md:left-8 top-4 md:top-6 z-10 flex h-8 w-8 md:h-10 md:w-10 cursor-pointer items-center justify-center rounded-xl bg-black/40 text-white backdrop-blur hover:bg-black/60 transition shadow-md"
          >
            ←
          </button>
          <div className="absolute bottom-3 md:bottom-6 left-5 md:left-10 lg:left-16 right-5 md:right-10 lg:right-16 max-w-7xl mx-auto">
            <h1 className="font-display text-[20px] sm:text-2xl md:text-3xl text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] font-bold">
              {pick(lang, category.nameSw, category.name)}
            </h1>
            <div className="text-[10.5px] md:text-xs text-white/90 drop-shadow-sm font-semibold mt-0.5">
              {seriesList.length} {lang === "sw" ? "misururu" : "series"}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto w-full flex items-center gap-3 px-5 md:px-10 lg:px-16 pb-1 pt-5 md:pt-8">
          <button
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-sand text-deep-green hover:bg-[#e4dbbe] transition"
          >
            ←
          </button>
          <div>
            <h1 className="font-display text-[18px] md:text-2xl font-bold text-deep-green">
              {pick(lang, category.nameSw, category.name)}
            </h1>
            <div className="text-[10.5px] md:text-xs text-muted">
              {seriesList.length} {lang === "sw" ? "misururu" : "series"}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full px-5 md:px-10 lg:px-16 pb-1 pt-3 md:pt-4">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {chips.map((c) => (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className={`cursor-pointer whitespace-nowrap rounded-2xl px-3.5 py-1.5 text-[11px] font-bold transition ${
                filter === c.key ? "bg-deep-green text-warm-white shadow-xs" : "bg-sand text-muted hover:text-deep-green"
              }`}
            >
              {lang === "sw" ? c.sw : c.en}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="px-5 py-12 text-center text-[13px] text-muted">
          {lang === "sw" ? "Hakuna misururu hapa bado." : "No series here yet."}
        </p>
      ) : (
        <div className="max-w-7xl mx-auto w-full px-5 md:px-10 lg:px-16 py-4 md:py-6 pb-24 md:pb-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
            {shown.map((s) => (
              <SeriesCard key={s.slug} s={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

