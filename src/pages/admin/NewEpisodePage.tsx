import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  EPISODE_MAX_SEC,
  EPISODE_MIN_SEC,
  SERIES_MAX_EPISODES,
  SERIES_MIN_EPISODES,
  checkDuration,
  fmtDuration,
} from "../../lib/content-rules";
import { db } from "../../lib/mock/db";
import { prepareEpisodePoster } from "../../lib/media/episode-cover";

export default function NewEpisodePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectSlug = searchParams.get("series");

  const seriesList = useMemo(() => {
    return db.series.findMany().map((s) => ({
      ...s,
      orders: db.episodes.findBySeries(s.id).map((e) => e.order),
    }));
  }, []);

  const [seriesId, setSeriesId] = useState(() => {
    if (preselectSlug) {
      const match = seriesList.find((s) => s.slug === preselectSlug);
      if (match) return match.id;
    }
    return seriesList[0]?.id ?? "";
  });

  const sel = seriesList.find((s) => s.id === seriesId);
  const nextOrder = useMemo(() => {
    const max = sel?.orders.length ? Math.max(...sel.orders) : 0;
    return max + 1;
  }, [sel]);

  const [order, setOrder] = useState(nextOrder);
  const [title, setTitle] = useState("");
  const [titleSw, setTitleSw] = useState("");
  const [mediaType, setMediaType] = useState<"AUDIO" | "VIDEO">("AUDIO");
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<"file" | "url">("file");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isFree, setIsFree] = useState(nextOrder <= 3);
  const [mediaBlobUrl, setMediaBlobUrl] = useState<string | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; warnings?: string[] } | null>(null);
  const [orderEdited, setOrderEdited] = useState(false);
  const posterFileRef = useRef<File | null>(null);

  const count = sel?.orders.length ?? 0;
  const atMax = count >= SERIES_MAX_EPISODES;
  const belowMin = count + 1 < SERIES_MIN_EPISODES;
  const effectiveOrder = orderEdited ? order : nextOrder;
  const orderClash = sel?.orders.includes(effectiveOrder) ?? false;

  useEffect(() => {
    posterFileRef.current = null;
    if (!file) {
      setPosterPreview(null);
      return;
    }
    let created: string | null = null;
    let alive = true;
    prepareEpisodePoster({
      file,
      mediaType: file.type.startsWith("video") ? "VIDEO" : mediaType,
      order: effectiveOrder,
      title: titleSw || title || `Kipindi ${effectiveOrder}`,
      seriesTitle: sel?.titleSw || sel?.title,
    })
      .then((poster) => {
        if (!alive || !poster) return;
        posterFileRef.current = poster;
        created = URL.createObjectURL(poster);
        setPosterPreview(created);
      })
      .catch(() => {
        if (alive) setPosterPreview(null);
      });
    return () => {
      alive = false;
      if (created) URL.revokeObjectURL(created);
    };
    // Preview once when the file is chosen — do not recapture on every title keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const durCheck = duration != null ? checkDuration(duration) : null;

  function onSeriesChange(id: string) {
    setSeriesId(id);
    setOrderEdited(false);
    setMsg(null);
  }

  function onFile(f: File | null) {
    setFile(f);
    setDuration(null);
    setMsg(null);
    if (!f) {
      setMediaBlobUrl(null);
      setPosterPreview(null);
      return;
    }
    const url = URL.createObjectURL(f);
    setMediaBlobUrl(url);

    const isVid = f.type.startsWith("video");
    const el = document.createElement(isVid ? "video" : "audio");
    el.preload = "metadata";
    el.src = url;
    el.onloadedmetadata = () => {
      setDuration(el.duration);
    };
    if (isVid) setMediaType("VIDEO");
    else setMediaType("AUDIO");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!sel) return;
    if (source === "file" && !file) return;
    if (source === "url" && !mediaUrl.trim()) return;
    if (atMax) {
      setMsg({ ok: false, text: `"${sel.titleSw}" already has ${SERIES_MAX_EPISODES} episodes — the maximum.` });
      return;
    }

    setProgress(0);
    try {
      const warnings: string[] = [];
      if (durCheck && !durCheck.ok && durCheck.message) warnings.push(durCheck.message);

      const poster =
        posterFileRef.current ||
        (await prepareEpisodePoster({
          file: source === "file" ? file : null,
          mediaType,
          order: effectiveOrder,
          title: titleSw || title || `Kipindi ${effectiveOrder}`,
          seriesTitle: sel.titleSw || sel.title,
        }));
      posterFileRef.current = poster;

      const created = await db.episodes.createFromSource({
        seriesId: sel.id,
        order: effectiveOrder,
        title: title || `Episode ${effectiveOrder}`,
        titleSw: titleSw || `Kipindi ${effectiveOrder}`,
        durationSec: duration ? Math.round(duration) : 120,
        mediaType,
        isFree,
        published: true,
        file: source === "file" ? file : null,
        mediaUrl: source === "url" ? mediaUrl.trim() : "",
        poster,
        onProgress: setProgress,
      });

      setProgress(100);
      setMsg({
        ok: true,
        text: `Episode ${created.order} (${created.titleSw}) saved. Source: ${source === "file" ? "PC upload" : "URL"}.`,
        warnings,
      });
      setTitle("");
      setTitleSw("");
      setFile(null);
      setMediaUrl("");
      setDuration(null);
      setPosterPreview(null);
      setOrderEdited(false);
      posterFileRef.current = null;
    } catch (err: any) {
      setMsg({ ok: false, text: err?.message || "Upload failed. Is the API running?" });
    } finally {
      setTimeout(() => setProgress(null), 400);
    }
  }

  if (seriesList.length === 0) {
    return (
      <p className="text-[13px] text-muted">
        Create a series first — <Link className="font-bold text-teal" to="/admin/series/new">add one</Link>.
      </p>
    );
  }

  return (
    <div className="max-w-md">
      <h1 className="font-display text-2xl text-deep-green">Upload episode</h1>
      <p className="mt-1 text-[12px] text-muted">
        Target length {EPISODE_MIN_SEC}–{EPISODE_MAX_SEC}s (1.5–3 min). Series cap:{" "}
        {SERIES_MAX_EPISODES} episodes.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block">
          <span className="field-label">Series</span>
          <select className="field-box" value={seriesId} onChange={(e) => onSeriesChange(e.target.value)}>
            {seriesList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.titleSw} / {s.title} ({s.orders.length} ep)
              </option>
            ))}
          </select>
        </label>

        {sel && (
          <div className="rounded-lg bg-sand/60 px-3 py-2 text-[11px] text-muted">
            {count} / {SERIES_MAX_EPISODES} episodes.{" "}
            {atMax && <span className="font-bold text-red-700">At maximum — cannot add more.</span>}
            {!atMax && belowMin && (
              <span className="font-bold text-amber-700">
                Will be {count + 1} — a series needs ≥ {SERIES_MIN_EPISODES} to publish well.
              </span>
            )}
            {!atMax && !belowMin && <span className="text-teal font-semibold">Room for {SERIES_MAX_EPISODES - count} more.</span>}
          </div>
        )}

        <label className="block">
          <span className="field-label">Episode number</span>
          <input
            type="number"
            className="field-box"
            value={effectiveOrder}
            min={1}
            onChange={(e) => {
              setOrderEdited(true);
              setOrder(Number(e.target.value));
            }}
          />
          {orderClash && (
            <span className="text-[11px] font-semibold text-red-700">
              Episode {effectiveOrder} already exists in this series.
            </span>
          )}
        </label>

        <label className="block">
          <span className="field-label">Swahili title</span>
          <input className="field-box" value={titleSw} onChange={(e) => setTitleSw(e.target.value)} required />
        </label>
        <label className="block">
          <span className="field-label">English title</span>
          <input className="field-box" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>

        <label className="block">
          <span className="field-label">Media type</span>
          <select
            className="field-box"
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value as "AUDIO" | "VIDEO")}
          >
            <option value="AUDIO">Audio</option>
            <option value="VIDEO">Video</option>
          </select>
        </label>

        <label className="block">
          <span className="field-label">Media source</span>
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={() => setSource("file")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold border ${source === "file" ? "bg-deep-green text-white border-deep-green" : "bg-white border-line"}`}
            >
              Upload from PC
            </button>
            <button
              type="button"
              onClick={() => setSource("url")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold border ${source === "url" ? "bg-deep-green text-white border-deep-green" : "bg-white border-line"}`}
            >
              Media URL
            </button>
          </div>
        </label>

        {source === "file" ? (
          <label className="block">
            <span className="field-label">Audio / video file</span>
            <input
              type="file"
              accept="audio/*,video/*"
              className="field-box"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              required={source === "file"}
            />
          </label>
        ) : (
          <label className="block">
            <span className="field-label">Audio / video URL</span>
            <input
              className="field-box"
              placeholder="https://… or /media/seed/file.wav"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              required={source === "url"}
            />
          </label>
        )}

        <label className="flex items-center gap-2 text-xs font-bold text-deep-green">
          <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
          Free episode (episodes 1–3 are the free hook; later episodes use a one-time unlock)
        </label>

        {file && (
          <div className="rounded-lg bg-sand/60 px-3 py-2 text-[11px]">
            <div className="text-muted">
              {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
            </div>
            {duration == null ? (
              <div className="text-muted">Reading duration…</div>
            ) : (
              <div
                className={
                  durCheck?.ok ? "font-semibold text-teal" : "font-semibold text-amber-700"
                }
              >
                Duration {fmtDuration(duration)} ({Math.round(duration)}s) —{" "}
                {durCheck?.ok ? "within target." : durCheck?.message}
              </div>
            )}
          </div>
        )}

        {posterPreview && (
          <div className="block">
            <span className="field-label">Cover (from video)</span>
            <img
              src={posterPreview}
              alt="Episode cover preview"
              className="mt-1 h-28 w-full rounded-xl object-cover border border-line shadow-sm"
            />
          </div>
        )}

        {progress != null && (
          <div className="h-2 w-full overflow-hidden rounded bg-line">
            <div className="h-full bg-gold transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}

        {msg && (
          <div className={`text-[12px] font-semibold ${msg.ok ? "text-teal" : "text-red-700"}`}>
            {msg.text}
            {msg.warnings && msg.warnings.length > 0 && (
              <ul className="mt-1 list-disc pl-4 font-normal text-amber-700">
                {msg.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button
          disabled={atMax || orderClash || progress != null || (source === "file" ? !file : !mediaUrl.trim())}
          className="btn-primary disabled:opacity-50"
        >
          {progress != null ? `Uploading ${progress}%` : "Upload episode"}
        </button>
      </form>
    </div>
  );
}
