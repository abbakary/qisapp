import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  Flame,
  HeartHandshake,
  Lightbulb,
  RefreshCw,
  Smartphone,
  TrendingUp,
  Users,
} from "lucide-react";
import { db, subscribeDb } from "../../lib/mock/db";
import StatsCard from "../../components/admin/StatsCard";
import { formatTzs } from "../../lib/entitlements";
import type { AnalyticsReport } from "../../lib/mock/types";

const RAIL_COLORS = ["#1A4D3E", "#D4AF37", "#2D7D6F", "#8C7335", "#E05A47"];
const TIP = {
  backgroundColor: "#1A4D3E",
  borderRadius: "10px",
  color: "#FAF8F5",
  border: "1px solid #D4AF37",
  fontSize: "12px",
};

function pct(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return `${n}%`;
}

export default function AdminAnalyticsPage() {
  const [, setDbVersion] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeDb(() => setDbVersion((v) => v + 1)), []);

  async function reload() {
    setBusy(true);
    try {
      await db.monetize.refreshAdmin();
    } finally {
      setBusy(false);
    }
  }

  const report: AnalyticsReport | null = db.monetize.analytics();
  const k = report?.kpis;
  const daily = report?.daily || [];
  const last7 = daily.slice(-7);
  const weekRev = last7.reduce((s, d) => s + d.revenueTzs, 0);
  const prev7 = daily.slice(0, Math.max(0, daily.length - 7));
  const prevRev = prev7.reduce((s, d) => s + d.revenueTzs, 0);
  const weekDelta = prevRev ? Math.round(((weekRev - prevRev) / prevRev) * 100) : null;
  const funnel = report?.funnel || [];
  const maxFunnel = Math.max(1, ...funnel.map((f) => f.value));
  const rails = report?.rails || [];
  const bands = report?.priceBands || [];
  const series = report?.series || [];
  const convertLeaders = [...series].sort((a, b) => b.unlocks - a.unlocks || b.views - a.views).slice(0, 8);
  const completionLeaders = [...series]
    .filter((s) => s.starters > 0)
    .sort((a, b) => b.completionRate - a.completionRate)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-deep-green flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-gold" />
            Phase 1 analytics
          </h1>
          <p className="text-[13px] text-muted mt-0.5 max-w-2xl">
            Watch who came back this week, free→unlock, unlock→sponsor, 7-day / 30-day return, and completion per series — not downloads.
            These numbers tell you what to produce next.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-xs font-bold text-deep-green hover:bg-sand/40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
          Refresh live
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <StatsCard
          title="Active this week"
          value={k?.wauHint ?? 0}
          subtext={`Came back in the last 7 days · ${k?.registered ?? 0} registered`}
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Free → unlock"
          value={pct(k?.freeToUnlockRate)}
          subtext={`${k?.buyers ?? 0} buyers of ${k?.freeUsers ?? 0} free users`}
          icon={<Smartphone className="h-4 w-4" />}
          variant="gold"
        />
        <StatsCard
          title="Unlock → sponsor"
          value={pct(k?.unlockToSponsorRate)}
          subtext={`${k?.sponsorships ?? 0} sadaqah gifts`}
          icon={<HeartHandshake className="h-4 w-4" />}
          variant="teal"
        />
        <StatsCard
          title="D7 / D30 retention"
          value={`${pct(k?.d7Retention)} / ${pct(k?.d30Retention)}`}
          subtext={
            k?.d7Cohort
              ? `Cohorts ${k.d7Cohort} / ${k.d30Cohort} users old enough`
              : "Need older accounts before D7/D30 fill in"
          }
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatsCard
          title="Series completion"
          value={pct(k?.completionRate)}
          subtext="Share who finish after starting"
          icon={<Flame className="h-4 w-4" />}
        />
        <StatsCard
          title="Unlock + sadaqah"
          value={formatTzs(k?.revenueTzs || 0)}
          subtext={`${formatTzs(k?.unlockRevenueTzs || 0)} paid · ${formatTzs(k?.sadaqahRevenueTzs || 0)} gifts`}
          icon={<BarChart3 className="h-4 w-4" />}
          variant="gold"
        />
      </div>

      {report?.insights && report.insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {report.insights.map((ins) => (
            <div
              key={ins.title}
              className={`rounded-2xl border p-4 ${
                ins.tone === "good"
                  ? "border-emerald-200 bg-emerald-50"
                  : ins.tone === "watch"
                  ? "border-amber-200 bg-amber-50"
                  : "border-gold/40 bg-gold/10"
              }`}
            >
              <div className="flex items-start gap-2">
                <Lightbulb
                  className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                    ins.tone === "watch" ? "text-amber-700" : "text-deep-green"
                  }`}
                />
                <div>
                  <div className="text-sm font-bold text-deep-green">{ins.title}</div>
                  <p className="text-[11px] text-ink/80 mt-0.5 leading-relaxed">{ins.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div>
              <h3 className="font-display text-base font-bold text-deep-green">Last 14 days</h3>
              <p className="text-[11px] text-muted">
                Real unlocks, sadaqah, and episode completions — no projected months
              </p>
            </div>
            {weekDelta !== null && (
              <span
                className={`text-[11px] font-bold px-2 py-1 rounded-lg ${
                  weekDelta >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                }`}
              >
                {weekDelta >= 0 ? "+" : ""}
                {weekDelta}% vs prior week
              </span>
            )}
          </div>
          <div className="h-72 w-full pt-3">
            {daily.every((d) => !d.unlocks && !d.sadaqah && !d.completions && !d.revenueTzs) ? (
              <p className="text-xs text-muted py-16 text-center">
                No dated activity in this window yet. Complete an unlock and it will plot here.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="unGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1A4D3E" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#1A4D3E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="label" stroke="#888" fontSize={10} />
                  <YAxis yAxisId="left" stroke="#888" fontSize={10} />
                  <YAxis yAxisId="right" orientation="right" stroke="#888" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={TIP}
                    formatter={(val, name) =>
                      String(name) === "Revenue TZS"
                        ? [Number(val).toLocaleString() + " TZS", "Revenue TZS"]
                        : [val, String(name ?? "")]
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Area yAxisId="right" type="monotone" dataKey="revenueTzs" name="Revenue TZS" stroke="#D4AF37" fill="url(#revGrad)" />
                  <Area yAxisId="left" type="monotone" dataKey="unlocks" name="Unlocks" stroke="#1A4D3E" fill="url(#unGrad)" />
                  <Area yAxisId="left" type="monotone" dataKey="sadaqah" name="Sadaqah" stroke="#2D7D6F" fill="#2D7D6F22" />
                  <Area yAxisId="left" type="monotone" dataKey="completions" name="Completions" stroke="#8C7335" fill="#8C733522" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5">
          <h3 className="font-display text-base font-bold text-deep-green">Conversion funnel</h3>
          <p className="text-[11px] text-muted mb-4">Where listeners drop before they pay or give</p>
          <div className="space-y-3">
            {funnel.map((step, i) => {
              const prev = i === 0 ? step.value : funnel[i - 1].value;
              const drop = prev ? Math.round((step.value / maxFunnel) * 100) : 0;
                    const stepRate = i === 0 || !prev ? null : Math.round((step.value / Math.max(1, prev)) * 100);
              return (
                <div key={step.step}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-bold text-ink">{step.step}</span>
                    <span className="text-muted">
                      {step.value}
                      {stepRate !== null ? ` · ${stepRate}% of previous` : ""}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-sand overflow-hidden">
                    <div className="h-full rounded-full bg-deep-green" style={{ width: `${drop}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-[11px] text-muted leading-relaxed">
            Free browsing has no login wall, so “active this week” can be higher than registered accounts. Phone is asked at unlock.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div>
              <h3 className="font-display text-base font-bold text-deep-green">What converts</h3>
              <p className="text-[11px] text-muted">Unlocks vs plays — produce the ones that sell</p>
            </div>
            <Link to="/admin/series" className="text-xs font-bold text-teal hover:underline">
              Catalog
            </Link>
          </div>
          <div className="h-72 w-full pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={convertLeaders.map((s) => ({ ...s, name: s.titleSw.slice(0, 16) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" stroke="#888" fontSize={10} interval={0} angle={-20} textAnchor="end" height={56} />
                <YAxis stroke="#888" fontSize={10} />
                <Tooltip contentStyle={TIP} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="unlocks" name="Paid unlocks" fill="#D4AF37" radius={[5, 5, 0, 0]} />
                <Bar dataKey="completionRate" name="Completion %" fill="#1A4D3E" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5">
          <h3 className="font-display text-base font-bold text-deep-green">Payment rails</h3>
          <p className="text-[11px] text-muted mb-2">Unlock + sadaqah only — not VIP grants</p>
          {rails.length === 0 ? (
            <p className="text-xs text-muted py-12 text-center">No payments yet.</p>
          ) : (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={rails} dataKey="revenueTzs" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3}>
                      {rails.map((_, i) => (
                        <Cell key={i} fill={RAIL_COLORS[i % RAIL_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={TIP}
                      formatter={(val: any) => [`${Number(val).toLocaleString()} TZS`, "Revenue"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                {rails.map((r, i) => (
                  <div key={r.name} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: RAIL_COLORS[i % RAIL_COLORS.length] }} />
                    <span className="font-medium">{r.name}</span>
                    <span className="ml-auto font-mono">
                      {r.count} · {r.revenueTzs.toLocaleString()} TZS
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-line bg-white p-5">
          <h3 className="font-display text-base font-bold text-deep-green">Price bands</h3>
          <p className="text-[11px] text-muted mb-2">500 / 1,000 / 1,500 TZS — owned forever</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bands}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="band" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={10} />
                <Tooltip contentStyle={TIP} />
                <Bar dataKey="unlocks" name="Unlocks" fill="#1A4D3E" radius={[6, 6, 0, 0]} />
                <Bar dataKey="revenueTzs" name="TZS" fill="#D4AF37" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <h3 className="font-display text-base font-bold text-deep-green">Finish rate by series</h3>
          <p className="text-[11px] text-muted mb-2">Among listeners who started at least one episode</p>
          <div className="h-56">
            {completionLeaders.length === 0 ? (
              <p className="text-xs text-muted py-12 text-center">No progress records yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completionLeaders.map((s) => ({ name: s.titleSw.slice(0, 18), rate: s.completionRate, starters: s.starters }))} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} stroke="#888" fontSize={10} />
                  <YAxis dataKey="name" type="category" width={110} stroke="#888" fontSize={10} />
                  <Tooltip contentStyle={TIP} formatter={(v: any) => [`${v}%`, "Completion"]} />
                  <Bar dataKey="rate" fill="#2D7D6F" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 overflow-x-auto">
        <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
          <div>
            <h3 className="font-display text-base font-bold text-deep-green">Series scorecard</h3>
            <p className="text-[11px] text-muted">
              High plays + low unlocks = fix CTA. High unlocks + low finish = fix the later episodes.
            </p>
          </div>
        </div>
        <table className="w-full text-xs">
          <thead className="text-muted uppercase tracking-wider">
            <tr>
              <th className="text-left py-2">Series</th>
              <th className="text-right">Plays</th>
              <th className="text-right">Price</th>
              <th className="text-right">Unlocks</th>
              <th className="text-right">TZS</th>
              <th className="text-right">Started</th>
              <th className="text-right">Finish %</th>
            </tr>
          </thead>
          <tbody>
            {series.map((s) => (
              <tr key={s.id} className="border-t border-line">
                <td className="py-2 font-bold text-deep-green">{s.titleSw}</td>
                <td className="text-right font-mono">{s.views.toLocaleString()}</td>
                <td className="text-right font-mono">{s.priceTzs.toLocaleString()}</td>
                <td className="text-right font-mono font-bold">{s.unlocks}</td>
                <td className="text-right font-mono">{s.revenueTzs.toLocaleString()}</td>
                <td className="text-right font-mono">{s.starters}</td>
                <td className="text-right">
                  <span
                    className={`font-bold ${
                      s.starters === 0 ? "text-muted" : s.completionRate >= 40 ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {s.starters ? `${s.completionRate}%` : "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {series.length === 0 && <p className="text-xs text-muted py-6">No published series.</p>}
      </div>
    </div>
  );
}
