import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { db, subscribeDb } from "../../lib/mock/db";
import { fmtDuration, SERIES_MIN_EPISODES, SERIES_MAX_EPISODES } from "../../lib/content-rules";

export default function ManageSeriesEpisodesPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [, setDbVersion] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    return subscribeDb(() => setDbVersion((v) => v + 1));
  }, []);

  const series = slug ? db.series.findBySlug(slug) : null;
  const category = series ? db.categories.findById(series.categoryId) : null;
  const episodes = series ? db.episodes.findBySeries(series.id) : [];

  const epRows = episodes.map((e) => ({
    ...e,
    watchers: db.progress.countForEpisode(e.id),
  }));

  async function del(epId: string, order: number, titleSw: string, watchers: number) {
    if (
      !confirm(
        `Delete episode ${order} — "${titleSw}"?\n` +
          (watchers > 0 ? `${watchers} listener(s) have progress on it. ` : "") +
          "This removes the episode.",
      )
    ) {
      return;
    }
    setBusy(epId);
    setMsg(null);
    db.episodes.delete(epId);
    setBusy(null);
    setMsg(`Deleted episode ${order}.`);
  }

  if (!series) {
    return (
      <div className="p-8 text-center text-muted">
        <p>Series not found.</p>
        <Link to="/admin" className="text-teal font-bold mt-2 inline-block">← Back to Dashboard</Link>
      </div>
    );
  }

  const count = episodes.length;

  return (
    <div className="max-w-2xl">
      <Link to="/admin" className="text-[12px] font-bold text-teal hover:underline">← Dashboard</Link>
      <h1 className="mt-2 font-display text-2xl text-deep-green">{series.titleSw}</h1>
      <p className="text-[12px] text-muted">
        {series.title} · {category?.nameSw} · {count} / {SERIES_MAX_EPISODES} episodes
        {count < SERIES_MIN_EPISODES && (
          <span className="font-bold text-amber-700"> · needs ≥ {SERIES_MIN_EPISODES} to publish well</span>
        )}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={`/admin/episodes/new?series=${series.slug}`} className="rounded-lg bg-gold px-3 py-2 text-[12px] font-bold text-deep-green hover:bg-gold-light transition shadow-xs">
          + Upload episode
        </Link>
        <Link to={`/admin/videos/new?series=${series.slug}`} className="rounded-lg bg-teal px-3 py-2 text-[12px] font-bold text-warm-white hover:bg-teal-light transition shadow-xs">
          + AI video
        </Link>
        <Link to={`/series/${series.slug}`} className="rounded-lg border border-line px-3 py-2 text-[12px] font-bold text-deep-green hover:bg-sand/60 transition">
          View in app
        </Link>
      </div>

      {msg && <p className="mt-3 text-[12px] font-semibold text-teal">{msg}</p>}

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-white shadow-xs">
        {epRows.length === 0 && <p className="p-6 text-center text-[13px] text-muted">No episodes yet.</p>}
        {epRows.map((e) => (
          <div key={e.id} className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-0 hover:bg-warm-white/40 transition">
            <span className="w-8 font-display text-[13px] text-gold">{String(e.order).padStart(2, "0")}</span>
            <span className="flex-1 min-w-0">
              <span className="block truncate text-[12.5px] font-semibold text-deep-green">{e.titleSw}</span>
              <span className="block text-[10px] text-muted">
                {e.mediaType === "VIDEO" ? "🎬 video" : "🔊 audio"}
                {e.fromVideoJob ? " · AI-built" : ""} · {fmtDuration(e.durationSec)}
                {!e.published ? " · draft" : ""}
                {e.watchers > 0 ? ` · ${e.watchers} watching` : ""}
              </span>
            </span>
            <button
              onClick={() => del(e.id, e.order, e.titleSw, e.watchers)}
              disabled={busy !== null}
              className="cursor-pointer rounded-lg bg-red-100 px-2.5 py-1.5 text-[11px] font-bold text-red-700 disabled:opacity-40 hover:bg-red-200 transition"
            >
              {busy === e.id ? "…" : "Delete"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
