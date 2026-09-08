import React, { useState, useEffect } from "react";
import {
  Bell,
  Send,
  Trash2,
  Users,
  Crown,
  Sparkles,
  Info,
  AlertCircle,
} from "lucide-react";
import { db, subscribeDb } from "../../lib/mock/db";
import type { Notification, NotificationType, TargetAudience } from "../../lib/mock/types";
import DataTable, { ColumnDef } from "../../components/admin/DataTable";
import ConfirmModal from "../../components/admin/ConfirmModal";

export default function NotificationsAdminPage() {
  const [, setDbVersion] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null);

  // Form
  const [titleSw, setTitleSw] = useState("");
  const [title, setTitle] = useState("");
  const [msgSw, setMsgSw] = useState("");
  const [msg, setMsg] = useState("");
  const [type, setType] = useState<NotificationType>("ANNOUNCEMENT");
  const [audience, setAudience] = useState<TargetAudience>("ALL");

  useEffect(() => {
    setNotifications(db.notifications.findMany());
    return subscribeDb(() => {
      setDbVersion((v) => v + 1);
      setNotifications(db.notifications.findMany());
    });
  }, []);

  function handleBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!titleSw.trim() || !msgSw.trim()) return;

    db.notifications.create({
      title: title.trim() || titleSw.trim(),
      titleSw: titleSw.trim(),
      message: msg.trim() || msgSw.trim(),
      messageSw: msgSw.trim(),
      type,
      targetAudience: audience,
    });

    setIsModalOpen(false);
    setTitleSw("");
    setTitle("");
    setMsgSw("");
    setMsg("");
  }

  function handleDelete() {
    if (!deleteTarget) return;
    db.notifications.delete(deleteTarget.id);
    setDeleteTarget(null);
  }

  const columns: ColumnDef<Notification>[] = [
    {
      id: "type",
      header: "Type",
      width: "140px",
      cell: (n) => {
        const styles: Record<NotificationType, string> = {
          SYSTEM: "bg-sand text-ink",
          NEW_EPISODE: "bg-emerald-100 text-emerald-800",
          SUBSCRIPTION_EXPIRING: "bg-amber-100 text-amber-800",
          ANNOUNCEMENT: "bg-purple-100 text-purple-800",
          PAYMENT: "bg-teal/15 text-teal",
          COMMUNITY: "bg-blue-100 text-blue-800",
        };
        return (
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${styles[n.type]}`}>
            {n.type}
          </span>
        );
      },
    },
    {
      id: "titleSw",
      header: "Title (Swahili / English)",
      sortable: true,
      cell: (n) => (
        <div>
          <div className="font-bold text-deep-green text-xs">{n.titleSw}</div>
          <div className="text-[11px] text-muted">{n.title}</div>
        </div>
      ),
    },
    {
      id: "messageSw",
      header: "Broadcast Message",
      cell: (n) => (
        <div className="max-w-md text-xs text-ink">
          <p className="line-clamp-2">{n.messageSw}</p>
        </div>
      ),
    },
    {
      id: "targetAudience",
      header: "Audience",
      align: "center",
      width: "130px",
      cell: (n) => {
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-sand/60 text-deep-green px-2 py-0.5 rounded-md">
            {n.targetAudience === "VIP_ONLY" ? (
              <>
                <Crown className="h-3 w-3 text-gold" />
                <span>VIP Only</span>
              </>
            ) : n.targetAudience === "FREE_TIER_ONLY" ? (
              <span>Free Tier</span>
            ) : (
              <>
                <Users className="h-3 w-3" />
                <span>All Users</span>
              </>
            )}
          </span>
        );
      },
    },
    {
      id: "createdAt",
      header: "Sent At",
      align: "right",
      width: "100px",
      cell: (n) => (
        <span className="text-[11px] text-muted">
          {new Date(n.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      width: "80px",
      cell: (n) => (
        <button
          onClick={() => setDeleteTarget(n)}
          className="p-1.5 rounded-lg border border-line text-red-600 hover:bg-red-50 transition cursor-pointer"
          title="Delete Notification"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-deep-green flex items-center gap-2">
            <Bell className="h-6 w-6 text-gold" />
            System Notifications & Broadcasts
          </h1>
          <p className="text-[13px] text-muted mt-0.5">
            Section 7.8 Notification Schema · Send targeted in-app broadcasts to listeners, VIP members, or free users.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 bg-deep-green hover:bg-teal text-warm-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Send className="h-4 w-4 text-gold-light" />
          <span>New Broadcast</span>
        </button>
      </div>

      {/* Notifications Table */}
      <DataTable
        columns={columns}
        data={notifications}
        searchPlaceholder="Search broadcasts..."
        searchFilter={(n, q) =>
          n.titleSw.toLowerCase().includes(q) ||
          n.title.toLowerCase().includes(q) ||
          n.messageSw.toLowerCase().includes(q)
        }
      />

      {/* Broadcast Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-line">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="font-display text-lg font-bold text-deep-green flex items-center gap-2">
                <Send className="h-5 w-5 text-gold" />
                <span>Send In-App Notification</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted hover:text-ink text-lg p-1 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBroadcast} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                    Broadcast Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as NotificationType)}
                    className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-bold text-ink focus:bg-white focus:border-gold focus:outline-none cursor-pointer"
                  >
                    <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
                    <option value="NEW_EPISODE">NEW_EPISODE</option>
                    <option value="SUBSCRIPTION_EXPIRING">SUBSCRIPTION_EXPIRING</option>
                    <option value="SYSTEM">SYSTEM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                    Target Audience
                  </label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as TargetAudience)}
                    className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-bold text-ink focus:bg-white focus:border-gold focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Users (Public)</option>
                    <option value="VIP_ONLY">VIP Subscribers Only</option>
                    <option value="FREE_TIER_ONLY">Free Tier Users Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  Kiswahili Title *
                </label>
                <input
                  type="text"
                  value={titleSw}
                  onChange={(e) => setTitleSw(e.target.value)}
                  placeholder="e.g. Kipindi Kipya Kimeachiwa!"
                  required
                  className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-bold text-ink focus:bg-white focus:border-gold focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  English Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. New Episode Released!"
                  className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs text-ink focus:bg-white focus:border-gold focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  Kiswahili Message Content *
                </label>
                <textarea
                  value={msgSw}
                  onChange={(e) => setMsgSw(e.target.value)}
                  rows={2}
                  required
                  placeholder="e.g. Furahia kisa cha Salman Al-Farsi sasa kinapatikana..."
                  className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs text-ink focus:bg-white focus:border-gold focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  English Message Content
                </label>
                <textarea
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  rows={2}
                  placeholder="e.g. Enjoy the story of Salman Al-Farsi now available..."
                  className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs text-ink focus:bg-white focus:border-gold focus:outline-none transition"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-line px-4 py-2 text-xs font-bold text-ink hover:bg-sand/40 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-deep-green px-4 py-2 text-xs font-bold text-warm-white hover:bg-teal transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5 text-gold-light" />
                  <span>Send Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Notification?"
        message="Are you sure you want to delete this notification record?"
        confirmLabel="Delete Notification"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
