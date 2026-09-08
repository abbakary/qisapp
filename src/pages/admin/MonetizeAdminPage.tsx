import React, { useEffect, useState } from "react";
import { Coins, Gift, HeartHandshake, Smartphone, TrendingUp } from "lucide-react";
import { db, subscribeDb } from "../../lib/mock/db";
import StatsCard from "../../components/admin/StatsCard";
import { formatTzs } from "../../lib/entitlements";

export default function MonetizeAdminPage() {
  const [, setDbVersion] = useState(0);
  useEffect(() => subscribeDb(() => setDbVersion((v) => v + 1)), []);

  const kpis = db.monetize.kpis();
  const analytics = db.monetize.analytics();
  const unlocks = db.unlocks.all();
  const gifts = db.sponsorships.findMany();
  const sow = db.monetize.storyOfWeek();
  const top = (kpis?.topConvertingSeries || []).map(([id, n]) => {
    const s = db.series.findById(id);
    return { id, n, title: s?.titleSw || id };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-deep-green flex items-center gap-2">
          <Coins className="h-6 w-6 text-gold" />
          Phase 1 monetization
        </h1>
        <p className="text-[13px] text-muted mt-0.5">
          Watch who came back this week, free→unlock, unlock→sponsor, and which series convert — not downloads.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active this week"
          value={analytics?.kpis.wauHint ?? kpis?.weeklyActiveHint ?? db.store.users.length}
          subtext="Listeners who came back in the last 7 days"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatsCard
          title="Free → unlock"
          value={`${kpis?.freeToUnlockRate ?? 0}%`}
          subtext={`${kpis?.unlocks ?? unlocks.length} paid unlocks`}
          icon={<Smartphone className="h-4 w-4" />}
          variant="gold"
        />
        <StatsCard
          title="Unlock → sponsor"
          value={`${kpis?.unlockToSponsorRate ?? 0}%`}
          subtext={`${kpis?.sponsorships ?? gifts.length} sadaqah gifts`}
          icon={<HeartHandshake className="h-4 w-4" />}
          variant="teal"
        />
        <StatsCard
          title="Unlock + sadaqah"
          value={formatTzs(kpis?.revenueTzs || 0)}
          subtext={`${kpis?.sponsoredPlays || 0} children/listeners reached`}
          icon={<Gift className="h-4 w-4" />}
        />
      </div>

      {sow && (
        <div className="rounded-2xl border border-gold/40 bg-gold/10 p-4">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-gold-dark">Story of the week</div>
          <div className="font-display text-lg text-deep-green mt-0.5">{sow.titleSw}</div>
          <p className="text-xs text-muted">Full catalog playable this week. Rotate from Series admin.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-line bg-white p-5">
          <h3 className="font-display text-base font-bold text-deep-green mb-3">Top converting series</h3>
          {top.length === 0 ? (
            <p className="text-xs text-muted">No paid unlocks yet — this list tells you what to produce next.</p>
          ) : (
            <div className="space-y-2">
              {top.map((row) => (
                <div key={row.id} className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ink">{row.title}</span>
                  <span className="font-mono text-deep-green">{row.n} unlocks</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <h3 className="font-display text-base font-bold text-deep-green mb-3">Recent sadaqah</h3>
          {gifts.length === 0 ? (
            <p className="text-xs text-muted">Anonymous by default. Named optional. Impact, not leaderboards.</p>
          ) : (
            <div className="space-y-2">
              {gifts.slice(0, 8).map((g) => {
                const s = db.series.findById(g.seriesId);
                return (
                  <div key={g.id} className="text-xs border-b border-line/60 pb-2">
                    <div className="font-bold text-deep-green">
                      {g.anonymous ? "Anonymous" : g.donorName || g.donorId} · {formatTzs(g.amountTzs)}
                    </div>
                    <div className="text-muted">
                      {g.seriesTitleSw || s?.titleSw} · {g.targetLabel} · {g.referenceCode}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h3 className="font-display text-base font-bold text-deep-green mb-3">Unlock ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-muted uppercase tracking-wider">
              <tr>
                <th className="text-left py-2">User</th>
                <th className="text-left">Series</th>
                <th>Kind</th>
                <th>Rail</th>
                <th className="text-right">TZS</th>
              </tr>
            </thead>
            <tbody>
              {unlocks.slice(0, 40).map((u) => (
                <tr key={u.id} className="border-t border-line">
                  <td className="py-2">
                    <div className="font-bold text-ink">{u.userName || u.userId}</div>
                    <div className="text-[10px] text-muted font-mono">{u.userPhone}</div>
                  </td>
                  <td>{u.seriesTitleSw || db.series.findById(u.seriesId)?.titleSw || u.seriesId}</td>
                  <td className="text-center">{u.kind}</td>
                  <td className="text-center">{u.paymentMethod}</td>
                  <td className="text-right font-mono">{u.amountTzs.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {unlocks.length === 0 && <p className="text-xs text-muted py-4">No unlocks yet.</p>}
        </div>
      </div>
    </div>
  );
}
