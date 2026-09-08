import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLang, pick } from "../context/LanguageContext";
import { fmtDuration } from "../lib/content-rules";
import { db } from "../lib/mock/db";

const PAGE_SIZE = 18;

export type GridEpisode = {
  id: string;
  order: number;
  title: string;
  titleSw: string;
  durationSec: number;
  published: boolean;
  completed: boolean;
  positionSec: number;
};

export default function EpisodeGrid({ episodes }: { episodes: GridEpisode[] }) {
  const navigate = useNavigate();
  const { lang, t } = useLang();

  const currentId = useMemo(() => {
    // "now playing": an in-progress, not-completed, published episode
    const inProgress = episodes.find(
      (e) => e.published && !e.completed && e.positionSec > 0,
    );
    if (inProgress) return inProgress.id;
    // otherwise the first published episode that isn't completed
    const nextUp = episodes.find((e) => e.published && !e.completed);
    return nextUp?.id ?? null;
  }, [episodes]);

  const pages = Math.ceil(episodes.length / PAGE_SIZE);
  const [page, setPage] = useState(() => {
    if (!currentId) return 0;
    const idx = episodes.findIndex((e) => e.id === currentId);
    return idx >= 0 ? Math.floor(idx / PAGE_SIZE) : 0;
  });

  const slice = episodes.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function open(e: GridEpisode) {
    if (!e.published) return;
    const episode = db.episodes.findById(e.id);
    const series = episode ? db.series.findById(episode.seriesId) : null;
    if (series) {
      navigate(`/series/${series.slug}`, { state: { playEpisodeId: e.id } });
      return;
    }
    navigate("/home");
  }

  return (
    <div>
      {pages > 1 && (
        <div className="flex gap-4 px-5 pb-1 pt-3.5">
          {Array.from({ length: pages }).map((_, i) => {
            const start = i * PAGE_SIZE + 1;
            const end = Math.min((i + 1) * PAGE_SIZE, episodes.length);
            return (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`relative cursor-pointer pb-0.5 text-[11px] font-bold transition ${
                  i === page ? "text-deep-green" : "text-muted hover:text-deep-green"
                }`}
              >
                {start}–{end}
                {i === page && (
                  <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded bg-gold" />
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-6 gap-2 px-5 pb-1.5 pt-2.5">
        {slice.map((e) => {
          const state = !e.published
            ? "locked"
            : e.completed
              ? "done"
              : e.id === currentId
                ? "now"
                : "todo";
          return (
            <button
              key={e.id}
              onClick={() => open(e)}
              title={pick(lang, e.titleSw, e.title)}
              className={[
                "relative flex aspect-square items-center justify-center rounded-xl font-display text-[14px] transition active:scale-95",
                state === "done" && "bg-deep-green text-warm-white hover:bg-teal",
                state === "now" &&
                  "bg-gold text-deep-green shadow-[inset_0_0_0_2px_var(--deep-green)]",
                state === "locked" && "bg-[#EDE7D0] text-[#B9AF87] cursor-not-allowed",
                state === "todo" && "bg-sand text-deep-green hover:bg-[#e4dbbe] cursor-pointer",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {e.order}
              {state === "locked" && (
                <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded bg-ink/15 text-[7px]">
                  <LockIcon />
                </span>
              )}
              {state === "now" && (
                <span className="absolute bottom-1 left-1 flex items-end gap-[1.5px]">
                  <i className="eq-bar h-1" style={{ animationDelay: "0ms" }} />
                  <i className="eq-bar h-2" style={{ animationDelay: "150ms" }} />
                  <i className="eq-bar h-1.5" style={{ animationDelay: "300ms" }} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-3.5 px-5 pb-1 pt-1 text-[9px] text-muted">
        <span className="flex items-center gap-1">
          <i className="inline-block h-2 w-2 rounded-sm bg-deep-green" />
          {t("completed")}
        </span>
        <span className="flex items-center gap-1">
          <i className="inline-block h-2 w-2 rounded-sm bg-gold" />
          {t("now")}
        </span>
        <span className="flex items-center gap-1">
          <i className="inline-block h-2 w-2 rounded-sm bg-[#EDE7D0]" />
          {t("notYet")} / {t("locked")}
        </span>
      </div>

      {currentId && (
        <div className="px-5 pt-3">
          {(() => {
            const cur = episodes.find((e) => e.id === currentId);
            if (!cur) return null;
            return (
              <button
                onClick={() => open(cur)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] border-gold bg-white p-2.5 text-left card-shadow transition hover:bg-warm-white active:scale-[0.99]"
              >
                <span className="flex h-11 w-14 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-teal-light to-deep-green text-white shadow-sm">
                  <PlayIcon />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[11px] text-gold">
                    {String(cur.order).padStart(2, "0")}
                  </span>
                  <span className="block truncate text-[12px] font-bold text-deep-green">
                    {pick(lang, cur.titleSw, cur.title)}
                  </span>
                  <span className="block text-[9.5px] text-muted">
                    {fmtDuration(cur.durationSec)} ·{" "}
                    {cur.positionSec > 0 ? t("resume") : t("play")}
                  </span>
                </span>
              </button>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm3 8H9V6a3 3 0 1 1 6 0v3z" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
