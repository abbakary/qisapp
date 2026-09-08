import React, { useState, useEffect, useMemo } from "react";
import {
  UploadCloud,
  Play,
  CheckCircle,
  XCircle,
  Trash2,
  AlertCircle,
  Clock,
  User,
  Phone,
} from "lucide-react";
import { db, subscribeDb } from "../../lib/mock/db";
import type { CommunityUpload } from "../../lib/mock/types";
import DataTable, { ColumnDef } from "../../components/admin/DataTable";
import MediaPreviewModal from "../../components/admin/MediaPreviewModal";
import ConfirmModal from "../../components/admin/ConfirmModal";

export default function CommunityAdminPage() {
  const [, setDbVersion] = useState(0);
  const [uploads, setUploads] = useState<CommunityUpload[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [previewUpload, setPreviewUpload] = useState<CommunityUpload | null>(null);
  const [rejectTarget, setRejectTarget] = useState<CommunityUpload | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CommunityUpload | null>(null);

  useEffect(() => {
    setUploads(db.communityUploads.findMany());
    return subscribeDb(() => {
      setDbVersion((v) => v + 1);
      setUploads(db.communityUploads.findMany());
    });
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return uploads;
    return uploads.filter((u) => u.status === statusFilter);
  }, [uploads, statusFilter]);

  function handleApprove(u: CommunityUpload) {
    db.communityUploads.updateStatus(u.id, "APPROVED");
  }

  function handleConfirmReject() {
    if (!rejectTarget) return;
    db.communityUploads.updateStatus(
      rejectTarget.id,
      "REJECTED",
      rejectNotes.trim() || "Does not comply with Qisas audio or doctrinal standards.",
    );
    setRejectTarget(null);
    setRejectNotes("");
  }

  function handleDelete() {
    if (!deleteTarget) return;
    db.communityUploads.delete(deleteTarget.id);
    setDeleteTarget(null);
  }

  const columns: ColumnDef<CommunityUpload>[] = [
    {
      id: "preview",
      header: "Listen",
      width: "60px",
      align: "center",
      cell: (u) => (
        <button
          onClick={() => setPreviewUpload(u)}
          className="h-8 w-8 rounded-full bg-deep-green text-gold flex items-center justify-center hover:scale-105 transition cursor-pointer shadow-xs"
          title="Play Audio"
        >
          <Play className="h-3.5 w-3.5 fill-gold ml-0.5" />
        </button>
      ),
    },
    {
      id: "titleSw",
      header: "Submission Title",
      sortable: true,
      cell: (u) => (
        <div>
          <div className="font-bold text-deep-green text-xs">{u.titleSw || u.title}</div>
          <div className="text-[11px] text-muted truncate max-w-xs">{u.descriptionSw || u.description}</div>
        </div>
      ),
    },
    {
      id: "category",
      header: "Category",
      sortable: true,
      accessor: (u) => u.category,
      cell: (u) => (
        <span className="bg-sand text-deep-green text-[11px] font-bold px-2 py-0.5 rounded-md uppercase">
          {u.category}
        </span>
      ),
    },
    {
      id: "uploader",
      header: "Speaker / Uploader",
      cell: (u) => (
        <div className="text-[11px]">
          <div className="font-bold text-ink flex items-center gap-1">
            <User className="h-3 w-3 text-muted" />
            <span>{u.authorName || u.uploaderName || u.userName || "Guest"}</span>
          </div>
          {(u.authorPhone || u.uploaderPhone || u.userPhone) && (
            <div className="text-muted flex items-center gap-1 font-mono text-[10px]">
              <Phone className="h-2.5 w-2.5" />
              <span>{u.authorPhone || u.uploaderPhone || u.userPhone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      align: "center",
      width: "110px",
      cell: (u) => {
        const styles = {
          APPROVED: "bg-emerald-100 text-emerald-800",
          PENDING: "bg-amber-100 text-amber-800 animate-pulse",
          REJECTED: "bg-rose-100 text-rose-800",
        }[u.status];

        return (
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${styles}`}>
            {u.status}
          </span>
        );
      },
    },
    {
      id: "createdAt",
      header: "Date",
      align: "right",
      width: "100px",
      cell: (u) => (
        <span className="text-[11px] text-muted">
          {new Date(u.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Moderation",
      align: "right",
      width: "140px",
      cell: (u) => (
        <div className="flex items-center justify-end gap-1.5">
          {u.status !== "APPROVED" && (
            <button
              onClick={() => handleApprove(u)}
              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
              title="Approve Submission"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
          {u.status !== "REJECTED" && (
            <button
              onClick={() => {
                setRejectTarget(u);
                setRejectNotes("");
              }}
              className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition cursor-pointer"
              title="Reject Submission"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setDeleteTarget(u)}
            className="p-1.5 rounded-lg border border-line text-red-600 hover:bg-red-50 transition cursor-pointer"
            title="Delete Permanently"
          >
            <Trash2 className="h-4 w-4" />
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
            <UploadCloud className="h-6 w-6 text-gold" />
            Community Audio Submissions
          </h1>
          <p className="text-[13px] text-muted mt-0.5">
            Section 7.7 Community Schema · Review, moderate, and approve user-uploaded Islamic audio presentations and darsas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-line bg-sand/30 px-3 py-1.5 text-xs font-bold text-ink focus:bg-white focus:border-gold focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Submissions ({uploads.length})</option>
            <option value="PENDING">Pending Review ({uploads.filter((u) => u.status === "PENDING").length})</option>
            <option value="APPROVED">Approved ({uploads.filter((u) => u.status === "APPROVED").length})</option>
            <option value="REJECTED">Rejected ({uploads.filter((u) => u.status === "REJECTED").length})</option>
          </select>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search title, speaker, or category..."
        searchFilter={(u, q) =>
          u.title.toLowerCase().includes(q) ||
          u.titleSw.toLowerCase().includes(q) ||
          (u.authorName && u.authorName.toLowerCase().includes(q)) ||
          (u.uploaderName && u.uploaderName.toLowerCase().includes(q)) ||
          u.category.toLowerCase().includes(q)
        }
      />

      {/* Audio Preview Modal */}
      {previewUpload && (
        <MediaPreviewModal
          isOpen={Boolean(previewUpload)}
          onClose={() => setPreviewUpload(null)}
          title={previewUpload.titleSw || previewUpload.title}
          mediaUrl={previewUpload.mediaUrl}
          mediaType={previewUpload.mediaType}
        />
      )}

      {/* Reject Modal with Reason */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-line">
            <h3 className="font-display text-lg font-bold text-deep-green">
              Reject Submission: {rejectTarget.titleSw}
            </h3>
            <p className="mt-1 text-xs text-muted">
              Enter feedback or reason for rejection. This will be stored for audit purposes.
            </p>

            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="e.g. Background audio noise, unauthorized recitation, or content rules mismatch..."
              rows={3}
              className="mt-3 w-full rounded-xl border border-line bg-sand/20 p-3 text-xs text-ink focus:bg-white focus:border-gold focus:outline-none transition"
            />

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="rounded-xl border border-line px-4 py-2 text-xs font-bold text-ink hover:bg-sand/40 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition shadow-xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={`Permanently Delete Submission "${deleteTarget?.titleSw}"?`}
        message="This will completely remove the audio record and its moderation log."
        confirmLabel="Delete Submission"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
