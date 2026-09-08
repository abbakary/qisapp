import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLang, pick } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { db, toSeriesCard, subscribeDb } from "../lib/mock/db";
import SeriesCard, { type SeriesCardData } from "../components/SeriesCard";
import HomeHeroSlideshow, { type SlideItem } from "../components/HomeHeroSlideshow";
import { Search, ChevronDown, X, Flame, Sparkles, Grid2x2 } from "lucide-react";
import { activeGivingCampaign } from "../lib/giving-seasons";
import { seriesMatchesQuery } from "../lib/search";

const SLIDE_THEMES = [
  {
    bgGradient: "from-deep-green via-teal to-[#082219]",
    border: "border-gold/40",
    badgeBg: "bg-gold",
    accentColor: "text-gold-light",
  },
  {
    bgGradient: "from-[#8A6E19] via-[#6B5310] to-[#2E2004]",
    border: "border-gold-light/40",
    badgeBg: "bg-gold",
    accentColor: "text-gold-light",
  },
  {
    bgGradient: "from-[#15665C] via-[#0F3D2E] to-[#0A2A20]",
    border: "border-teal-light/40",
    badgeBg: "bg-gold",
    accentColor: "text-gold-light",
  },
  {
    bgGradient: "from-[#1F493D] via-[#113127] to-[#071B14]",
    border: "border-emerald-500/40",
    badgeBg: "bg-gold",
    accentColor: "text-gold-light",
  },
];

