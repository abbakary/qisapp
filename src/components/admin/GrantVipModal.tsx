import React, { useState } from "react";
import type { SubscriptionPlan, User } from "../../lib/mock/types";
import { hydrate } from "../../lib/mock/db";
import { api } from "../../lib/api/client";

interface GrantVipModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PLANS: { id: SubscriptionPlan; name: string; nameSw: string; days: number; tzs: number }[] = [
  { id: "WEEKLY", name: "Weekly VIP", nameSw: "Kifurushi cha Wiki", days: 7, tzs: 1000 },
  { id: "MONTHLY", name: "Monthly VIP", nameSw: "Kifurushi cha Mwezi", days: 30, tzs: 3500 },
  { id: "ANNUAL", name: "Annual VIP", nameSw: "Kifurushi cha Mwaka", days: 365, tzs: 25000 },
  { id: "VIP_LIFETIME", name: "Lifetime VIP", nameSw: "VIP wa Maisha (10 Yrs)", days: 3650, tzs: 100000 },
];

export default function GrantVipModal({ user, isOpen, onClose, onSuccess }: GrantVipModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>("MONTHLY");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!isOpen || !user) return null;

  async function handleGrant() {
    if (!user) return;
    setBusy(true);
    setMsg(null);
    try {
      await api("/api/subscriptions/grant", {
        method: "POST",
        body: JSON.stringify({ userId: user.id, plan: selectedPlan }),
      });
      await hydrate();
      setMsg({ ok: true, text: `Successfully granted ${selectedPlan} VIP to ${user.name}!` });
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 800);
    } catch {
      setMsg({ ok: false, text: "Error granting VIP." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-line">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div>
            <h3 className="font-display text-lg font-bold text-deep-green">Grant VIP Access</h3>
            <p className="text-[12px] text-muted mt-0.5">
              Target User: <strong className="text-deep-green">{user.name}</strong> ({user.phone || user.email})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink text-lg p-1 transition"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Select VIP Plan
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {PLANS.map((p) => {
              const selected = selectedPlan === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition cursor-pointer ${
                    selected
                      ? "border-gold bg-gold/10 shadow-xs"
                      : "border-line bg-white hover:border-sand hover:bg-sand/20"
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-deep-green">{p.nameSw}</div>
                    <div className="text-[11px] text-muted">
                      {p.name} · {p.days} days access
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-gold bg-deep-green px-2 py-1 rounded-md">
                      {p.tzs.toLocaleString()} TZS
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {msg && (
          <p
            className={`mt-4 text-[12px] font-bold p-2.5 rounded-xl ${
              msg.ok ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"
            }`}
          >
            {msg.text}
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-line">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line bg-white px-4 py-2 text-[12px] font-bold text-ink hover:bg-sand/30 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleGrant}
            className="rounded-xl bg-gold px-4 py-2 text-[12px] font-bold text-deep-green hover:bg-gold-light transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {busy ? "Granting..." : "Confirm VIP Grant"}
          </button>
        </div>
      </div>
    </div>
  );
}
