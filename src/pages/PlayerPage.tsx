import React, { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { db, subscribeDb } from "../lib/mock/db";

/** Old /player/:episodeId links open the series page — same design as Popular this week. */
export default function PlayerPage() {
  const { episodeId } = useParams<{ episodeId: string }>();
  const navigate = useNavigate();
  const [, setDbVersion] = useState(0);

  useEffect(() => subscribeDb(() => setDbVersion((v) => v + 1)), []);

  const episode = episodeId ? db.episodes.findById(episodeId) : null;
  const series = episode ? db.series.findById(episode.seriesId) : null;

  if (series && episode) {
    return (
      <Navigate
        to={`/series/${series.slug}`}
        replace
        state={{ playEpisodeId: episode.id }}
      />
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0A1F17] p-8 text-center text-warm-white">
      <p className="text-[14px] text-muted">Episode not found.</p>
      <button
        onClick={() => navigate("/home")}
        className="mt-4 rounded-xl bg-gold px-4 py-2 text-[12px] font-bold text-deep-green"
      >
        ← Back
      </button>
    </div>
  );
}
