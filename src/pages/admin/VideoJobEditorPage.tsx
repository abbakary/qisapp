import React, { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MOTIF_KEYS, MOTIFS, type Scene } from "../../lib/video/types";
import { fmtDuration, EPISODE_MIN_SEC, EPISODE_MAX_SEC, SERIES_MAX_EPISODES } from "../../lib/content-rules";
import { estimateSeconds } from "../../lib/video/estimate";
import { drawSceneFrame } from "../../lib/video/canvas-renderer";
import { db, subscribeDb } from "../../lib/mock/db";
import { episodeCoverDataUrl } from "../../lib/media/episode-cover";

const VOICES = [
  { id: "sw-TZ-DaudiNeural", label: "Daudi (Swahili - Tanzania, Male)" },
  { id: "sw-TZ-RehemaNeural", label: "Rehema (Swahili - Tanzania, Female)" },
  { id: "sw-KE-RafikiNeural", label: "Rafiki (Swahili - Kenya, Male)" },
  { id: "sw-KE-ZuriNeural", label: "Zuri (Swahili - Kenya, Female)" },
];

export default function VideoJobEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [, setDbVersion] = useState(0);

  useEffect(() => {
    return subscribeDb(() => setDbVersion((v) => v + 1));
  }, []);

  const job = id ? db.videoJobs.findById(id) : null;
  const series = job ? db.series.findById(job.seriesId) : null;
  const takenOrders = series ? db.episodes.findBySeries(series.id).map((e) => e.order) : [];

  const [scenes, setScenes] = useState<Scene[]>(() => job?.storyboard || []);
  const [titleSw, setTitleSw] = useState(() => job?.titleSw || "");
  const [titleEn, setTitleEn] = useState(() => job?.titleEn || "");
  const [voice, setVoice] = useState(() => job?.voice || VOICES[0].id);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Sync state if job ID changes
  useEffect(() => {
    if (job) {
      setScenes(job.storyboard || []);
      setTitleSw(job.titleSw || "");
      setTitleEn(job.titleEn || "");
      setVoice(job.voice || VOICES[0].id);
    }
  }, [job?.id]);

  // Preview Canvas Playback State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const estTotal = useMemo(() => {
    return scenes.reduce((a, s) => a + (estimateSeconds(s.narrationSw) || s.seconds), 0);
  }, [scenes]);

  function patchScene(i: number, patch: Partial<Scene>) {
    setScenes((prev) => prev.map((s, k) => (k === i ? { ...s, ...patch } : s)));
    setDirty(true);
  }

  function move(i: number, dir: -1 | 1) {
    setScenes((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setDirty(true);
  }

  function removeScene(i: number) {
    setScenes((prev) => prev.filter((_, k) => k !== i));
    setDirty(true);
  }

  function addScene() {
    setScenes((prev) => [
      ...prev,
      {
        id: `sc-${Date.now()}`,
        narrationSw: "",
        narrationEn: "",
        motif: "desert",
        headline: "",
        seconds: 14,
      },
    ]);
    setDirty(true);
  }

  function save() {
    if (!job) return;
    setBusy("save");
    db.videoJobs.update(job.id, {
      storyboard: scenes,
      titleSw,
      titleEn,
      voice,
    });
    setBusy(null);
    setDirty(false);
    setMsg({ ok: true, text: "Changes saved." });
  }

  function renderVideo() {
    if (!job) return;
    setBusy("render");
    setMsg(null);
    db.videoJobs.update(job.id, {
      status: "RENDERING",
      logs: "Initializing render engine...\nRendering scene frames and Swahili captions...\nProcessing audio wave...",
    });

    setTimeout(() => {
      db.videoJobs.update(job.id, {
        status: "READY",
        outputUrl: "/media/seed/placeholder.wav",
        posterUrl: episodeCoverDataUrl({
          order: (series ? db.episodes.findBySeries(series.id).length : 0) + 1,
          title: titleSw || job.titleSw,
          seriesTitle: series?.titleSw || series?.title,
        }),
        durationSec: Math.round(estTotal),
        logs: "Render completed successfully.\nReady for preview and publishing.",
      });
      setBusy(null);
      setMsg({ ok: true, text: "Video rendered and ready for preview!" });
    }, 1500);
  }

  // Interactive Scene Canvas rendering
  useEffect(() => {
    if (!canvasRef.current || scenes.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Determine active scene based on previewTime
    let accumulated = 0;
    let activeScene = scenes[0];
    let sceneTime = 0;
    let sceneDuration = 10;

    for (let i = 0; i < scenes.length; i++) {
      const s = scenes[i];
      const dur = estimateSeconds(s.narrationSw) || s.seconds || 10;
      if (previewTime >= accumulated && previewTime <= accumulated + dur) {
        activeScene = s;
        sceneTime = previewTime - accumulated;
        sceneDuration = dur;
        break;
      }
      accumulated += dur;
    }

    drawSceneFrame(ctx, canvas.width, canvas.height, activeScene, sceneTime, sceneDuration);
  }, [previewTime, scenes]);

  // Preview play loop
  useEffect(() => {
    if (!previewPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const startMs = Date.now() - previewTime * 1000;
    const tick = () => {
      const elapsed = (Date.now() - startMs) / 1000;
      if (elapsed >= estTotal) {
        setPreviewPlaying(false);
        setPreviewTime(0);
      } else {
        setPreviewTime(elapsed);
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };
    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [previewPlaying, estTotal]);

  const [pubOrder, setPubOrder] = useState(() => {
    let n = 1;
    while (takenOrders.includes(n)) n++;
    return n;
  });

  const orderClash = takenOrders.includes(pubOrder);
  const atMax = (series ? db.episodes.findBySeries(series.id).length : 0) >= SERIES_MAX_EPISODES;

  function publish() {
    if (!job || !series) return;
    setBusy("publish");

    const createdEpisode = db.episodes.create({
      seriesId: series.id,
      order: pubOrder,
      title: titleEn || `Episode ${pubOrder}`,
      titleSw: titleSw || `Kipindi ${pubOrder}`,
      durationSec: Math.round(estTotal),
      mediaUrl: "/media/seed/placeholder.wav",
      mediaType: "VIDEO",
      published: true,
      fromVideoJob: true,
    });

    db.videoJobs.update(job.id, {
      status: "PUBLISHED",
      episodeId: createdEpisode.id,
    });

    setBusy(null);
    setMsg({ ok: true, text: `Published as episode ${createdEpisode.order} in "${series.titleSw}"!` });
    setTimeout(() => {
      navigate(`/series/${series.slug}`);
    }, 1200);
  }

  if (!job || !series) {
    return (
      <div className="p-8 text-center text-muted">
        <p>Video job not found.</p>
        <Link to="/admin/videos" className="mt-2 text-teal font-bold inline-block">← Back to videos</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link to="/admin/videos" className="text-[12px] font-bold text-teal hover:underline">
        ← All videos
      </Link>

      <div className="mt-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-deep-green">{titleSw || "Untitled"}</h1>
          <p className="text-[12px] text-muted">
            {series.titleSw} · script: {job.scriptProvider} · narration: {job.ttsProvider}
          </p>
        </div>
        <span className="rounded bg-sand px-2 py-1 text-[11px] font-bold text-muted">{job.status}</span>
      </div>

      {/* titles */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="field-label">Swahili title</span>
          <input className="field-box" value={titleSw} onChange={(e) => { setTitleSw(e.target.value); setDirty(true); }} />
        </label>
        <label className="block">
          <span className="field-label">English title</span>
          <input className="field-box" value={titleEn} onChange={(e) => { setTitleEn(e.target.value); setDirty(true); }} />
        </label>
      </div>

      <label className="mt-3 block">
        <span className="field-label">Narration voice</span>
        <select className="field-box" value={voice} onChange={(e) => { setVoice(e.target.value); setDirty(true); }}>
          {VOICES.map((v) => (
            <option key={v.id} value={v.id}>{v.label}</option>
          ))}
        </select>
      </label>

      {/* Storyboard */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-display text-lg text-deep-green">Storyboard · {scenes.length} scenes</h2>
        <span className={`text-[11px] font-bold ${estTotal < EPISODE_MIN_SEC || estTotal > EPISODE_MAX_SEC ? "text-amber-700" : "text-teal"}`}>
          ≈ {fmtDuration(Math.round(estTotal))} spoken
        </span>
      </div>

      <div className="mt-2 space-y-3">
        {scenes.map((s, i) => (
          <div key={s.id} className="rounded-xl border border-line bg-white p-3 card-shadow">
            <div className="flex items-center gap-2 text-[11px] text-muted">
              <span className="font-display text-gold font-bold">{String(i + 1).padStart(2, "0")}</span>
              <select
                className="rounded border border-line bg-sand px-2 py-0.5 text-[11px] font-medium"
                value={s.motif}
                onChange={(e) => patchScene(i, { motif: e.target.value as Scene["motif"] })}
              >
                {MOTIF_KEYS.map((m) => (
                  <option key={m} value={m}>{MOTIFS[m].label}</option>
                ))}
              </select>
              <span className="ml-auto flex gap-1">
                <button onClick={() => move(i, -1)} className="cursor-pointer rounded bg-sand px-2 py-0.5 hover:bg-[#e4dbbe]" title="up">↑</button>
                <button onClick={() => move(i, 1)} className="cursor-pointer rounded bg-sand px-2 py-0.5 hover:bg-[#e4dbbe]" title="down">↓</button>
                <button onClick={() => removeScene(i)} className="cursor-pointer rounded bg-red-100 px-2 py-0.5 text-red-700 hover:bg-red-200" title="remove">✕</button>
              </span>
            </div>
            <input
              className="mt-2 w-full rounded border border-line px-2.5 py-1 text-[12px] focus:border-teal outline-none"
              placeholder="Headline (optional, shown large — Swahili)"
              value={s.headline ?? ""}
              onChange={(e) => patchScene(i, { headline: e.target.value })}
            />
            <textarea
              className="mt-2 w-full rounded border border-line px-2.5 py-1.5 text-[13px] focus:border-teal outline-none"
              rows={2}
              placeholder="Narration — Swahili (spoken + kinetic caption)"
              value={s.narrationSw}
              onChange={(e) => patchScene(i, { narrationSw: e.target.value })}
            />
            <textarea
              className="mt-1.5 w-full rounded border border-line px-2.5 py-1.5 text-[12px] text-muted focus:border-teal outline-none"
              rows={2}
              placeholder="English subtitle (optional)"
              value={s.narrationEn}
              onChange={(e) => patchScene(i, { narrationEn: e.target.value })}
            />
            <div className="mt-1 text-[10px] text-muted font-medium">
              ≈ {estimateSeconds(s.narrationSw) || s.seconds}s at reading pace
            </div>
          </div>
        ))}
      </div>

      <button onClick={addScene} className="mt-3 cursor-pointer rounded-lg border border-dashed border-line px-3 py-2 text-[12px] font-bold text-muted hover:border-teal hover:text-teal transition">
        + Add scene
      </button>

      {/* Interactive Motion Graphic Preview */}
      <div className="mt-8 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <h2 className="font-display text-lg text-deep-green flex items-center justify-between">
          <span>Motion Graphic Canvas Preview</span>
          <span className="text-[11px] font-mono text-muted">
            {fmtDuration(previewTime)} / {fmtDuration(estTotal)}
          </span>
        </h2>

        <div className="relative mt-3 overflow-hidden rounded-xl bg-black aspect-video flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className="w-full h-full object-contain"
          />
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => setPreviewPlaying((p) => !p)}
            className="cursor-pointer rounded-lg bg-gold px-4 py-2 text-[12px] font-extrabold text-deep-green hover:bg-gold-light transition shadow-xs"
          >
            {previewPlaying ? "❚❚ Pause" : "▶ Play Motion Preview"}
          </button>
          <button
            onClick={() => {
              setPreviewPlaying(false);
              setPreviewTime(0);
            }}
            className="cursor-pointer rounded-lg border border-line px-3 py-2 text-[12px] font-bold text-muted hover:text-deep-green transition"
          >
            Restart
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="sticky bottom-0 mt-6 flex flex-wrap items-center gap-2 border-t border-line bg-warm-white/95 py-3 backdrop-blur">
        <button
          onClick={save}
          disabled={busy !== null || !dirty}
          className="cursor-pointer rounded-lg bg-deep-green px-3 py-2 text-[12px] font-bold text-warm-white disabled:opacity-40 hover:bg-teal transition"
        >
          {busy === "save" ? "Saving…" : dirty ? "Save changes" : "Saved"}
        </button>

        <button
          onClick={renderVideo}
          disabled={busy !== null || dirty || scenes.length < 2}
          className="cursor-pointer rounded-lg bg-gold px-3 py-2 text-[12px] font-bold text-deep-green disabled:opacity-40 hover:bg-gold-light transition shadow-xs"
          title={dirty ? "Save first" : ""}
        >
          {job.status === "RENDERING" ? "Rendering…" : "Render video"}
        </button>
        {dirty && <span className="text-[11px] text-amber-700">Save before rendering.</span>}
      </div>

      {msg && (
        <p className={`mt-2 text-[12px] font-semibold ${msg.ok ? "text-teal" : "text-red-700"}`}>{msg.text}</p>
      )}

      {job.logs && (
        <pre className="mt-3 max-h-52 overflow-auto rounded-lg bg-deep-green p-3 text-[10.5px] leading-relaxed text-gold-light">
          {job.logs}
        </pre>
      )}

      {/* Publish as Episode */}
      {(job.status === "READY" || job.status === "PUBLISHED") && (
        <div className="mt-6 rounded-xl border border-line bg-white p-4 shadow-sm">
          <h2 className="font-display text-lg text-deep-green">Publish as Episode</h2>
          <p className="text-[12px] text-muted mt-1">
            Episode duration: ~{fmtDuration(estTotal)} (target: 90–180s)
          </p>

          {job.episodeId ? (
            <p className="mt-3 text-[12px] font-bold text-teal">
              Published as episode.{" "}
              <Link to={`/series/${series.slug}`} className="underline font-bold">
                View in Series →
              </Link>
            </p>
          ) : (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[12px] font-bold text-deep-green">Publish as episode:</span>
              <input
                type="number"
                min={1}
                value={pubOrder}
                onChange={(e) => setPubOrder(Number(e.target.value))}
                className="w-20 rounded border border-line px-2 py-1 text-[13px] outline-none"
              />
              <button
                onClick={publish}
                disabled={busy !== null || orderClash || atMax}
                className="cursor-pointer rounded-lg bg-deep-green px-3 py-2 text-[12px] font-bold text-warm-white disabled:opacity-40 hover:bg-teal transition"
              >
                {busy === "publish" ? "Publishing…" : "Publish Now"}
              </button>
              {orderClash && <span className="text-[11px] font-bold text-red-700">order already taken</span>}
              {atMax && <span className="text-[11px] font-bold text-red-700">series at maximum {SERIES_MAX_EPISODES}</span>}
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <button
          onClick={() => {
            if (!confirm("Delete this video job?")) return;
            db.videoJobs.delete(job.id);
            navigate("/admin/videos");
          }}
          className="cursor-pointer text-[11px] font-bold text-red-700 hover:underline"
        >
          Delete job
        </button>
      </div>
    </div>
  );
}
