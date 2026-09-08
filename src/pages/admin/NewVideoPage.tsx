import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { db } from "../../lib/mock/db";
import type { Scene, Motif } from "../../lib/video/types";
import { episodeCoverDataUrl } from "../../lib/media/episode-cover";

export default function NewVideoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectSlug = searchParams.get("series");

  const seriesList = db.series.findMany();
  const [seriesId, setSeriesId] = useState(() => {
    if (preselectSlug) {
      const match = seriesList.find((s) => s.slug === preselectSlug);
      if (match) return match.id;
    }
    return seriesList[0]?.id ?? "";
  });

  const [brief, setBrief] = useState("");
  const [target, setTarget] = useState(150);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function generateStoryboard(text: string): Scene[] {
    const motifs: Motif[] = ["desert", "stars", "water", "light", "geometric", "dusk"];
    const sentences = text
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (sentences.length === 0) {
      sentences.push(
        "Katika zama za kale, kulikuwa na Nabii aliyetumwa na Mwenyezi Mungu kuelekeza watu wake kwenye wema na haki.",
        "Watu wake walikuwa wamepotea na kuacha mafundisho ya haki, lakini Nabii huyu hakuacha kulingania kwa hekima na subira.",
        "Mwishowe, haki ilidhihiri na subira yake ikaleta ushindi na baraka kubwa kwa walioamini."
      );
    }

    const count = Math.max(3, Math.min(6, Math.ceil(target / 25)));
    const scenes: Scene[] = [];

    for (let i = 0; i < count; i++) {
      const sIdx = i % sentences.length;
      const sentence = sentences[sIdx] || `Sehemu ya ${i + 1} ya hadithi.`;
      scenes.push({
        id: `sc-${Date.now()}-${i + 1}`,
        headline: i === 0 ? "Mwanzo wa Hadithi" : i === count - 1 ? "Funzo na Hitimisho" : `Ujumbe ${i + 1}`,
        narrationSw: sentence,
        narrationEn: `Part ${i + 1} of the story and timeless wisdom.`,
        motif: motifs[i % motifs.length],
        seconds: Math.round(target / count),
      });
    }

    return scenes;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!seriesId) return;
    setBusy(true);
    setErr(null);

    const selSeries = db.series.findById(seriesId);
    const nextOrder =
      Math.max(0, ...db.episodes.findBySeries(seriesId).map((e) => e.order)) + 1;
    const titleSw = selSeries ? `${selSeries.titleSw}: Kipindi Kipya` : "Kipindi Kipya";
    const scenes = generateStoryboard(brief || (selSeries?.descriptionSw ?? "Hadithi ya elimu na hekima"));

    setTimeout(() => {
      const job = db.videoJobs.create({
        seriesId,
        episodeId: null,
        status: "DRAFT",
        brief: brief || (selSeries?.titleSw ?? "Story Brief"),
        titleSw,
        titleEn: selSeries ? `${selSeries.title}: New Episode` : "New Episode",
        storyboard: scenes,
        scriptProvider: "Browser AI Engine",
        ttsProvider: "Swahili Neural TTS",
        voice: "sw-TZ-DaudiNeural",
        outputUrl: null,
        posterUrl: episodeCoverDataUrl({
          order: nextOrder,
          title: titleSw,
          seriesTitle: selSeries?.titleSw || selSeries?.title,
        }),
        durationSec: target,
        logs: "Storyboard drafted.\nReady for scene editing.",
        error: null,
        createdById: "user-admin",
      });

      setBusy(false);
      navigate(`/admin/videos/${job.id}`);
    }, 400);
  }

  if (seriesList.length === 0) {
    return (
      <p className="text-[13px] text-muted">
        Create a series first — <Link className="font-bold text-teal" to="/admin/series/new">add one</Link>.
      </p>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl text-deep-green">New video</h1>
      <p className="mt-1 text-[12px] text-muted">
        Draft a storyboard from your brief. You can review and edit every scene, background motif, and caption before rendering.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block">
          <span className="field-label">Series</span>
          <select className="field-box" value={seriesId} onChange={(e) => setSeriesId(e.target.value)}>
            {seriesList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.titleSw} / {s.title}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="field-label">Brief / source text</span>
          <textarea
            className="field-box"
            rows={8}
            placeholder="Paste the passage of the story you want this episode to cover, or a few sentences describing it. Swahili or English."
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="field-label">Target length: {target}s ({Math.round((target / 60) * 10) / 10} min)</span>
          <input
            type="range"
            min={90}
            max={180}
            step={5}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="mt-2 w-full accent-gold cursor-pointer"
          />
          <span className="text-[11px] text-muted">Episodes must land in 90–180s.</span>
        </label>

        {err && <p className="text-[12px] font-semibold text-red-700">{err}</p>}

        <button disabled={busy} className="btn-primary">
          {busy ? "Drafting storyboard…" : "Draft storyboard →"}
        </button>
      </form>
    </div>
  );
}