export default function HomePage() {
  const { lang, toggle, t } = useLang();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState<"popular" | "new" | "category">("popular");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [dbVersion, setDbVersion] = useState(0);
  const categoryPickerRef = useRef<HTMLDivElement>(null);

  const queryParam = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(queryParam);

  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  useEffect(() => {
    return subscribeDb(() => setDbVersion((v) => v + 1));
  }, []);

  useEffect(() => {
    if (!categoryDropdownOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!categoryPickerRef.current?.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setCategoryDropdownOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [categoryDropdownOpen]);

  const allCategories = useMemo(() => {
    return db.categories.findMany();
  }, [dbVersion]);

  const allPublished = useMemo(() => {
    return db.series.findMany({ published: true });
  }, [dbVersion]);

  // Filtered series
  const filteredSeries: SeriesCardData[] = useMemo(() => {
    let list = [...allPublished];

    if (searchQuery.trim()) {
      list = list.filter((s) =>
        seriesMatchesQuery(s, searchQuery, {
          category: db.categories.findById(s.categoryId),
          episodes: db.episodes.findBySeries(s.id),
        }),
      );
    } else {
      if (selectedCategoryId) {
        list = list.filter((s) => s.categoryId === selectedCategoryId);
      } else if (activeFilter === "new") {
        list = [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      } else {
        // popular
        list = [...list].sort((a, b) => (b.views || 0) - (a.views || 0));
      }
    }

    return list.map(toSeriesCard);
  }, [allPublished, searchQuery, activeFilter, selectedCategoryId]);

  // Slideshow items
  const slideshowItems: SlideItem[] = useMemo(() => {
    const featuredList = allPublished.filter((s) => s.featured || (s.views || 0) > 3000).slice(0, 5);
    return featuredList.map((s, idx) => {
      const eps = db.episodes.findBySeries(s.id);
      const firstEp = eps.find((e) => e.published);
      return {
        series: s,
        firstEpisodeId: firstEp?.id,
        badgeLabel: idx % 2 === 0 ? "QISAS ORIGINAL" : (lang === "sw" ? "INAYOVUMA" : "TRENDING"),
        episodeCount: eps.length,
        theme: SLIDE_THEMES[idx % SLIDE_THEMES.length],
      };
    });
  }, [allPublished, lang]);

  // Continue watching
  const continueWatching: SeriesCardData[] = useMemo(() => {
    if (!user?.id) return [];
    return db.progress.continueWatching(user.id, 10);
  }, [user?.id, dbVersion]);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchQuery(e.target.value);
  }

  function applySearch(raw: string) {
    const val = raw.trim();
    setSearchQuery(val);
    setSearchParams(val ? { q: val } : {});
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    applySearch(searchQuery);
  }

  function clearSearch() {
    setSearchQuery("");
    setSearchParams({});
  }

  const selectedCategory = selectedCategoryId
    ? allCategories.find((c) => c.id === selectedCategoryId)
    : null;

  return (
    <div className="flex-1 flex flex-col bg-warm-white">
      {/* 1. Deep Green Header */}
      <header className="bg-deep-green px-4 sm:px-5 md:px-10 lg:px-16 pb-4 md:pb-7 pt-4 md:pt-6 text-warm-white shadow-md rounded-b-[24px] sm:rounded-b-3xl">
        <div className="max-w-7xl mx-auto w-full">
          {/* Top row: greeting + lang toggle */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[9px] sm:text-[10.5px] md:text-xs uppercase tracking-[0.06em] text-gold-light font-bold">
                ASSALAMU ALAYKUM
              </div>
              <h1 className="font-display text-[18px] sm:text-[22px] md:text-3xl font-bold text-white mt-0.5 leading-tight">
                {user?.name || (lang === "sw" ? "Karibu — soma bila ukuta" : "Welcome — browse freely")}
              </h1>
              {user && (user.streakDays || 0) > 0 && (
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold-light">
                  <Flame size={11} />
                  {user.streakDays} {lang === "sw" ? "siku mfululizo" : "day streak"}
                  {(user.badges || []).includes("streak-7")
                    ? ` · ${lang === "sw" ? "nyota ya wiki" : "week star"}`
                    : (user.badges || []).includes("streak-3")
                    ? ` · ${lang === "sw" ? "beji" : "badge"}`
                    : ""}
                </div>
              )}
            </div>
            <button
              onClick={toggle}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-bold text-gold-light hover:bg-white/20 transition cursor-pointer flex-shrink-0"
            >
              {lang === "sw" ? "EN" : "SW"}
            </button>
          </div>

          {/* Search bar — full width on mobile */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex w-full items-stretch"
            role="search"
          >
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" size={14} />
              <input
                type="search"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={lang === "sw" ? "Tafuta hadithi..." : "Search stories..."}
                enterKeyHint="search"
                className="w-full rounded-l-xl rounded-r-none bg-white/10 pl-9 pr-8 py-2.5 text-[13px] text-warm-white placeholder:text-white/50 outline-none border border-white/15 border-r-0 focus:border-gold-light focus:bg-white/15 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-0.5 cursor-pointer"
                  aria-label={lang === "sw" ? "Futa" : "Clear"}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="flex flex-shrink-0 items-center gap-1.5 rounded-r-xl bg-gold hover:bg-gold-light px-3.5 sm:px-4 text-deep-green text-[12px] font-black border border-gold transition active:scale-[0.98] cursor-pointer"
            >
              <Search size={14} />
              <span className="hidden sm:inline">{lang === "sw" ? "Tafuta" : "Search"}</span>
            </button>
          </form>
        </div>
      </header>

      {/* 2. Continuous Hero Slideshow (matching user request & styled in authentic theme) */}
      {!searchQuery && slideshowItems.length > 0 && (
        <HomeHeroSlideshow items={slideshowItems} />
      )}

      {!searchQuery && (() => {
        const sow = db.monetize.storyOfWeek();
        const campaign = activeGivingCampaign();
        if (!sow && !campaign) return null;
        const sowCard = sow ? toSeriesCard(sow) : null;
        return (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-5 md:px-10 lg:px-16 pt-4 space-y-3">
            {sow && sowCard && (
              <Link
                to={`/series/${sow.slug}`}
                className="block rounded-2xl border border-gold/40 bg-gradient-to-r from-deep-green to-[#133C30] p-4 text-warm-white shadow-sm"
              >
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-gold">
                  <Sparkles size={12} />
                  {lang === "sw" ? "Hadithi ya wiki — bure kamili" : "Story of the week — fully free"}
                </div>
                <div className="mt-1 font-display text-lg font-bold">
                  {pick(lang, sow.titleSw, sow.title)}
                </div>
                <p className="mt-1 text-[11px] text-gold-light/90">
                  {lang === "sw"
                    ? "Kutoka kwenye katalogi iliyolipiwa, inazunguka kila wiki. Hakuna kuisha kwa jaribio."
                    : "From the paid catalog, rotating this week. No trial clock."}
                  {sow.sponsoredPlays
                    ? ` · ${sow.sponsoredPlays} ${lang === "sw" ? "walifika kwa wadhamini" : "reached via sponsors"}`
                    : ""}
                </p>
              </Link>
            )}
            {campaign && (
              <Link
                to="/subscribe"
                className="block rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-xs text-deep-green"
              >
                <span className="font-bold">{lang === "sw" ? campaign.titleSw : campaign.titleEn}</span>
                <span className="text-muted"> — {lang === "sw" ? campaign.blurbSw : campaign.blurbEn}</span>
              </Link>
            )}
          </div>
        );
      })()}

      {/* 3. Continue Watching (if active) */}
      {!searchQuery && continueWatching.length > 0 && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-5 md:px-10 lg:px-16 pt-3 md:pt-5 pb-1">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[9.5px] sm:text-[10.5px] md:text-xs font-bold uppercase tracking-[0.05em] text-muted">
              {t("continueWatching")}
            </div>
            <span className="text-[10px] font-bold text-muted bg-sand px-2 py-0.5 rounded-full">
              {continueWatching.length}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4 md:gap-5">
            {continueWatching.map((s) => (
              <SeriesCard key={`cw-${s.slug}`} s={s} />
            ))}
          </div>
        </div>
      )}

      {/* 4. Filter Pills Row */}
      {!searchQuery && (
        <div
          ref={categoryPickerRef}
          className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-5 md:px-10 lg:px-16 pt-3 md:pt-4 pb-1"
        >
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => {
                setActiveFilter("popular");
                setSelectedCategoryId(null);
                setCategoryDropdownOpen(false);
              }}
              className={`flex-shrink-0 rounded-full px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold transition cursor-pointer ${
                activeFilter === "popular" && !selectedCategoryId
                  ? "bg-gold text-deep-green shadow-sm"
                  : "bg-sand text-ink hover:bg-[#e6dcb9]"
              }`}
            >
              {lang === "sw" ? "Maarufu" : "Popular"}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveFilter("new");
                setSelectedCategoryId(null);
                setCategoryDropdownOpen(false);
              }}
              className={`flex-shrink-0 rounded-full px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold transition cursor-pointer ${
                activeFilter === "new" && !selectedCategoryId
                  ? "bg-gold text-deep-green shadow-sm"
                  : "bg-sand text-ink hover:bg-[#e6dcb9]"
              }`}
            >
              {lang === "sw" ? "Mpya" : "New"}
            </button>

            <button
              type="button"
              aria-expanded={categoryDropdownOpen}
              aria-haspopup="listbox"
              onClick={() => {
                setActiveFilter("category");
                setCategoryDropdownOpen((open) => !open);
              }}
              className={`flex flex-shrink-0 items-center gap-1 rounded-full px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold transition cursor-pointer ${
                activeFilter === "category" || selectedCategoryId
                  ? "bg-gold text-deep-green shadow-sm"
                  : "bg-sand text-ink hover:bg-[#e6dcb9]"
              }`}
            >
              <span>
                {selectedCategory
                  ? pick(lang, selectedCategory.nameSw, selectedCategory.name)
                  : lang === "sw"
                    ? "Aina"
                    : "Category"}
              </span>
              <ChevronDown
                size={12}
                className={`transition-transform ${categoryDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {categoryDropdownOpen && (
            <div className="mt-2 rounded-2xl border border-line bg-white p-2.5 shadow-lg">
              <Link
                to="/categories"
                onClick={() => setCategoryDropdownOpen(false)}
                className="mb-2 flex items-center gap-2 rounded-xl bg-deep-green px-3 py-2.5 text-warm-white"
              >
                <Grid2x2 size={14} className="text-gold-light shrink-0" />
                <span className="text-[12px] font-bold">
                  {lang === "sw" ? "Fungua ukurasa wa Aina" : "Open Categories page"}
                </span>
              </Link>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId(null);
                    setActiveFilter("popular");
                    setCategoryDropdownOpen(false);
                  }}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition cursor-pointer ${
                    !selectedCategoryId
                      ? "bg-gold text-deep-green"
                      : "bg-sand text-ink hover:bg-[#e6dcb9]"
                  }`}
                >
                  {lang === "sw" ? "Zote" : "All"}
                </button>
                {allCategories.map((c) => {
                  const isSelected = selectedCategoryId === c.id;
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => {
                        setSelectedCategoryId(c.id);
                        setActiveFilter("category");
                        setCategoryDropdownOpen(false);
                      }}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition cursor-pointer ${
                        isSelected
                          ? "bg-gold text-deep-green"
                          : "bg-sand text-ink hover:bg-[#e6dcb9]"
                      }`}
                    >
                      {pick(lang, c.nameSw, c.name)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Section Heading: "Maarufu wiki hii" | Count: 51 (matching Screenshot 2) */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-4 sm:px-5 md:px-10 lg:px-16 pt-3 md:pt-5 pb-2">
        <h2 className="font-display text-[15px] sm:text-[17px] md:text-xl font-bold text-ink">
          {searchQuery
            ? `${lang === "sw" ? "Matokeo ya" : "Results for"} “${searchQuery}”`
            : selectedCategory
            ? pick(lang, selectedCategory.nameSw, selectedCategory.name)
            : activeFilter === "new"
            ? (lang === "sw" ? "Msururu Mpya" : "New Releases")
            : (lang === "sw" ? "Maarufu wiki hii" : "Popular this week")}
        </h2>
        <span className="text-[10px] sm:text-[11px] md:text-sm font-bold text-muted bg-sand px-2 py-0.5 rounded-full">
          {filteredSeries.length}
        </span>
      </div>

      {/* 6. Series Cards Grid (matching Screenshot 2 on phone, responsive 2-5 cols on desktop) */}
      {filteredSeries.length === 0 ? (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-5 py-12 text-center">
          <p className="text-[13px] text-muted">
            {lang === "sw" ? "Hakuna hadithi iliyopatikana." : "No stories found."}
          </p>
          <button
            onClick={() => {
              clearSearch();
              setSelectedCategoryId(null);
              setActiveFilter("popular");
            }}
            className="mt-3 rounded-xl bg-sand px-4 py-2 text-[12px] font-bold text-deep-green hover:bg-[#e4dbbe] transition cursor-pointer"
          >
            {lang === "sw" ? "Ona Zote" : "Show All"}
          </button>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-5 md:px-10 lg:px-16 pb-24 sm:pb-16">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4 md:gap-5">
            {filteredSeries.map((s) => (
              <SeriesCard key={s.slug} s={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


