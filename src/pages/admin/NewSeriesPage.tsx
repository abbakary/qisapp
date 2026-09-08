import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { slugify } from "../../lib/slug";
import { GRADIENT_KEYS, gradientFor } from "../../lib/gradients";
import { db } from "../../lib/mock/db";

export default function NewSeriesPage() {
  const navigate = useNavigate();
  const categories = db.categories.findMany();

  const [f, setF] = useState({
    title: "",
    titleSw: "",
    slug: "",
    description: "",
    descriptionSw: "",
    categoryId: categories[0]?.id ?? "",
    coverGradient: "teal",
    featured: false,
    unlockPriceTzs: 1000,
    isStoryOfWeek: false,
  });
  const [slugTouched, setSlugTouched] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof f, v: any) => setF((s) => ({ ...s, [k]: v }));
  const effectiveSlug = slugTouched ? f.slug : slugify(f.title || f.titleSw);

  function onImage(file: File | null) {
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    const existing = db.series.findBySlug(effectiveSlug);
    if (existing) {
      setBusy(false);
      setMsg({ ok: false, text: `Series slug "${effectiveSlug}" already exists.` });
      return;
    }

    const created = db.series.create({
      ...f,
      slug: effectiveSlug,
      image: preview || null,
      published: true,
    });

    setBusy(false);
    setMsg({
      ok: true,
      text: `Created "${created.titleSw}". Add at least 3 episodes to publish it well.`,
    });
    navigate(`/admin/episodes/new?series=${created.slug}`);
  }

  if (categories.length === 0) {
    return (
      <p className="text-[13px] text-muted">
        Create a category first — <Link className="font-bold text-teal" to="/admin/categories/new">add one</Link>.
      </p>
    );
  }

  return (
    <div className="max-w-md">
      <h1 className="font-display text-2xl text-deep-green">New series</h1>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block">
          <span className="field-label">English title</span>
          <input className="field-box" value={f.title} onChange={(e) => set("title", e.target.value)} required />
        </label>
        <label className="block">
          <span className="field-label">Swahili title</span>
          <input className="field-box" value={f.titleSw} onChange={(e) => set("titleSw", e.target.value)} required />
        </label>
        <label className="block">
          <span className="field-label">Slug</span>
          <input
            className="field-box"
            value={effectiveSlug}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", e.target.value);
            }}
          />
        </label>
        <label className="block">
          <span className="field-label">English description</span>
          <textarea className="field-box" rows={2} value={f.description} onChange={(e) => set("description", e.target.value)} />
        </label>
        <label className="block">
          <span className="field-label">Swahili description</span>
          <textarea className="field-box" rows={2} value={f.descriptionSw} onChange={(e) => set("descriptionSw", e.target.value)} />
        </label>
        <label className="block">
          <span className="field-label">Category</span>
          <select className="field-box" value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameSw} / {c.name}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="field-label">Cover colour (used for auto-generated art)</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {GRADIENT_KEYS.map((k) => (
              <button
                type="button"
                key={k}
                onClick={() => set("coverGradient", k)}
                className={`h-10 w-14 cursor-pointer rounded-lg transition ${
                  f.coverGradient === k ? "ring-2 ring-deep-green ring-offset-2 scale-105" : "hover:opacity-85"
                }`}
                style={{ background: gradientFor(k) }}
                title={k}
              />
            ))}
          </div>
        </div>

        <div>
          <span className="field-label">Cover image (optional)</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="field-box"
            onChange={(e) => onImage(e.target.files?.[0] ?? null)}
          />
          <p className="mt-1 text-[11px] text-muted">
            Leave empty and branded cover art is generated from the title + cover colour.
          </p>
          {preview && (
            <img src={preview} alt="" className="mt-2 h-28 w-full rounded-lg object-cover shadow-xs" />
          )}
        </div>

        <label className="block">
          <span className="field-label">Unlock price (TZS, owned forever)</span>
          <select className="field-box" value={f.unlockPriceTzs} onChange={(e) => set("unlockPriceTzs", Number(e.target.value))}>
            <option value={500}>500 — short</option>
            <option value={1000}>1,000 — standard</option>
            <option value={1500}>1,500 — long / high production</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-[12px] font-semibold text-deep-green cursor-pointer">
          <input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} className="accent-gold" />
          Featured on Home
        </label>
        <label className="flex items-center gap-2 text-[12px] font-semibold text-deep-green cursor-pointer">
          <input type="checkbox" checked={f.isStoryOfWeek} onChange={(e) => set("isStoryOfWeek", e.target.checked)} className="accent-gold" />
          Story of the week (full series free this rotation)
        </label>

        {msg && (
          <p className={`text-[12px] font-semibold ${msg.ok ? "text-teal" : "text-red-700"}`}>
            {msg.text}
          </p>
        )}

        <button disabled={busy} className="btn-primary">
          {busy ? "…" : "Create series → add episodes"}
        </button>
      </form>
    </div>
  );
}
