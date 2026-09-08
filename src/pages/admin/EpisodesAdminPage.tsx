import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  PlaySquare,
  Play,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  Volume2,
  Video,
  Clock,
  AlertCircle,
} from "lucide-react";
import { db, subscribeDb } from "../../lib/mock/db";
import type { Episode, Series } from "../../lib/mock/types";
import DataTable, { ColumnDef } from "../../components/admin/DataTable";
import MediaPreviewModal from "../../components/admin/MediaPreviewModal";
import ConfirmModal from "../../components/admin/ConfirmModal";

export default function EpisodesAdminPage() {
  const [, setDbVersion] = useState(0);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("ALL");
  const [selectedFreeStatus, setSelectedFreeStatus] = useState<string>("ALL");
  const [selectedPublished, setSelectedPublished] = useState<string>("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewEp, setPreviewEp] = useState<Episode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Episode | null>(null);

  // Edit episode modal
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [formTitleSw, setFormTitleSw] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formOrder, setFormOrder] = useState(1);
  const [formDuration, setFormDuration] = useState(120);
  const [formMediaUrl, setFormMediaUrl] = useState("");
  const [formMediaType, setFormMediaType] = useState<"AUDIO" | "VIDEO">("AUDIO");
  const [formIsFree, setFormIsFree] = useState(true);
  const [formAuthorName, setFormAuthorName] = useState("");
  const [formAuthorPhone, setFormAuthorPhone] = useState("");

  useEffect(() => {
    setEpisodes(db.episodes.findMany());
    setSeriesList(db.series.findMany());
    return subscribeDb(() => {
      setDbVersion((v) => v + 1);
      setEpisodes(db.episodes.findMany());
      setSeriesList(db.series.findMany());
    });
  }, []);

  const filteredEpisodes = useMemo(() => {
    return episodes.filter((e) => {
      if (selectedSeriesId !== "ALL" && e.seriesId !== selectedSeriesId) return false;
      if (selectedFreeStatus === "FREE" && !e.isFree) return false;
      if (selectedFreeStatus === "VIP" && e.isFree) return false;
      if (selectedPublished === "YES" && !e.published) return false;
      if (selectedPublished === "NO" && e.published) return false;
      return true;
    });
  }, [episodes, selectedSeriesId, selectedFreeStatus, selectedPublished]);

  function openEdit(e: Episode) {
    setEditingEpisode(e);
    setFormTitleSw(e.titleSw);
    setFormTitle(e.title);
    setFormOrder(e.order);
    setFormDuration(e.durationSec);
    setFormMediaUrl(e.mediaUrl);
    setFormMediaType(e.mediaType);
    setFormIsFree(e.isFree);
    setFormAuthorName(e.authorName || "");
    setFormAuthorPhone(e.authorPhone || "");
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEpisode) return;

    db.episodes.update(editingEpisode.id, {
      titleSw: formTitleSw.trim(),
      title: formTitle.trim(),
      order: Number(formOrder),
      durationSec: Number(formDuration),
      mediaUrl: formMediaUrl.trim(),
      mediaType: formMediaType,
      isFree: formIsFree,
      authorName: formAuthorName.trim() || undefined,
      authorPhone: formAuthorPhone.trim() || undefined,
    });

    setEditingEpisode(null);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    db.episodes.delete(deleteTarget.id);
    setDeleteTarget(null);
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  const columns: ColumnDef<Episode>[] = [
    {
      id: "preview",
      header: "Play",
      width: "60px",
      align: "center",
      cell: (e) => (
        <button
          onClick={() => setPreviewEp(e)}
          className="h-8 w-8 rounded-full bg-deep-green text-gold flex items-center justify-center hover:scale-105 transition cursor-pointer shadow-xs"
          title="Preview Media"
        >
          <Play className="h-3.5 w-3.5 fill-gold ml-0.5" />
        </button>
      ),
    },
    {
      id: "series",
      header: "Series",
      sortable: true,
      accessor: (e) => {
        const s = seriesList.find((item) => item.id === e.seriesId);
        return s?.titleSw || "Unknown";
      },
      cell: (e) => {
        const s = seriesList.find((item) => item.id === e.seriesId);
        return (
          <div>
            <div className="font-bold text-deep-green text-xs truncate max-w-[160px]">
              {s?.titleSw || "Unknown"}
            </div>
            <span className="font-mono text-[10px] text-muted">
              S{e.seasonNumber || 1}·E{String(e.order).padStart(2, "0")}
            </span>
          </div>
        );
      },
    },
    {
      id: "titleSw",
      header: "Title (Swahili / English)",
      sortable: true,
      cell: (e) => (
        <div>
          <div className="font-bold text-ink text-xs">{e.titleSw}</div>
          <div className="text-[11px] text-muted truncate max-w-xs">{e.title}</div>
        </div>
      ),
    },
    {
      id: "mediaType",
      header: "Format",
      align: "center",
      width: "80px",
      cell: (e) => (
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
            e.mediaType === "VIDEO"
              ? "bg-purple-100 text-purple-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {e.mediaType === "VIDEO" ? <Video className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
          <span>{e.mediaType}</span>
        </span>
      ),
    },
    {
      id: "durationSec",
      header: "Duration",
      sortable: true,
      align: "center",
      width: "110px",
      accessor: (e) => e.durationSec,
      cell: (e) => {
        const isCompliant = e.durationSec >= 90 && e.durationSec <= 180;
        return (
          <div className="flex items-center justify-center gap-1">
            <span className="font-mono text-xs font-bold text-ink">
              {formatTime(e.durationSec)}
            </span>
            {isCompliant ? (
              <span title="Rule 7.3 Compliant (90s-180s)" className="text-emerald-600 text-[10px]">
                ✓
              </span>
            ) : (
              <span
                title={e.durationSec < 90 ? "Under 90s" : "Over 180s"}
                className="text-amber-500 text-[10px]"
              >
                ⚠
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "isFree",
      header: "Access",
      align: "center",
      width: "100px",
      cell: (e) => (
        <button
          onClick={() => db.episodes.toggleFree(e.id)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
            e.isFree
              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
              : "bg-gold/20 text-gold-dark hover:bg-gold/30"
          }`}
          title="Click to toggle Free vs paid unlock"
        >
          {e.isFree ? (
            <>
              <Unlock className="h-3 w-3" />
              <span>Free</span>
            </>
          ) : (
            <>
              <Lock className="h-3 w-3" />
              <span>Unlock</span>
            </>
          )}
        </button>
      ),
    },
    {
      id: "published",
      header: "Status",
      align: "center",
      width: "90px",
      cell: (e) => (
        <button
          onClick={() => db.episodes.togglePublished(e.id)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
            e.published
              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
              : "bg-sand text-muted hover:text-ink"
          }`}
        >
          {e.published ? "Live" : "Hidden"}
        </button>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      width: "100px",
      cell: (e) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEdit(e)}
            className="p-1.5 rounded-lg border border-line text-ink hover:bg-sand/40 hover:text-deep-green transition cursor-pointer"
            title="Edit Episode"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeleteTarget(e)}
            className="p-1.5 rounded-lg border border-line text-red-600 hover:bg-red-50 transition cursor-pointer"
            title="Delete Episode"
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
            <PlaySquare className="h-6 w-6 text-gold" />
            Episodes Catalog
          </h1>
          <p className="text-[13px] text-muted mt-0.5">
            Section 7.3 Episode Schema · Audio & video track catalog, VIP paywall gates, and playback previews.
          </p>
        </div>

        <Link
          to="/admin/episodes/new"
          className="flex items-center gap-1.5 bg-deep-green hover:bg-teal text-warm-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 text-gold-light" />
          <span>Upload Episode</span>
        </Link>
      </div>

      {/* Table with Series Filters */}
      <DataTable
        columns={columns}
        data={filteredEpisodes}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        searchPlaceholder="Search episode title or speaker..."
        filterSlot={
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <select
              value={selectedSeriesId}
              onChange={(e) => setSelectedSeriesId(e.target.value)}
              className="rounded-xl border border-line bg-sand/30 px-2.5 py-2 text-ink focus:bg-white focus:border-gold focus:outline-none cursor-pointer max-w-[200px]"
            >
              <option value="ALL">All Series</option>
              {seriesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.titleSw}
                </option>
              ))}
            </select>

            <select
              value={selectedFreeStatus}
              onChange={(e) => setSelectedFreeStatus(e.target.value)}
              className="rounded-xl border border-line bg-sand/30 px-2.5 py-2 text-ink focus:bg-white focus:border-gold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Access Tiers</option>
              <option value="FREE">Free Tier Only</option>
              <option value="VIP">VIP Locked Only</option>
            </select>

            <select
              value={selectedPublished}
              onChange={(e) => setSelectedPublished(e.target.value)}
              className="rounded-xl border border-line bg-sand/30 px-2.5 py-2 text-ink focus:bg-white focus:border-gold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="YES">Live</option>
              <option value="NO">Hidden</option>
            </select>
          </div>
        }
        bulkActions={(ids, clear) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                ids.forEach((id) => db.episodes.update(id, { isFree: true }));
                setSelectedIds([]);
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition cursor-pointer"
            >
              Make Free
            </button>
            <button
              onClick={() => {
                ids.forEach((id) => db.episodes.update(id, { isFree: false }));
                setSelectedIds([]);
              }}
              className="px-2.5 py-1 rounded-lg bg-gold text-deep-green font-bold text-[11px] hover:bg-gold-light transition cursor-pointer"
            >
              Lock for VIP
            </button>
            <button
              onClick={() => {
                ids.forEach((id) => db.episodes.delete(id));
                setSelectedIds([]);
              }}
              className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold text-[11px] hover:bg-red-700 transition cursor-pointer"
            >
              Delete
            </button>
            <button onClick={clear} className="px-2 py-1 text-[11px] text-muted hover:text-ink cursor-pointer">
              Clear
            </button>
          </div>
        )}
      />

      {/* Media Preview Modal */}
      {previewEp && (
        <MediaPreviewModal
          isOpen={Boolean(previewEp)}
          onClose={() => setPreviewEp(null)}
          title={previewEp.titleSw}
          mediaUrl={previewEp.mediaUrl}
          mediaType={previewEp.mediaType}
          posterUrl={previewEp.posterUrl}
        />
      )}

      {/* Edit Episode Modal */}
      {editingEpisode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-line">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="font-display text-lg font-bold text-deep-green">Edit Episode</h3>
              <button
                onClick={() => setEditingEpisode(null)}
                className="text-muted hover:text-ink text-lg p-1 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  Kiswahili Title *
                </label>
                <input
                  type="text"
                  value={formTitleSw}
                  onChange={(e) => setFormTitleSw(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-bold text-ink focus:bg-white focus:border-gold focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  English Title *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs text-ink focus:bg-white focus:border-gold focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                    Track Order #
                  </label>
                  <input
                    type="number"
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value))}
                    min={1}
                    required
                    className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-bold text-ink focus:bg-white focus:border-gold focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                    Duration (Sec) *
                  </label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    min={1}
                    required
                    className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-bold text-ink focus:bg-white focus:border-gold focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  Media URL *
                </label>
                <input
                  type="text"
                  value={formMediaUrl}
                  onChange={(e) => setFormMediaUrl(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs text-ink focus:bg-white focus:border-gold focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                    Author / Reciter
                  </label>
                  <input
                    type="text"
                    value={formAuthorName}
                    onChange={(e) => setFormAuthorName(e.target.value)}
                    placeholder="e.g. Ustadh Juma"
                    className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs text-ink focus:bg-white focus:border-gold focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                    Author Phone
                  </label>
                  <input
                    type="text"
                    value={formAuthorPhone}
                    onChange={(e) => setFormAuthorPhone(e.target.value)}
                    placeholder="+255..."
                    className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs text-ink focus:bg-white focus:border-gold focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink">
                  <input
                    type="checkbox"
                    checked={formIsFree}
                    onChange={(e) => setFormIsFree(e.target.checked)}
                    className="rounded border-line text-deep-green focus:ring-gold"
                  />
                  <span>Free Tier (Unchecked = VIP Locked)</span>
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setEditingEpisode(null)}
                  className="rounded-xl border border-line px-4 py-2 text-xs font-bold text-ink hover:bg-sand/40 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-deep-green px-4 py-2 text-xs font-bold text-warm-white hover:bg-teal transition shadow-xs cursor-pointer"
                >
                  Save Episode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={`Delete Episode "${deleteTarget?.titleSw}"?`}
        message="Are you sure you want to permanently delete this episode? Progress and playback history for this track will be purged."
        confirmLabel="Delete Track"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
