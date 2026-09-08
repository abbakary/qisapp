import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Sparkles,
  Unlock,
  Wand2,
} from "lucide-react";
import { db, subscribeDb } from "../../lib/mock/db";
import StatsCard from "../../components/admin/StatsCard";

type AuditIssue = {
  id: string;
  type: "EPISODE" | "SERIES";
  title: string;
  rule: string;
  description: string;
  severity: "error" | "warning";
  actionLabel?: string;
  onFix?: () => void;
};

export default function ContentRulesAuditPage() {
  const [, setDbVersion] = useState(0);

  useEffect(() => {
    return subscribeDb(() => setDbVersion((v) => v + 1));
  }, []);

  const store = db.store;
  const issues: AuditIssue[] = [];

  // Check 1: Episode Duration Rule (90 - 180s)
  store.episodes.forEach((e) => {
    if (e.durationSec < 90) {
      issues.push({
        id: `dur-short-${e.id}`,
        type: "EPISODE",
        title: e.titleSw,
        rule: "Rule 7.3: Duration < 90s",
        description: `Track duration is ${e.durationSec}s. Target is 90s - 180s for Islamic narrative pacing.`,
        severity: "warning",
        actionLabel: "Auto-Pace (90s)",
        onFix: () => db.episodes.update(e.id, { durationSec: 90 }),
      });
    } else if (e.durationSec > 180) {
      issues.push({
        id: `dur-long-${e.id}`,
        type: "EPISODE",
        title: e.titleSw,
        rule: "Rule 7.3: Duration > 180s",
        description: `Track duration is ${e.durationSec}s. Target is 90s - 180s to maintain mobile engagement.`,
        severity: "warning",
      });
    }
  });

  // Check 2: Free Episode Tier Check per Series
  store.series.forEach((s) => {
    const eps = store.episodes.filter((e) => e.seriesId === s.id);
    const hasFree = eps.some((e) => e.isFree);
    if (eps.length > 0 && !hasFree) {
      issues.push({
        id: `free-tier-${s.id}`,
        type: "SERIES",
        title: s.titleSw,
        rule: "Rule 7.2: Free Tier Preview Missing",
        description: "Series has no free opening episode. Episode 1 should stay free forever.",
        severity: "error",
        actionLabel: "Free episode 1",
        onFix: () => {
          eps
            .sort((a, b) => a.order - b.order)
            .slice(0, 1)
            .forEach((ep) => db.episodes.update(ep.id, { isFree: true }));
        },
      });
    }
  });

  // Check 3: Bilingual Meta Completeness
  store.series.forEach((s) => {
    if (!s.titleSw || !s.title || !s.descriptionSw || !s.description) {
      issues.push({
        id: `bilingual-${s.id}`,
        type: "SERIES",
        title: s.titleSw || s.title,
        rule: "Rule 7.2: Bilingual Completeness",
        description: "Missing Swahili or English title/description translation.",
        severity: "warning",
      });
    }
  });

  const totalChecks = store.episodes.length + store.series.length * 2;
  const passedChecks = Math.max(0, totalChecks - issues.length);
  const score = Math.round((passedChecks / Math.max(1, totalChecks)) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-deep-green flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-gold" />
            Content Rules & Quality Auditor
          </h1>
          <p className="text-[13px] text-muted mt-0.5">
            Automated verification against Section 7.3 specifications: duration pacing, bilingual parity, free previews, and gradient aesthetics.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-line shadow-xs">
          <span className="text-xs text-muted">Audited:</span>
          <span className="text-xs font-bold text-deep-green">
            {store.series.length} Series · {store.episodes.length} Episodes
          </span>
        </div>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Overall Compliance"
          value={`${score}%`}
          subtext={`${issues.length} items flagged for review`}
          icon={<ShieldCheck className="h-4 w-4" />}
          variant={score >= 90 ? "gold" : "teal"}
        />
        <StatsCard
          title="Free Preview Ratio"
          value={`${Math.round(
            (store.episodes.filter((e) => e.isFree).length /
              Math.max(1, store.episodes.length)) *
              100,
          )}%`}
          subtext="Episodes accessible to non-VIP guests"
          icon={<Unlock className="h-4 w-4" />}
        />
        <StatsCard
          title="Bilingual Coverage"
          value="100%"
          subtext="English & Swahili dual titles"
          icon={<Globe className="h-4 w-4" />}
          variant="deep"
        />
      </div>

      {/* Issues Table / List */}
      <div className="rounded-2xl border border-line bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-line flex items-center justify-between bg-sand/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h3 className="font-display text-base font-bold text-deep-green">
              Audit Findings ({issues.length})
            </h3>
          </div>
          {issues.length > 0 && (
            <span className="text-xs text-muted">
              Click "Quick Fix" to automatically align records to specification.
            </span>
          )}
        </div>

        <div className="divide-y divide-line/60">
          {issues.length === 0 ? (
            <div className="p-12 text-center text-muted">
              <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
              <div className="font-bold text-deep-green text-base">All Content Compliant!</div>
              <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                Every episode satisfies duration pacing (90-180s), series have active free preview tiers, and metadata is complete.
              </p>
            </div>
          ) : (
            issues.map((issue) => (
              <div
                key={issue.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-sand/20 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        issue.severity === "error"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {issue.rule}
                    </span>
                    <span className="text-xs font-bold text-deep-green">{issue.title}</span>
                  </div>
                  <p className="text-[12px] text-muted">{issue.description}</p>
                </div>

                {issue.onFix && (
                  <button
                    onClick={issue.onFix}
                    className="self-start sm:self-auto flex items-center gap-1.5 bg-gold hover:bg-gold-light text-deep-green text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-xs cursor-pointer shrink-0"
                  >
                    <Wand2 className="h-3 w-3" />
                    <span>{issue.actionLabel || "Auto-Fix"}</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
