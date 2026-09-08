import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  Database,
  Download,
  Upload,
  HardDrive,
  CheckCircle,
  AlertTriangle,
  FileCode,
  Layers,
} from "lucide-react";
import { db, subscribeDb, resetStoreToSeed, DB_STORE_KEY } from "../../lib/mock/db";
import ConfirmModal from "../../components/admin/ConfirmModal";
import StatsCard from "../../components/admin/StatsCard";

export default function SystemAdminPage() {
  const [, setDbVersion] = useState(0);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    return subscribeDb(() => setDbVersion((v) => v + 1));
  }, []);

  const store = db.store;

  // Calculate approximate storage usage
  const rawData = localStorage.getItem(DB_STORE_KEY) || "";
  const byteSize = new Blob([rawData]).size;
  const kbSize = (byteSize / 1024).toFixed(2);

  const collections = [
    { name: "Categories (7.1)", count: store.categories.length, icon: "📁" },
    { name: "Series Catalog (7.2)", count: store.series.length, icon: "🎬" },
    { name: "Episodes & Audio (7.3)", count: store.episodes.length, icon: "🎵" },
    { name: "User Accounts (7.4)", count: store.users.length, icon: "👥" },
    { name: "VIP Subscriptions (7.5)", count: store.subscriptions.length, icon: "💳" },
    { name: "User Comments (7.6)", count: store.comments.length, icon: "💬" },
    { name: "Community Submissions (7.7)", count: store.communityUploads.length, icon: "📤" },
    { name: "Push Notifications (7.8)", count: store.notifications.length, icon: "🔔" },
    { name: "Video Render Jobs (7.9)", count: store.videoJobs.length, icon: "⚡" },
  ];

  function handleExportBackup() {
    const dataStr = JSON.stringify(store, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qisas-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.categories && json.series && json.episodes) {
          localStorage.setItem(DB_STORE_KEY, JSON.stringify(json));
          setImportStatus("Database restored successfully from JSON backup!");
          setTimeout(() => window.location.reload(), 800);
        } else {
          setImportStatus("Invalid backup format: missing core collections.");
        }
      } catch (err) {
        setImportStatus("Error parsing JSON backup file.");
      }
    };
    reader.readAsText(file);
  }

  function handleConfirmReset() {
    void resetStoreToSeed();
    setResetModalOpen(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-deep-green flex items-center gap-2">
            <HardDrive className="h-6 w-6 text-gold" />
            System Diagnostic & Database Maintenance
          </h1>
          <p className="text-[13px] text-muted mt-0.5">
            Manage local persistence storage, export JSON database snapshots, or restore system seed defaults.
          </p>
        </div>

        <button
          onClick={() => setResetModalOpen(true)}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset All Data to Seed</span>
        </button>
      </div>

      {importStatus && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
          {importStatus}
        </div>
      )}

      {/* Storage KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Persistence Storage Engine"
          value="LocalStorage v2"
          subtext={`Key: ${DB_STORE_KEY}`}
          icon={<Database className="h-4 w-4" />}
          variant="deep"
        />
        <StatsCard
          title="Current Memory Footprint"
          value={`${kbSize} KB`}
          subtext="JSON payload cached"
          icon={<HardDrive className="h-4 w-4" />}
          variant="gold"
        />
        <StatsCard
          title="Total Entity Documents"
          value={collections.reduce((sum, c) => sum + c.count, 0)}
          subtext="Across 9 relational collections"
          icon={<Layers className="h-4 w-4" />}
          variant="teal"
        />
      </div>

      {/* Collections Schema Table */}
      <div className="rounded-2xl border border-line bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-line bg-sand/20 flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-deep-green flex items-center gap-2">
            <FileCode className="h-4 w-4 text-gold" />
            Collection Schemas & Record Counts
          </h3>
          <span className="text-xs text-muted">9 of 9 Collections Operational</span>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {collections.map((c) => (
            <div
              key={c.name}
              className="p-3.5 rounded-xl border border-line bg-sand/10 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{c.icon}</span>
                <span className="text-xs font-bold text-deep-green">{c.name}</span>
              </div>
              <span className="font-mono text-xs font-bold bg-white px-2.5 py-1 rounded-lg border border-line text-ink">
                {c.count} records
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Export & Import Backup Box */}
      <div className="rounded-2xl border border-line bg-white p-6 shadow-xs space-y-4">
        <h3 className="font-display text-base font-bold text-deep-green flex items-center gap-2 pb-3 border-b border-line">
          <Database className="h-4 w-4 text-gold" />
          JSON Backup & Disaster Recovery
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-line bg-sand/20 space-y-3">
            <div className="font-bold text-sm text-deep-green">Download Backup Archive</div>
            <p className="text-xs text-muted leading-relaxed">
              Export an immediate full snapshot of your entire Qisas database, including users, series, VIP subscriptions, and community uploads.
            </p>
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 bg-deep-green hover:bg-teal text-warm-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
            >
              <Download className="h-4 w-4 text-gold-light" />
              <span>Export JSON Snapshot</span>
            </button>
          </div>

          <div className="p-4 rounded-xl border border-line bg-sand/20 space-y-3">
            <div className="font-bold text-sm text-deep-green">Restore Backup File</div>
            <p className="text-xs text-muted leading-relaxed">
              Upload a previously exported JSON backup file to overwrite and restore the store.
            </p>
            <label className="inline-flex items-center gap-1.5 bg-white border border-line hover:bg-sand/40 text-deep-green text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-2xs">
              <Upload className="h-4 w-4 text-gold" />
              <span>Choose Backup File...</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={resetModalOpen}
        title="Reset Entire Database to Default Seed?"
        message="This will wipe all existing custom series, episodes, VIP subscriptions, community submissions, and user accounts, restoring the canonical Islamic seed data. This action is irreversible."
        confirmLabel="Reset Everything"
        variant="danger"
        onConfirm={handleConfirmReset}
        onCancel={() => setResetModalOpen(false)}
      />
    </div>
  );
}
