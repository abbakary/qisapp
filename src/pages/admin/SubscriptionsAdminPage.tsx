import React, { useState, useEffect, useMemo } from "react";
import {
  CreditCard,
  Crown,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  DollarSign,
  User,
  Phone,
} from "lucide-react";
import { db, subscribeDb } from "../../lib/mock/db";
import type { Subscription, SubscriptionPlan, SubscriptionStatus, User as UserType } from "../../lib/mock/types";
import DataTable, { ColumnDef } from "../../components/admin/DataTable";
import StatsCard from "../../components/admin/StatsCard";
import GrantVipModal from "../../components/admin/GrantVipModal";
import ConfirmModal from "../../components/admin/ConfirmModal";

export default function SubscriptionsAdminPage() {
  const [, setDbVersion] = useState(0);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [grantVipTarget, setGrantVipTarget] = useState<UserType | null>(null);
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [selectedUserIdForGrant, setSelectedUserIdForGrant] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null);

  useEffect(() => {
    setSubscriptions(db.subscriptions.findMany());
    setUsers(db.users.findMany());
    return subscribeDb(() => {
      setDbVersion((v) => v + 1);
      setSubscriptions(db.subscriptions.findMany());
      setUsers(db.users.findMany());
    });
  }, []);

  const unlocks = db.unlocks.all().filter((u) => u.kind !== "SPONSORED_GRANT");
  const gifts = db.sponsorships.findMany();
  const unlockRevenue = unlocks.reduce((sum, u) => sum + (u.amountTzs || 0), 0) + gifts.reduce((sum, g) => sum + (g.amountTzs || 0), 0);
  const totalRevenue = db.subscriptions.totalRevenue();
  const activeCount = db.subscriptions.activeCount();

  const filtered = useMemo(() => {
    return subscriptions.filter((s) => {
      if (selectedPlan !== "ALL" && s.plan !== selectedPlan) return false;
      if (selectedStatus !== "ALL" && s.status !== selectedStatus) return false;
      return true;
    });
  }, [subscriptions, selectedPlan, selectedStatus]);

  function toggleStatus(sub: Subscription) {
    const nextStatus: SubscriptionStatus = sub.status === "ACTIVE" ? "CANCELLED" : "ACTIVE";
    db.subscriptions.updateStatus(sub.id, nextStatus);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    db.subscriptions.delete(deleteTarget.id);
    setDeleteTarget(null);
  }

  function handleStartGrant() {
    if (users.length === 0) return;
    setGrantVipTarget(users[0]);
    setSelectedUserIdForGrant(users[0].id);
    setGrantModalOpen(true);
  }

  const columns: ColumnDef<Subscription>[] = [
    {
      id: "referenceCode",
      header: "Reference Code",
      sortable: true,
      cell: (s) => (
        <div>
          <span className="font-mono text-xs font-bold text-deep-green bg-sand/60 px-2 py-0.5 rounded">
            {s.referenceCode}
          </span>
          <div className="text-[10px] text-muted mt-0.5">{s.paymentMethod}</div>
        </div>
      ),
    },
    {
      id: "userName",
      header: "Subscriber",
      sortable: true,
      cell: (s) => (
        <div>
          <div className="font-bold text-ink text-xs flex items-center gap-1">
            <User className="h-3 w-3 text-muted" />
            <span>{s.userName}</span>
          </div>
          <div className="font-mono text-[10px] text-muted flex items-center gap-1 mt-0.5">
            <Phone className="h-2.5 w-2.5" />
            <span>{s.userPhone}</span>
          </div>
        </div>
      ),
    },
    {
      id: "plan",
      header: "Plan Tier",
      sortable: true,
      cell: (s) => (
        <div>
          <span className="font-bold text-xs text-deep-green flex items-center gap-1">
            <Crown className="h-3 w-3 text-gold fill-gold" />
            <span>{s.planNameSw}</span>
          </span>
          <span className="text-[10px] text-muted uppercase tracking-wider">{s.plan}</span>
        </div>
      ),
    },
    {
      id: "amountTzs",
      header: "Amount",
      align: "right",
      sortable: true,
      accessor: (s) => s.amountTzs,
      cell: (s) => (
        <span className="font-mono text-xs font-bold text-deep-green">
          {s.amountTzs.toLocaleString()} TZS
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      align: "center",
      width: "110px",
      cell: (s) => (
        <button
          onClick={() => toggleStatus(s)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
            s.status === "ACTIVE"
              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
              : s.status === "EXPIRED"
              ? "bg-sand text-muted hover:text-ink"
              : "bg-rose-100 text-rose-800 hover:bg-rose-200"
          }`}
          title="Click to toggle status"
        >
          {s.status === "ACTIVE" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          <span>{s.status}</span>
        </button>
      ),
    },
    {
      id: "dates",
      header: "Active Dates",
      cell: (s) => (
        <div className="text-[10px] font-mono text-muted">
          <div>From: {new Date(s.startDate).toLocaleDateString()}</div>
          <div>To: {new Date(s.endDate).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      width: "80px",
      cell: (s) => (
        <button
          onClick={() => setDeleteTarget(s)}
          className="p-1.5 rounded-lg border border-line text-red-600 hover:bg-red-50 transition cursor-pointer"
          title="Delete Subscription Record"
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
            <CreditCard className="h-6 w-6 text-gold" />
            Payments, unlocks & VIP
          </h1>
          <p className="text-[13px] text-muted mt-0.5">
            Phase 1 one-time unlocks and sadaqah appear here live. VIP plans remain optional.
          </p>
        </div>

        <button
          onClick={handleStartGrant}
          className="flex items-center gap-1.5 bg-gold hover:bg-gold-light text-deep-green text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Crown className="h-4 w-4" />
          <span>+ Grant VIP Access</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Unlock + sadaqah"
          value={`${unlockRevenue.toLocaleString()} TZS`}
          subtext={`${unlocks.length} unlocks · ${gifts.length} gifts`}
          icon={<DollarSign className="h-4 w-4" />}
          variant="gold"
        />
        <StatsCard
          title="Active VIP Subscribers"
          value={activeCount}
          subtext="Unlimited listening access"
          icon={<Crown className="h-4 w-4" />}
          variant="teal"
        />
        <StatsCard
          title="Average Order Value"
          value={`${Math.round(totalRevenue / Math.max(1, subscriptions.length)).toLocaleString()} TZS`}
          subtext="Per completed plan"
          icon={<CreditCard className="h-4 w-4" />}
        />
        <StatsCard
          title="VIP orders"
          value={subscriptions.length}
          subtext={`${totalRevenue.toLocaleString()} TZS optional VIP`}
          icon={<CheckCircle className="h-4 w-4" />}
        />
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-xs overflow-x-auto">
        <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
          <div>
            <h2 className="font-display text-base font-bold text-deep-green">Series unlocks</h2>
            <p className="text-[11px] text-muted">M-Pesa / Tigo Pesa / Airtel Money — owned forever</p>
          </div>
          <span className="text-xs font-bold text-muted">{unlocks.length}</span>
        </div>
        {unlocks.length === 0 ? (
          <p className="text-xs text-muted py-4">No unlock payments yet.</p>
        ) : (
          <table className="w-full text-xs">
            <thead className="text-muted uppercase tracking-wider">
              <tr>
                <th className="text-left py-2">Reference</th>
                <th className="text-left">Listener</th>
                <th className="text-left">Series</th>
                <th>Rail</th>
                <th className="text-right">TZS</th>
              </tr>
            </thead>
            <tbody>
              {unlocks.map((u) => (
                <tr key={u.id} className="border-t border-line">
                  <td className="py-2">
                    <div className="font-mono font-bold text-deep-green">{u.referenceCode}</div>
                    <div className="text-[10px] text-muted">{u.kind}</div>
                  </td>
                  <td>
                    <div className="font-bold text-ink">{u.userName || "Listener"}</div>
                    <div className="font-mono text-[10px] text-muted">{u.userPhone}</div>
                  </td>
                  <td>{u.seriesTitleSw || db.series.findById(u.seriesId)?.titleSw || u.seriesId}</td>
                  <td className="text-center">{u.paymentMethod}</td>
                  <td className="text-right font-mono font-bold">{u.amountTzs.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search subscriber name, phone, or reference code..."
        searchFilter={(s, q) =>
          s.userName.toLowerCase().includes(q) ||
          s.userPhone.includes(q) ||
          s.referenceCode.toLowerCase().includes(q) ||
          s.plan.toLowerCase().includes(q)
        }
        filterSlot={
          <div className="flex items-center gap-2 text-xs">
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="rounded-xl border border-line bg-sand/30 px-2.5 py-2 text-ink focus:bg-white focus:border-gold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Plans</option>
              <option value="WEEKLY">Weekly VIP</option>
              <option value="MONTHLY">Monthly VIP</option>
              <option value="ANNUAL">Annual VIP</option>
              <option value="VIP_LIFETIME">Lifetime VIP</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-line bg-sand/30 px-2.5 py-2 text-ink focus:bg-white focus:border-gold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        }
      />

      {/* Grant VIP Dialog with User Selector */}
      {grantModalOpen && grantVipTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-line">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="font-display text-lg font-bold text-deep-green flex items-center gap-1.5">
                <Crown className="h-5 w-5 text-gold fill-gold" />
                <span>Grant VIP Access</span>
              </h3>
              <button
                onClick={() => setGrantModalOpen(false)}
                className="text-muted hover:text-ink text-lg p-1 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  Select Target User
                </label>
                <select
                  value={selectedUserIdForGrant}
                  onChange={(e) => {
                    setSelectedUserIdForGrant(e.target.value);
                    const found = users.find((u) => u.id === e.target.value);
                    if (found) setGrantVipTarget(found);
                  }}
                  className="mt-1 w-full rounded-xl border border-line bg-sand/30 p-2.5 text-xs font-semibold text-ink focus:bg-white focus:border-gold focus:outline-none cursor-pointer"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.phone || u.email}) — Current: {u.subscriptionStatus || "FREE"}
                    </option>
                  ))}
                </select>
              </div>

              {grantVipTarget && (
                <GrantVipModal
                  user={grantVipTarget}
                  isOpen={true}
                  onClose={() => setGrantModalOpen(false)}
                  onSuccess={() => setGrantModalOpen(false)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Subscription Record?"
        message="This will delete this subscription invoice record from the system."
        confirmLabel="Delete Record"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
