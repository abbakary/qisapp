import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Info, ChevronLeft, ChevronRight, Eye, Heart } from "lucide-react";
import { useLang, pick } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import type { Lang } from "../lib/i18n";
import { db, type Series } from "../lib/mock/db";
import KhatamStar from "./KhatamStar";

export interface SlideItem {
  series: Series;
  firstEpisodeId?: string;
  badgeLabel: string;
  episodeCount?: number;
  theme: {
    bgGradient: string;
    border: string;
    badgeBg: string;
    accentColor: string;
  };
}

const INTERVAL = 3200; // ms — always advances, regardless of hover

export default function HomeHeroSlideshow({ items }: { items: SlideItem[] }) {
  const { lang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection]       = useState<"next" | "prev">("next");
  const [animKey, setAnimKey]           = useState(0);
  const [progress, setProgress]         = useState(0);
  const [likedMap, setLikedMap]         = useState<Record<string, boolean>>({});

  const total         = items.length;
  const intervalRef   = useRef<number | null>(null);
  const rafRef        = useRef<number | null>(null);
  const slideStartRef = useRef<number>(Date.now());
  // currentIndex as a ref so RAF callback always reads the latest value
  const indexRef      = useRef(0);
  useEffect(() => { indexRef.current = currentIndex; }, [currentIndex]);

  // ── helpers ───────────────────────────────────────────────────────────────

  const stopAll = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (rafRef.current)      { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  /** Animate the progress bar for the current slide */
  const startProgressRAF = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    slideStartRef.current = Date.now();

    const frame = () => {
      const elapsed = Date.now() - slideStartRef.current;
      const pct = Math.min(100, (elapsed / INTERVAL) * 100);
      setProgress(pct);
      if (pct < 100) rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
  }, []);

  /** Advance to a specific index and restart timing */
  const goTo = useCallback((idx: number, dir: "next" | "prev") => {
    setDirection(dir);
    setCurrentIndex(idx);
    setAnimKey((k) => k + 1);
    setProgress(0);
    startProgressRAF();
  }, [startProgressRAF]);

  /** Start the auto-advance interval — always runs, never pauses */
  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      const next = (indexRef.current + 1) % total;
      goTo(next, "next");
    }, INTERVAL);
  }, [goTo, total]);

  // Mount / total change: kick off interval + progress bar
  useEffect(() => {
    if (total <= 1) return;
    startProgressRAF();
    startInterval();
    return stopAll;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  // ── user interactions ─────────────────────────────────────────────────────

  function handleNext() {
    stopAll();
    goTo((currentIndex + 1) % total, "next");
    startInterval();
  }

  function handlePrev() {
    stopAll();
    goTo((currentIndex - 1 + total) % total, "prev");
    startInterval();
  }

  function handleDotClick(idx: number) {
    if (idx === currentIndex) return;
    stopAll();
    goTo(idx, idx > currentIndex ? "next" : "prev");
    startInterval();
  }

  function handleLike(e: React.MouseEvent, seriesId: string) {
    e.preventDefault();
    e.stopPropagation();
    const next = !likedMap[seriesId];
    setLikedMap((prev) => ({ ...prev, [seriesId]: next }));
    void db.series.toggleLike(seriesId).catch(() => {
      setLikedMap((prev) => ({ ...prev, [seriesId]: !next }));
    });
  }

  if (!items || total === 0) return null;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <section className="relative w-full px-4 sm:px-5 md:px-10 lg:px-16 pt-3 sm:pt-4 md:pt-6 pb-1">
      <div className="max-w-7xl mx-auto relative">

        {/* Prev arrow */}
        <button
          onClick={handlePrev}
          aria-label="Previous"
          className="absolute left-0.5 sm:left-1 top-1/2 -translate-y-1/2 z-20
            flex h-8 w-8 sm:h-9 sm:w-9 md:h-11 md:w-11 items-center justify-center
            rounded-full bg-black/40 text-white/90 border border-white/15
            backdrop-blur-sm shadow-lg cursor-pointer
            transition-all duration-150 hover:bg-gold hover:text-deep-green hover:scale-110 active:scale-95"
        >
          <ChevronLeft size={17} />
        </button>

        {/* Next arrow */}
        <button
          onClick={handleNext}
          aria-label="Next"
          className="absolute right-0.5 sm:right-1 top-1/2 -translate-y-1/2 z-20
            flex h-8 w-8 sm:h-9 sm:w-9 md:h-11 md:w-11 items-center justify-center
            rounded-full bg-black/40 text-white/90 border border-white/15
            backdrop-blur-sm shadow-lg cursor-pointer
            transition-all duration-150 hover:bg-gold hover:text-deep-green hover:scale-110 active:scale-95"
        >
          <ChevronRight size={17} />
        </button>

        {/* Viewport */}
        <div className="relative h-[180px] sm:h-[230px] md:h-[300px] lg:h-[360px]
          overflow-hidden rounded-2xl md:rounded-3xl shadow-xl">
          <SlideCard
            key={animKey}
            item={items[currentIndex]}
            lang={lang}
            navigate={navigate}
            direction={direction}
            isLiked={likedMap[items[currentIndex].series.id]}
            onLike={(e) => handleLike(e, items[currentIndex].series.id)}
            resumeEpisodeId={
              user?.id
                ? db.progress.resumeTarget(user.id, items[currentIndex].series.id)?.episodeId
                : undefined
            }
          />
        </div>

        {/* Dots with live progress bar */}
        <div className="mt-3 md:mt-4 flex items-center justify-center gap-2">
          {items.map((item, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={item.series.id}
                onClick={() => handleDotClick(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`relative overflow-hidden rounded-full cursor-pointer
                  transition-all duration-300 ${
                  isActive
                    ? "w-8 sm:w-10 md:w-12 h-1.5 md:h-2 bg-white/20"
                    : "w-1.5 md:w-2 h-1.5 md:h-2 bg-white/30 hover:bg-white/60"
                }`}
              >
                {isActive && (
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-gold"
                    style={{ width: `${progress}%` }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── SlideCard ────────────────────────────────────────────────────────────────

function SlideCard({
  item, lang, navigate, direction, isLiked, onLike, resumeEpisodeId,
}: {
  item: SlideItem;
  lang: Lang;
  navigate: (path: string) => void;
  direction: "next" | "prev";
  isLiked?: boolean;
  onLike: (e: React.MouseEvent) => void;
  resumeEpisodeId?: string;
}) {
  const { series, firstEpisodeId, badgeLabel } = item;
  const title       = pick(lang, series.titleSw,       series.title);
  const description = pick(lang, series.descriptionSw, series.description);

  function handlePlay(e: React.MouseEvent) {
    e.stopPropagation();
    navigate(`/series/${series.slug}`);
  }
  function handleInfo(e: React.MouseEvent) {
    e.stopPropagation();
    navigate(`/series/${series.slug}`);
  }

  return (
    <div
      onClick={() => navigate(`/series/${series.slug}`)}
      className={`group relative h-full w-full cursor-pointer overflow-hidden
        rounded-2xl md:rounded-3xl
        bg-gradient-to-br from-deep-green via-teal to-[#0B251D]
        p-3 sm:p-5 md:p-8 flex flex-col justify-between
        border border-white/8 text-warm-white
        ${direction === "next" ? "slide-enter-right" : "slide-enter-left"}`}
    >
      {/* Background artwork */}
      {series.image ? (
        <>
          <img
            src={series.image}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover object-[50%_30%]
              opacity-40 mix-blend-luminosity
              transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071912]/95 via-[#071912]/50 to-transparent" />
          <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#071912]/80 via-[#071912]/25 to-transparent" />
        </>
      ) : (
        <div className="absolute right-6 top-6 opacity-15 pointer-events-none">
          <KhatamStar size={100} className="text-gold-light" />
        </div>
      )}

      {/* Top row */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="rounded-lg bg-gold px-2.5 py-0.5
          text-[8px] sm:text-[9.5px] md:text-[11px]
          font-extrabold tracking-widest text-deep-green uppercase shadow">
          {badgeLabel || "QISAS ORIGINAL"}
        </span>
        <button
          onClick={onLike}
          aria-label="Like"
          className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full
            backdrop-blur-sm border border-white/20 transition active:scale-90 cursor-pointer ${
            isLiked
              ? "bg-rose-600 text-white"
              : "bg-black/35 text-white/80 hover:text-white hover:bg-black/55"
          }`}
        >
          <Heart size={13} fill={isLiked ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Bottom content */}
      <div className="relative z-10 flex flex-col gap-1 md:gap-2 max-w-2xl">
        <div className="flex items-center gap-1.5 sm:gap-2
          text-[9px] sm:text-[10px] md:text-xs text-gold-light/90 font-semibold">
          <span className="flex items-center gap-1">
            <Eye size={10} />
            {series.views ? `${(series.views / 1000).toFixed(1)}k` : "Maarufu"}
          </span>
          <span className="opacity-40">·</span>
          <span>{item.episodeCount ?? 8} {lang === "sw" ? "Vipindi" : "Eps"}</span>
        </div>

        <h3 className="font-display text-[16px] sm:text-2xl md:text-[32px] font-bold
          text-warm-white leading-tight line-clamp-1
          drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]
          group-hover:text-gold-light transition duration-200">
          {title}
        </h3>

        {description && (
          <p className="hidden sm:block text-[10px] md:text-[13px]
            text-warm-white/70 line-clamp-2 leading-relaxed max-w-lg">
            {description}
          </p>
        )}

        <div className="mt-1.5 md:mt-3 flex items-center gap-2 sm:gap-3">
          <button
            onClick={handlePlay}
            className="flex items-center gap-1.5 rounded-full bg-gold hover:bg-gold-light
              text-deep-green px-3 sm:px-5 py-1 sm:py-1.5 md:py-2
              text-[10px] sm:text-[11px] md:text-xs font-extrabold
              shadow-md transition active:scale-95 cursor-pointer"
          >
            <Play size={11} fill="currentColor" />
            <span>{lang === "sw" ? "Tazama" : "Play Now"}</span>
          </button>

          <button
            onClick={handleInfo}
            className="flex items-center gap-1 rounded-full
              bg-white/12 hover:bg-white/22
              text-warm-white border border-white/25
              px-2.5 sm:px-4 py-1 sm:py-1.5 md:py-2
              text-[10px] sm:text-[11px] md:text-xs font-bold
              backdrop-blur-sm transition active:scale-95 cursor-pointer"
          >
            <Info size={11} />
            <span>{lang === "sw" ? "Zaidi" : "Info"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
