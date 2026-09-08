import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit2, Trash2, Layers, AlertTriangle } from "lucide-react";
import { db, subscribeDb } from "../../lib/mock/db";
import type { Category } from "../../lib/mock/types";
import DataTable, { ColumnDef } from "../../components/admin/DataTable";
import ConfirmModal from "../../components/admin/ConfirmModal";

export default function CategoriesAdminPage() {
  const [, setDbVersion] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formNameSw, setFormNameSw] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formOrder, setFormOrder] = useState(1);
  const [formImage, setFormImage] = useState("");
  const [formIcon, setFormIcon] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setCategories(db.categories.findMany());
    return subscribeDb(() => {
      setDbVersion((v) => v + 1);
      setCategories(db.categories.findMany());
    });
  }, []);

  function openCreate() {
    setEditingCategory(null);
    setFormName("");
    setFormNameSw("");
    setFormSlug("");
    setFormOrder(categories.length + 1);
    setFormImage("");
    setFormIcon("");
    setFormError("");
    setIsModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormNameSw(cat.nameSw);
    setFormSlug(cat.slug);
    setFormOrder(cat.order);
    setFormImage(cat.image || "");
    setFormIcon(cat.iconName || "");
    setFormError("");
    setIsModalOpen(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formNameSw.trim()) {
      setFormError("Both English and Swahili names are required.");
      return;
    }

    const slug = formSlug.trim() || formName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    // Check slug uniqueness
    const existing = db.categories.findBySlug(slug);
    if (existing && (!editingCategory || existing.id !== editingCategory.id)) {
      setFormError(`A category with slug "${slug}" already exists.`);
      return;
    }

    if (editingCategory) {
      db.categories.updateBySlug(editingCategory.slug, {
        name: formName.trim(),
        nameSw: formNameSw.trim(),
        slug,
        order: Number(formOrder),
        image: formImage.trim() || null,
        iconName: formIcon.trim() || undefined,
      });
    } else {
      db.categories.create({
        name: formName.trim(),
        nameSw: formNameSw.trim(),
        slug,
        order: Number(formOrder),
        image: formImage.trim() || null,
        iconName: formIcon.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    db.categories.delete(deleteTarget.id);
    setDeleteTarget(null);
  }

  const columns: ColumnDef<Category>[] = [
    {
      id: "image",
      header: "Visual",
      width: "70px",
      cell: (cat) => (
        <div className="h-10 w-10 rounded-xl overflow-hidden bg-sand border border-line flex items-center justify-center">
          {cat.image ? (
            <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />
          ) : (
            <Layers className="h-5 w-5 text-muted" />
          )}
        </div>
      ),
    },
    {
      id: "nameSw",
      header: "Kiswahili Name",
      sortable: true,
      cell: (cat) => (
        <div>
          <div className="font-bold text-deep-green text-sm">{cat.nameSw}</div>
          <div className="text-[11px] text-muted font-mono">{cat.slug}</div>
        </div>
      ),
    },
    {
      id: "name",
      header: "English Name",
      sortable: true,
      accessor: (cat) => cat.name,
    },
    {
      id: "order",
      header: "Rail Order",
      sortable: true,
      align: "center",
      width: "100px",
      cell: (cat) => (
        <span className="font-mono text-xs font-bold bg-sand px-2 py-1 rounded-md">
          #{cat.order}
        </span>
      ),
    },
    {
      id: "seriesCount",
      header: "Active Series",
      align: "center",
      width: "120px",
      cell: (cat) => {
        const count = db.categories.seriesCount(cat.id);
        return (
          <span className="font-semibold text-deep-green text-xs">
            {count} series
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      width: "120px",
      cell: (cat) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEdit(cat)}
            className="p-1.5 rounded-lg border border-line text-ink hover:bg-sand/40 hover:text-deep-green transition cursor-pointer"
            title="Edit Category"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeleteTarget(cat)}
            className="p-1.5 rounded-lg border border-line text-red-600 hover:bg-red-50 transition cursor-pointer"
            title="Delete Category"
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
            <Layers className="h-6 w-6 text-gold" />
            Category Management
          </h1>
          <p className="text-[13px] text-muted mt-0.5">
            Section 7.1 Category Schema · Define rails and categories for client-side browsing.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-deep-green hover:bg-teal text-warm-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 text-gold-light" />
          <span>New Category</span>
        </button>
      </div>

      {/* Categories Table */}
      <DataTable
        columns={columns}
        data={categories}
        searchPlaceholder="Search categories..."
        searchFilter={(cat, q) =>
          cat.name.toLowerCase().includes(q) ||
          cat.nameSw.toLowerCase().includes(q) ||
          cat.slug.toLowerCase().includes(q)
        }
      />

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-line">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="font-display text-lg font-bold text-deep-green">
                {editingCategory ? "Edit Category" : "Create New Category"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted hover:text-ink text-lg p-1 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5">
              {formError && (
                <div className="text-[12px] font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  Kiswahili Name *
                </label>
                <input
                  type="text"
                  value={formNameSw}
                  onChange={(e) => setFormNameSw(e.target.value)}
                  placeholder="e.g. Manabii, Maswahaba, Sira"
                  required
                  className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-semibold text-ink focus:bg-white focus:border-gold focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  English Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Prophets, Companions, Seerah"
                  required
                  className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-semibold text-ink focus:bg-white focus:border-gold focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. manabii"
                    className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-mono text-ink focus:bg-white focus:border-gold focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value))}
                    min={1}
                    className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-bold text-ink focus:bg-white focus:border-gold focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  Image URL / Asset Path
                </label>
                <input
                  type="text"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="/media/categories/manabii.jpg or HTTPS URL"
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
                  className="rounded-xl bg-deep-green px-4 py-2 text-xs font-bold text-warm-white hover:bg-teal transition shadow-xs cursor-pointer"
                >
                  {editingCategory ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={`Delete Category "${deleteTarget?.nameSw}"?`}
        message={
          deleteTarget && db.categories.seriesCount(deleteTarget.id) > 0
            ? `Warning: This category currently has ${db.categories.seriesCount(
                deleteTarget.id,
              )} active series. Deleting it will orphan or re-assign these series.`
            : "Are you sure you want to delete this category? This action cannot be undone."
        }
        confirmLabel="Delete Category"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
