import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Eye,
  EyeOff,
  Heart,
  Trash2,
  User,
  Film,
} from "lucide-react";
import { db, subscribeDb } from "../../lib/mock/db";
import type { Comment } from "../../lib/mock/types";
import DataTable, { ColumnDef } from "../../components/admin/DataTable";
import ConfirmModal from "../../components/admin/ConfirmModal";

export default function CommentsAdminPage() {
  const [, setDbVersion] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Comment | null>(null);

  useEffect(() => {
    setComments(db.comments.findMany({ includeHidden: true }));
    return subscribeDb(() => {
      setDbVersion((v) => v + 1);
      setComments(db.comments.findMany({ includeHidden: true }));
    });
  }, []);

  function handleDelete() {
    if (!deleteTarget) return;
    db.comments.delete(deleteTarget.id);
    setDeleteTarget(null);
  }

  function handleBulkHide(hide: boolean) {
    selectedIds.forEach((id) => {
      const c = comments.find((item) => item.id === id);
      if (c && c.hidden !== hide) db.comments.toggleHide(id);
    });
    setSelectedIds([]);
  }

  function handleBulkDelete() {
    selectedIds.forEach((id) => db.comments.delete(id));
    setSelectedIds([]);
  }

  const columns: ColumnDef<Comment>[] = [
    {
      id: "userName",
      header: "Author",
      sortable: true,
      cell: (c) => (
        <div>
          <div className="font-bold text-deep-green text-xs flex items-center gap-1">
            <User className="h-3 w-3 text-muted" />
            <span>{c.userName}</span>
          </div>
          {c.userPhone && (
            <span className="font-mono text-[10px] text-muted">{c.userPhone}</span>
          )}
        </div>
      ),
    },
    {
      id: "text",
      header: "Comment Content",
      cell: (c) => (
        <div className="max-w-md">
          <p className="text-xs text-ink line-clamp-2 italic">"{c.text}"</p>
          {c.hidden && (
            <span className="inline-block mt-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
              Hidden from public view
            </span>
          )}
        </div>
      ),
    },
    {
      id: "series",
      header: "Target Series",
      cell: (c) => {
        const s = db.series.findById(c.seriesId);
        return (
          <div className="text-xs">
            <span className="font-bold text-teal flex items-center gap-1">
              <Film className="h-3 w-3" />
              <span>{s?.titleSw || c.seriesId}</span>
            </span>
          </div>
        );
      },
    },
    {
      id: "likes",
      header: "Likes",
      align: "center",
      sortable: true,
      accessor: (c) => c.likes,
      cell: (c) => (
        <button
          onClick={() => db.comments.toggleLike(c.id)}
          className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg transition cursor-pointer"
          title="Increment Like Count"
        >
          <Heart className="h-3 w-3 fill-rose-600 text-rose-600" />
          <span>{c.likes}</span>
        </button>
      ),
    },
    {
      id: "createdAt",
      header: "Posted",
      align: "right",
      width: "100px",
      cell: (c) => (
        <span className="text-[11px] text-muted">
          {new Date(c.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Moderation",
      align: "right",
      width: "100px",
      cell: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => db.comments.toggleHide(c.id)}
            className={`p-1.5 rounded-lg border border-line transition cursor-pointer ${
              c.hidden
                ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "text-ink hover:bg-sand/40 hover:text-deep-green"
            }`}
            title={c.hidden ? "Unhide Comment" : "Hide Comment"}
          >
            {c.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => setDeleteTarget(c)}
            className="p-1.5 rounded-lg border border-line text-red-600 hover:bg-red-50 transition cursor-pointer"
            title="Delete Comment"
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
            <MessageSquare className="h-6 w-6 text-gold" />
            User Comments Moderation
          </h1>
          <p className="text-[13px] text-muted mt-0.5">
            Section 7.6 Comment Schema · Monitor listener feedback, toggle visibility, and moderate inappropriate comments.
          </p>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={comments}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        searchPlaceholder="Search comment text or author..."
        searchFilter={(c, q) =>
          Boolean(
            c.text.toLowerCase().includes(q) ||
            c.userName.toLowerCase().includes(q) ||
            (c.userPhone && c.userPhone.includes(q))
          )
        }
        bulkActions={(ids, clear) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkHide(true)}
              className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-700 transition cursor-pointer"
            >
              Hide Selected
            </button>
            <button
              onClick={() => handleBulkHide(false)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition cursor-pointer"
            >
              Unhide Selected
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold text-[11px] hover:bg-red-700 transition cursor-pointer"
            >
              Delete Selected
            </button>
            <button onClick={clear} className="px-2 py-1 text-[11px] text-muted hover:text-ink cursor-pointer">
              Clear
            </button>
          </div>
        )}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete User Comment?"
        message="Are you sure you want to delete this comment? This cannot be undone."
        confirmLabel="Delete Comment"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
