import React, { useState, useEffect } from "react";
import {
  Video,
  Play,
  RotateCw,
  Plus,
  CheckCircle,
  AlertCircle,
  Trash2,
  Sparkles,
  Layers,
  Cpu,
} from "lucide-react";
import { db, subscribeDb } from "../../lib/mock/db";
import type { VideoJob, Episode } from "../../lib/mock/types";
import DataTable, { ColumnDef } from "../../components/admin/DataTable";
import MediaPreviewModal from "../../components/admin/MediaPreviewModal";
import ConfirmModal from "../../components/admin/ConfirmModal";

export default function VideoJobsAdminPage() {
  const [, setDbVersion] = useState(0);
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [previewJob, setPreviewJob] = useState<VideoJob | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VideoJob | null>(null);

  // Form
  const [selectedEpId, setSelectedEpId] = useState("");
  const [format, setFormat] = useState<"VERTICAL_9_16" | "LANDSCAPE_16_9">("VERTICAL_9_16");
  const [engine, setEngine] = useState<"remotion" | "ffmpeg">("remotion");
  const [stylePreset, setStylePreset] = useState("calligraphy-vignette");

  useEffect(() => {
    setJobs(db.videoJobs.findMany());
    setEpisodes(db.episodes.findMany());
    if (db.episodes.findMany().length > 0) {
      setSelectedEpId(db.episodes.findMany()[0].id);
    }
    return subscribeDb(() => {
      setDbVersion((v) => v + 1);
      setJobs(db.videoJobs.findMany());
      setEpisodes(db.episodes.findMany());
    });
  }, []);

  function handleCreateJob(e: React.FormEvent) {
    e.preventDefault();
    const ep = episodes.find((item) => item.id === selectedEpId);
    if (!ep) return;

    db.videoJobs.create({
      episodeId: ep.id,
      episodeTitle: ep.titleSw,
      format,
      engine,
      status: "QUEUED",
      progress: 0,
      currentStep: "Queued for render worker",
    });

    setIsCreateOpen(false);
  }

  function handleRerun(job: VideoJob) {
    db.videoJobs.updateProgress(job.id, 5, "QUEUED", "Restarting render pipeline...");
    // Simulate step progress
    setTimeout(() => {
      db.videoJobs.updateProgress(job.id, 35, "GENERATING_SCENES", "Generating AI visual scenes...");
    }, 1500);
    setTimeout(() => {
      db.videoJobs.updateProgress(job.id, 75, "RENDERING", "Stitching frames & audio synch...");
    }, 3500);
    setTimeout(() => {
      db.videoJobs.updateProgress(
        job.id,
        100,
        "COMPLETED",
        "Video rendered successfully",
        "/media/renders/cmtcugec70001f8p8t2bk32wl/episode.mp4",
      );
    }, 6000);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    db.videoJobs.delete(deleteTarget.id);
    setDeleteTarget(null);
  }

  const columns: ColumnDef<VideoJob>[] = [
    {
      id: "preview",
      header: "Video",
      width: "60px",
      align: "center",
      cell: (j) =>
        (j.status === "COMPLETED" || j.status === "READY" || j.status === "PUBLISHED") && j.outputUrl ? (
          <button
            onClick={() => setPreviewJob(j)}
            className="h-8 w-8 rounded-full bg-deep-green text-gold flex items-center justify-center hover:scale-105 transition cursor-pointer shadow-xs"
            title="Preview Output Video"
          >
            <Play className="h-3.5 w-3.5 fill-gold ml-0.5" />
          </button>
        ) : (
          <div className="h-8 w-8 rounded-full bg-sand text-muted flex items-center justify-center text-[10px] font-bold">
            {j.progress ?? 0}%
          </div>
        ),
    },
    {
      id: "episodeTitle",
      header: "Target Episode",
      sortable: true,
      cell: (j) => (
        <div>
          <div className="font-bold text-deep-green text-xs">{j.episodeTitle || j.titleSw || "Video Render"}</div>
          <div className="text-[10px] text-muted font-mono">{j.id}</div>
        </div>
      ),
    },
    {
      id: "format",
      header: "Aspect Ratio",
      align: "center",
      width: "120px",
      cell: (j) => (
        <span className="font-mono text-[10px] font-bold bg-sand px-2 py-0.5 rounded">
          {j.format === "VERTICAL_9_16" ? "9:16 (Story)" : "16:9 (Landscape)"}
        </span>
      ),
    },
    {
      id: "engine",
      header: "Engine",
      align: "center",
      width: "90px",
      cell: (j) => (
        <span className="text-[10px] font-bold text-teal bg-teal/10 px-2 py-0.5 rounded uppercase">
          {j.engine || "remotion"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Pipeline Status",
      cell: (j) => {
        const styles: Record<string, string> = {
          COMPLETED: "bg-emerald-100 text-emerald-800",
          READY: "bg-emerald-100 text-emerald-800",
          PUBLISHED: "bg-emerald-100 text-emerald-800",
          RENDERING: "bg-blue-100 text-blue-800",
          GENERATING_SCENES: "bg-purple-100 text-purple-800",
          SYNTHESIZING_VOICE: "bg-gold/20 text-gold-dark",
          QUEUED: "bg-sand text-muted",
          DRAFT: "bg-sand text-muted",
          FAILED: "bg-rose-100 text-rose-800",
        };
        const badgeStyle = styles[j.status] || "bg-sand text-muted";

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${badgeStyle}`}>
                {j.status}
              </span>
              <span className="text-[10px] text-muted">{j.progress ?? 0}%</span>
            </div>
            <div className="w-32 bg-sand rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-deep-green h-full rounded-full transition-all duration-500"
                style={{ width: `${j.progress ?? 0}%` }}
              />
            </div>
            <div className="text-[10px] text-muted truncate max-w-xs">{j.currentStep || "Processing..."}</div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      width: "100px",
      cell: (j) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleRerun(j)}
            className="p-1.5 rounded-lg border border-line text-ink hover:bg-sand/40 hover:text-deep-green transition cursor-pointer"
            title="Rerun Pipeline"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeleteTarget(j)}
            className="p-1.5 rounded-lg border border-line text-red-600 hover:bg-red-50 transition cursor-pointer"
            title="Delete Job"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-deep-green flex items-center gap-2">
            <Video className="h-6 w-6 text-gold" />
            Video Rendering Pipeline
          </h1>
          <p className="text-[13px] text-muted mt-0.5">
            Automated video generation queue for turning audio darsas into animated vertical stories (9:16) and YouTube videos.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 bg-deep-green hover:bg-teal text-warm-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 text-gold-light" />
          <span>New Video Render</span>
        </button>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={jobs}
        searchPlaceholder="Search by episode title or job ID..."
        searchFilter={(j, q) =>
          Boolean(
            (j.episodeTitle || j.titleSw || "").toLowerCase().includes(q) ||
            j.id.toLowerCase().includes(q)
          )
        }
      />

      {/* Video Preview Modal */}
      {previewJob && (
        <MediaPreviewModal
          isOpen={Boolean(previewJob)}
          onClose={() => setPreviewJob(null)}
          title={previewJob.episodeTitle || previewJob.titleSw || "Video Preview"}
          mediaUrl={previewJob.outputUrl || "/media/renders/cmtcugec70001f8p8t2bk32wl/episode.mp4"}
          mediaType="VIDEO"
        />
      )}

      {/* New Render Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-line">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="font-display text-lg font-bold text-deep-green flex items-center gap-2">
                <Video className="h-5 w-5 text-gold" />
                <span>Configure Video Render</span>
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-muted hover:text-ink text-lg p-1 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  Select Audio Episode *
                </label>
                <select
                  value={selectedEpId}
                  onChange={(e) => setSelectedEpId(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-semibold text-ink focus:bg-white focus:border-gold focus:outline-none cursor-pointer"
                >
                  {episodes.map((ep) => (
                    <option key={ep.id} value={ep.id}>
                      {ep.titleSw} ({ep.durationSec}s)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                    Aspect Ratio
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-semibold text-ink focus:bg-white focus:border-gold focus:outline-none cursor-pointer"
                  >
                    <option value="VERTICAL_9_16">9:16 (TikTok / Reels)</option>
                    <option value="LANDSCAPE_16_9">16:9 (Landscape)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                    Render Engine
                  </label>
                  <select
                    value={engine}
                    onChange={(e) => setEngine(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-semibold text-ink focus:bg-white focus:border-gold focus:outline-none cursor-pointer"
                  >
                    <option value="remotion">Remotion React</option>
                    <option value="ffmpeg">FFmpeg Stitcher</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  Visual Style Preset
                </label>
                <select
                  value={stylePreset}
                  onChange={(e) => setStylePreset(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-semibold text-ink focus:bg-white focus:border-gold focus:outline-none cursor-pointer"
                >
                  <option value="calligraphy-vignette">
                    Gold Arabic Calligraphy + Warm Dunes
                  </option>
                  <option value="starry-medina">Starry Medina Night (Deep Teal)</option>
                  <option value="parchment-scroll">Ancient Parchment & Ink Glow</option>
                </select>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border border-line px-4 py-2 text-xs font-bold text-ink hover:bg-sand/40 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-deep-green px-4 py-2 text-xs font-bold text-warm-white hover:bg-teal transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-gold-light" />
                  <span>Enqueue Render</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Render Job?"
        message="Are you sure you want to remove this render job and its associated logs?"
        confirmLabel="Delete Job"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
