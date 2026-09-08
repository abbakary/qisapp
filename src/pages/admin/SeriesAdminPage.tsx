import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Film,
  Plus,
  PlaySquare,
  Edit2,
  Trash2,
  Star,
  Eye,
  CheckCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { db, subscribeDb } from "../../lib/mock/db";
import type { Series, Category } from "../../lib/mock/types";
import DataTable, { ColumnDef } from "../../components/admin/DataTable";
import ConfirmModal from "../../components/admin/ConfirmModal";

const GRADIENTS = ["teal", "forest", "gold", "deep", "olive", "emerald"];

export default function SeriesAdminPage() {
  const [, setDbVersion] = useState(0);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedFeatured, setSelectedFeatured] = useState<string>("ALL");
  const [selectedPublished, setSelectedPublished] = useState<string>("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Series | null>(null);

  // Edit modal
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [formTitleSw, setFormTitleSw] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescSw, setFormDescSw] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCatId, setFormCatId] = useState("");
  const [formGradient, setFormGradient] = useState("teal");
  const [formImage, setFormImage] = useState("");
  const [formFeatured, setFormFeatured] = useState(false);
  const [formPublished, setFormPublished] = useState(true);
  const [formPrice, setFormPrice] = useState(1000);
  const [formStoryOfWeek, setFormStoryOfWeek] = useState(false);

  useEffect(() => {
    setSeriesList(db.series.findMany());
    setCategories(db.categories.findMany());
    return subscribeDb(() => {
      setDbVersion((v) => v + 1);
      setSeriesList(db.series.findMany());
      setCategories(db.categories.findMany());
    });
  }, []);

  const filteredSeries = useMemo(() => {
    return seriesList.filter((s) => {
      if (selectedCategory !== "ALL" && s.categoryId !== selectedCategory) return false;
      if (selectedFeatured === "YES" && !s.featured) return false;
      if (selectedFeatured === "NO" && s.featured) return false;
      if (selectedPublished === "YES" && !s.published) return false;
      if (selectedPublished === "NO" && s.published) return false;
      return true;
    });
  }, [seriesList, selectedCategory, selectedFeatured, selectedPublished]);

  function openEdit(s: Series) {
    setEditingSeries(s);
    setFormTitleSw(s.titleSw);
    setFormTitle(s.title);
    setFormDescSw(s.descriptionSw);
    setFormDesc(s.description);
    setFormCatId(s.categoryId);
    setFormGradient(s.coverGradient);
    setFormImage(s.image || "");
    setFormFeatured(s.featured);
    setFormPublished(s.published);
    setFormPrice(s.unlockPriceTzs || 1000);
    setFormStoryOfWeek(!!s.isStoryOfWeek);
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSeries) return;

    db.series.updateBySlug(editingSeries.slug, {
      titleSw: formTitleSw.trim(),
      title: formTitle.trim(),
      descriptionSw: formDescSw.trim(),
      description: formDesc.trim(),
      categoryId: formCatId,
      coverGradient: formGradient,
      image: formImage.trim() || null,
      featured: formFeatured,
      published: formPublished,
      unlockPriceTzs: formPrice,
      isStoryOfWeek: formStoryOfWeek,
    });

    setEditingSeries(null);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    db.series.delete(deleteTarget.id);
    setDeleteTarget(null);
  }

  function handleBulkDelete() {
    selectedIds.forEach((id) => db.series.delete(id));
    setSelectedIds([]);
  }

  function handleBulkTogglePublish(publish: boolean) {
    selectedIds.forEach((id) => {
      const s = db.series.findById(id);
      if (s) db.series.updateBySlug(s.slug, { published: publish });
    });
    setSelectedIds([]);
  }

  const columns: ColumnDef<Series>[] = [
    {
      id: "cover",
      header: "Visual",
      width: "70px",
      cell: (s) => (
        <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-sand border border-line flex items-center justify-center">
          {s.image ? (
            <img src={s.image} alt={s.title} className="h-full w-full object-cover" />
          ) : (
            <div className={`h-full w-full bg-cover-gradient-${s.coverGradient} flex items-center justify-center text-xs font-bold text-white uppercase`}>
              {s.coverGradient.slice(0, 2)}
            </div>
          )}
          {s.featured && (
            <span className="absolute bottom-0.5 right-0.5 bg-gold text-deep-green p-0.5 rounded-full text-[9px]">
              ★
            </span>
          )}
        </div>
      ),
    },
    {
      id: "titleSw",
      header: "Series Title (Swahili / English)",
      sortable: true,
      cell: (s) => (
        <div>
          <Link
            to={`/admin/series/${s.slug}`}
            className="font-bold text-deep-green text-sm hover:text-teal hover:underline flex items-center gap-1.5"
          >
            <span>{s.titleSw}</span>
            <ExternalLink className="h-3 w-3 text-muted" />
          </Link>
          <div className="text-[11px] text-muted truncate max-w-sm">{s.title}</div>
        </div>
      ),
    },
    {
      id: "category",
      header: "Category",
      sortable: true,
      accessor: (s) => {
        const cat = categories.find((c) => c.id === s.categoryId);
        return cat?.nameSw || "General";
      },
      cell: (s) => {
        const cat = categories.find((c) => c.id === s.categoryId);
        return (
          <span className="bg-sand text-deep-green text-[11px] font-bold px-2 py-0.5 rounded-md">
            {cat?.nameSw || "General"}
          </span>
        );
      },
    },
    {
      id: "episodes",
      header: "Episodes",
      align: "center",
      sortable: true,
      accessor: (s) => db.series.episodeCount(s.id),
      cell: (s) => {
        const count = db.series.episodeCount(s.id);
        return (
          <Link
            to={`/admin/series/${s.slug}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-teal bg-teal/10 hover:bg-teal/20 px-2 py-1 rounded-lg transition"
          >
            <PlaySquare className="h-3 w-3" />
            <span>{count} eps</span>
          </Link>
        );
      },
    },
    {
      id: "price",
      header: "Unlock TZS",
      align: "right",
      sortable: true,
      accessor: (s) => s.unlockPriceTzs || 0,
      cell: (s) => (
        <span className="font-mono text-xs font-bold text-deep-green">
          {(s.unlockPriceTzs || 0).toLocaleString()}
        </span>
      ),
    },
    {
      id: "sow",
      header: "Week",
      align: "center",
      width: "70px",
      cell: (s) =>
        s.isStoryOfWeek ? (
          <span className="rounded-full bg-gold/20 text-gold-dark px-2 py-0.5 text-[10px] font-extrabold">WEEK</span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      id: "views",
      header: "Total Plays",
      align: "right",
      sortable: true,
      accessor: (s) => s.views || 0,
      cell: (s) => (
        <span className="font-mono text-xs font-bold text-ink">
          {(s.views || 0).toLocaleString()}
        </span>
      ),
    },
    {
      id: "featured",
      header: "Featured",
      align: "center",
      width: "90px",
      cell: (s) => (
        <button
          onClick={() => db.series.toggleFeatured(s.id)}
          className={`p-1 rounded-lg text-xs font-bold transition cursor-pointer ${
            s.featured
              ? "bg-gold/20 text-gold-dark hover:bg-gold/30"
              : "bg-sand text-muted hover:text-ink"
          }`}
          title="Toggle Home Hero Featured"
        >
          <Star className={`h-4 w-4 ${s.featured ? "fill-gold text-gold" : "text-muted"}`} />
        </button>
      ),
    },
    {
      id: "published",
      header: "Status",
      align: "center",
      width: "100px",
      cell: (s) => (
        <button
          onClick={() => db.series.togglePublished(s.id)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
            s.published
              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
              : "bg-rose-100 text-rose-800 hover:bg-rose-200"
          }`}
        >
          {s.published ? (
            <>
              <CheckCircle className="h-3 w-3" />
              <span>Live</span>
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3" />
              <span>Draft</span>
            </>
          )}
        </button>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      width: "120px",
      cell: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            to={`/admin/series/${s.slug}`}
            className="p-1.5 rounded-lg border border-line text-ink hover:bg-sand/40 transition"
            title="Manage Episodes"
          >
            <PlaySquare className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => openEdit(s)}
            className="p-1.5 rounded-lg border border-line text-ink hover:bg-sand/40 hover:text-deep-green transition cursor-pointer"
            title="Edit Series Meta"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeleteTarget(s)}
            className="p-1.5 rounded-lg border border-line text-red-600 hover:bg-red-50 transition cursor-pointer"
            title="Delete Series"
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
            <Film className="h-6 w-6 text-gold" />
            Series Catalog
          </h1>
          <p className="text-[13px] text-muted mt-0.5">
            Section 7.2 Series Schema · Manage Islamic audio and video series, gradients, featured hero status, and episode cascades.
          </p>
        </div>

        <Link
          to="/admin/series/new"
          className="flex items-center gap-1.5 bg-deep-green hover:bg-teal text-warm-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 text-gold-light" />
          <span>New Series</span>
        </Link>
      </div>

      {/* Series Table with Filters & Multi-Selection */}
      <DataTable
        columns={columns}
        data={filteredSeries}
        keyField="id"
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        searchPlaceholder="Search title, description, or slug..."
        searchFilter={(s, q) =>
          s.title.toLowerCase().includes(q) ||
          s.titleSw.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.descriptionSw.toLowerCase().includes(q)
        }
        filterSlot={
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-line bg-sand/30 px-2.5 py-2 text-ink focus:bg-white focus:border-gold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameSw}
                </option>
              ))}
            </select>

            <select
              value={selectedFeatured}
              onChange={(e) => setSelectedFeatured(e.target.value)}
              className="rounded-xl border border-line bg-sand/30 px-2.5 py-2 text-ink focus:bg-white focus:border-gold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Featured</option>
              <option value="YES">★ Featured Hero</option>
              <option value="NO">Standard</option>
            </select>

            <select
              value={selectedPublished}
              onChange={(e) => setSelectedPublished(e.target.value)}
              className="rounded-xl border border-line bg-sand/30 px-2.5 py-2 text-ink focus:bg-white focus:border-gold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="YES">Live Only</option>
              <option value="NO">Drafts Only</option>
            </select>
          </div>
        }
        bulkActions={(ids, clear) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkTogglePublish(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition cursor-pointer"
            >
              Publish Selected
            </button>
            <button
              onClick={() => handleBulkTogglePublish(false)}
              className="px-2.5 py-1 rounded-lg bg-sand text-ink font-bold text-[11px] hover:bg-sand/70 transition cursor-pointer"
            >
              Unpublish Selected
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold text-[11px] hover:bg-red-700 transition cursor-pointer"
            >
              Delete Selected
            </button>
            <button
              onClick={clear}
              className="px-2 py-1 text-[11px] text-muted hover:text-ink cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      />

      {/* Edit Series Modal */}
      {editingSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-line max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="font-display text-lg font-bold text-deep-green">Edit Series Details</h3>
              <button
                onClick={() => setEditingSeries(null)}
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
                    Category *
                  </label>
                  <select
                    value={formCatId}
                    onChange={(e) => setFormCatId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-semibold text-ink focus:bg-white focus:border-gold focus:outline-none cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameSw} ({c.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                    Cover Gradient
                  </label>
                  <select
                    value={formGradient}
                    onChange={(e) => setFormGradient(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-semibold text-ink focus:bg-white focus:border-gold focus:outline-none cursor-pointer"
                  >
                    {GRADIENTS.map((g) => (
                      <option key={g} value={g}>
                        {g.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  Kiswahili Description
                </label>
                <textarea
                  value={formDescSw}
                  onChange={(e) => setFormDescSw(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs text-ink focus:bg-white focus:border-gold focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  English Description
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs text-ink focus:bg-white focus:border-gold focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  Image URL / Asset Path
                </label>
                <input
                  type="text"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs text-ink focus:bg-white focus:border-gold focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  Unlock price (TZS, once, forever)
                </label>
                <select
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-semibold text-ink"
                >
                  <option value={500}>500 — short series</option>
                  <option value={1000}>1,000 — standard</option>
                  <option value={1500}>1,500 — long / high production</option>
                </select>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink">
                  <input
                    type="checkbox"
                    checked={formStoryOfWeek}
                    onChange={(e) => setFormStoryOfWeek(e.target.checked)}
                    className="rounded border-line text-deep-green focus:ring-gold"
                  />
                  <span>Story of the week (full catalog free this week)</span>
                </label>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink">
                  <input
                    type="checkbox"
                    checked={formFeatured}
                    onChange={(e) => setFormFeatured(e.target.checked)}
                    className="rounded border-line text-deep-green focus:ring-gold"
                  />
                  <span>Featured Hero on Home</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink">
                  <input
                    type="checkbox"
                    checked={formPublished}
                    onChange={(e) => setFormPublished(e.target.checked)}
                    className="rounded border-line text-deep-green focus:ring-gold"
                  />
                  <span>Published (Live to Viewers)</span>
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setEditingSeries(null)}
                  className="rounded-xl border border-line px-4 py-2 text-xs font-bold text-ink hover:bg-sand/40 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-deep-green px-4 py-2 text-xs font-bold text-warm-white hover:bg-teal transition shadow-xs cursor-pointer"
                >
                  Save Series
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={`Cascade Delete Series "${deleteTarget?.titleSw}"?`}
        message={
          deleteTarget
            ? `Warning: Deleting this series will CASCADE and permanently delete all ${db.series.episodeCount(
                deleteTarget.id,
              )} child episodes, listener progress records, and comments. This cannot be undone.`
            : ""
        }
        confirmLabel="Yes, Cascade Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
