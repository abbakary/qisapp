import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db, subscribeDb } from "../../lib/mock/db";
import { fmtDuration } from "../../lib/content-rules";

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-sand text-muted",
  RENDERING: "bg-gold/30 text-amber-800",
  READY: "bg-teal/15 text-teal",
  PUBLISHED: "bg-deep-green text-warm-white",
  FAILED: "bg-red-100 text-red-700",
};

export default function VideosPage() {
  const [, setDbVersion] = useState(0);

  useEffect(() => {
    return subscribeDb(() => setDbVersion((v) => v + 1));
  }, []);

  const jobs = db.videoJobs.findMany();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-deep-green">AI video builder</h1>
        <Link to="/admin/videos/new" className="rounded-lg bg-gold px-3 py-2 text-[12px] font-bold text-deep-green hover:bg-gold-light transition shadow-xs">
          + New video
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        <Badge ok={true} label="Motion Graphics: Browser Canvas Ready" />
        <Badge ok={true} label="Script Generator: Swahili & English" />
        <Badge ok={true} label="Narration: Swahili Voice Engine" />
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-white shadow-xs">
        <table className="w-full min-w-[620px] text-left text-[12px]">
          <thead className="bg-sand/60 text-[10px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Series</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Length</th>
              <th className="px-3 py-2">Script</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted">
                  No video jobs yet.{" "}
                  <Link to="/admin/videos/new" className="font-bold text-teal hover:underline">
                    Start one →
                  </Link>
                </td>
              </tr>
            )}
            {jobs.map((j) => {
              const series = db.series.findById(j.seriesId);
              const episode = j.episodeId ? db.episodes.findById(j.episodeId) : null;
              return (
                <tr key={j.id} className="border-t border-line hover:bg-warm-white/50 transition">
                  <td className="px-3 py-2 font-semibold text-deep-green">
                    {j.titleSw || "(untitled)"}
                  </td>
                  <td className="px-3 py-2 text-muted">{series?.titleSw}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${STATUS_STYLE[j.status]}`}>
                      {j.status}
                      {episode ? ` · ep ${episode.order}` : ""}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted">
                    {j.durationSec ? fmtDuration(j.durationSec) : "—"}
                  </td>
                  <td className="px-3 py-2 text-muted">{j.scriptProvider}</td>
                  <td className="px-3 py-2">
                    <Link to={`/admin/videos/${j.id}`} className="text-[11px] font-bold text-teal hover:underline">
                      open
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 font-bold ${
        ok ? "bg-teal/15 text-teal" : "bg-amber-100 text-amber-800"
      }`}
    >
      {label}
    </span>
  );
}
